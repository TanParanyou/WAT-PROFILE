package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrAiTranslateDisabled      = errors.New("AI translation is currently disabled in settings")
	ErrAiTranslateNotConfigured = errors.New("GEMINI_API_KEY is not configured")
	ErrAiTranslateEmptyText     = errors.New("text to translate cannot be empty")
)

type AiTranslationService struct {
	db         *gorm.DB
	httpClient *http.Client

	mu               sync.RWMutex
	discoveredModels []string
	cacheExpiry      time.Time
}

func NewAiTranslationService(db *gorm.DB) *AiTranslationService {
	return &AiTranslationService{
		db: db,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiRequest struct {
	SystemInstruction *geminiContent  `json:"system_instruction,omitempty"`
	Contents          []geminiContent `json:"contents"`
	GenerationConfig  struct {
		ResponseMimeType string   `json:"responseMimeType,omitempty"`
		Temperature      *float64 `json:"temperature,omitempty"`
		TopP             *float64 `json:"topP,omitempty"`
	} `json:"generationConfig,omitempty"`
}

type geminiCandidate struct {
	Content struct {
		Parts []geminiPart `json:"parts"`
	} `json:"content"`
}

type geminiResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
	Error      *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error,omitempty"`
}

type geminiModelItem struct {
	Name                       string   `json:"name"` // e.g. "models/gemini-3.6-flash"
	SupportedGenerationMethods []string `json:"supportedGenerationMethods"`
}

type geminiListModelsResponse struct {
	Models []geminiModelItem `json:"models"`
	Error  *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// IsEnabled checks whether AI translation is enabled in settings
func (s *AiTranslationService) IsEnabled() bool {
	var setting models.Setting
	err := s.db.Where("key = ?", "ai_translate_enabled").First(&setting).Error
	if err != nil {
		// Default to true if setting row doesn't exist yet, as long as API key is present
		return true
	}
	return setting.Value == "true" || setting.Value == "1"
}

// getCandidateModels dynamically discovers available Gemini models for this API key with caching
func (s *AiTranslationService) getCandidateModels(ctx context.Context, apiKey string) []string {
	if envModel := os.Getenv("GEMINI_MODEL"); envModel != "" {
		return []string{envModel}
	}

	s.mu.RLock()
	if len(s.discoveredModels) > 0 && time.Now().Before(s.cacheExpiry) {
		cached := make([]string, len(s.discoveredModels))
		copy(cached, s.discoveredModels)
		s.mu.RUnlock()
		return cached
	}
	s.mu.RUnlock()

	// Fetch live model list from Google Gemini API
	listUrl := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, listUrl, nil)
	if err == nil {
		resp, err := s.httpClient.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				bodyBytes, _ := io.ReadAll(resp.Body)
				var listResp geminiListModelsResponse
				if err := json.Unmarshal(bodyBytes, &listResp); err == nil && len(listResp.Models) > 0 {
					var flashModels []string
					var otherModels []string

					for _, m := range listResp.Models {
						// Must support generateContent
						supportsGenerate := false
						for _, method := range m.SupportedGenerationMethods {
							if method == "generateContent" {
								supportsGenerate = true
								break
							}
						}
						if !supportsGenerate {
							continue
						}

						modelName := strings.TrimPrefix(m.Name, "models/")
						// We prefer flash models (free tier & fast)
						if strings.Contains(modelName, "flash") {
							flashModels = append(flashModels, modelName)
						} else {
							otherModels = append(otherModels, modelName)
						}
					}

					// Sort descending so newer versions (e.g. 3.7, 3.6, 2.5, 2.0) appear first
					sort.Slice(flashModels, func(i, j int) bool {
						return flashModels[i] > flashModels[j]
					})
					sort.Slice(otherModels, func(i, j int) bool {
						return otherModels[i] > otherModels[j]
					})

					combined := append(flashModels, otherModels...)
					if len(combined) > 0 {
						s.mu.Lock()
						s.discoveredModels = combined
						s.cacheExpiry = time.Now().Add(6 * time.Hour)
						s.mu.Unlock()

						log.Info().Strs("models", combined).Msg("Successfully discovered available Gemini models from Google API")
						return combined
					}
				}
			}
		}
	}

	// Fallback list if dynamic discovery is unavailable
	fallback := []string{
		"gemini-3.6-flash",
		"gemini-3.7-flash",
		"gemini-2.5-flash",
		"gemini-2.0-flash",
		"gemini-1.5-flash",
	}
	return fallback
}

// TranslateDraft translates text from sourceLang to targetLangs using Google Gemini API
func (s *AiTranslationService) TranslateDraft(ctx context.Context, text string, sourceLang string, targetLangs []string) (map[string]string, error) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return nil, ErrAiTranslateEmptyText
	}

	if !s.IsEnabled() {
		return nil, ErrAiTranslateDisabled
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		// Check fallback in settings if stored there
		var keySetting models.Setting
		if err := s.db.Where("key = ?", "gemini_api_key").First(&keySetting).Error; err == nil && keySetting.Value != "" {
			apiKey = keySetting.Value
		}
	}

	if apiKey == "" {
		return nil, ErrAiTranslateNotConfigured
	}

	filteredTargets := make([]string, 0, len(targetLangs))
	for _, lang := range targetLangs {
		l := strings.ToLower(strings.TrimSpace(lang))
		if l != "" && l != strings.ToLower(sourceLang) {
			filteredTargets = append(filteredTargets, l)
		}
	}

	if len(filteredTargets) == 0 {
		return map[string]string{}, nil
	}

	prompt := fmt.Sprintf(`You are a specialized translator for a Theravada Buddhist temple website (Wat Loung Por Sai in Germany).
Translate the following %s text into %s.

Context and Rules:
1. Maintain a calm, respectful, accurate, and welcoming tone suitable for a Buddhist temple.
2. Accurately preserve Buddhist terms (e.g. Dhamma/Dharma, Sangha, Kathina, Vihara, Meditation, Luang Por Sai, Phra, Monks, etc.).
3. Return ONLY a valid JSON object where keys are the target language codes (%s) and values are the translated text.

Source text:
"""
%s
"""`, strings.ToUpper(sourceLang), strings.Join(filteredTargets, ", "), strings.Join(filteredTargets, ", "), trimmed)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
				},
			},
		},
	}
	reqBody.GenerationConfig.ResponseMimeType = "application/json"

	jsonPayload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to encode gemini request: %w", err)
	}

	// Dynamically discover candidate models matching user's API key
	modelsToTry := s.getCandidateModels(ctx, apiKey)

	var lastErr error
	for _, modelName := range modelsToTry {
		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelName, apiKey)

		httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonPayload))
		if err != nil {
			lastErr = err
			continue
		}
		httpReq.Header.Set("Content-Type", "application/json")

		resp, err := s.httpClient.Do(httpReq)
		if err != nil {
			log.Error().Err(err).Str("model", modelName).Msg("failed to call Gemini API")
			lastErr = fmt.Errorf("AI translation service request failed: %w", err)
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = fmt.Errorf("failed to read Gemini response: %w", err)
			continue
		}

		var geminiResp geminiResponse
		_ = json.Unmarshal(bodyBytes, &geminiResp)

		if resp.StatusCode != http.StatusOK {
			errMsg := fmt.Sprintf("Gemini API error (status %d)", resp.StatusCode)
			if geminiResp.Error != nil && geminiResp.Error.Message != "" {
				errMsg = fmt.Sprintf("Gemini API error: %s (code: %d)", geminiResp.Error.Message, geminiResp.Error.Code)
			}
			log.Warn().Int("status", resp.StatusCode).Str("model", modelName).Str("error", errMsg).Msg("Gemini model call failed, trying next candidate")
			lastErr = errors.New(errMsg)
			continue
		}

		if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
			lastErr = errors.New("Gemini returned empty candidate content")
			continue
		}

		rawText := geminiResp.Candidates[0].Content.Parts[0].Text
		rawText = strings.TrimSpace(rawText)
		// Clean markdown code fence if returned
		rawText = strings.TrimPrefix(rawText, "```json")
		rawText = strings.TrimPrefix(rawText, "```")
		rawText = strings.TrimSuffix(rawText, "```")
		rawText = strings.TrimSpace(rawText)

		var translations map[string]string
		if err := json.Unmarshal([]byte(rawText), &translations); err != nil {
			log.Error().Err(err).Str("raw", rawText).Msg("failed to parse json translations from Gemini")
			lastErr = fmt.Errorf("failed to parse AI translation output: %w", err)
			continue
		}

		result := make(map[string]string)
		for _, target := range filteredTargets {
			if val, ok := translations[target]; ok {
				result[target] = strings.TrimSpace(val)
			}
		}

		return result, nil
	}

	return nil, lastErr
}
