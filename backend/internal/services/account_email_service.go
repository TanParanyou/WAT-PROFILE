package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"strings"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
)

// CaptureSink records rendered account messages in a local test sink. It is
// never used in production (config rejects capture mode there).
type CaptureSink interface {
	Capture(message accountauth.EmailMessage)
}

// captureEmailSender is the explicit non-production delivery adapter. It
// records only the rendered message and action URL, never tokens or secrets.
type captureEmailSender struct {
	sink CaptureSink
}

func (s *captureEmailSender) Send(_ context.Context, message accountauth.EmailMessage) error {
	s.sink.Capture(message)
	return nil
}

// memoryCaptureSink is the default in-memory capture sink for tests.
type memoryCaptureSink struct {
	Messages []accountauth.EmailMessage
}

func (s *memoryCaptureSink) Capture(message accountauth.EmailMessage) {
	s.Messages = append(s.Messages, message)
}

// resendEmailSender delivers transactional account email through the Resend
// HTTP API. Action URLs are embedded in the rendered body; no raw action token
// is ever sent separately or logged.
type resendEmailSender struct {
	apiKey  string
	from    string
	baseURL string
	client  *http.Client
}

// resendSendRequest is the Resend /emails request envelope.
type resendSendRequest struct {
	From        string             `json:"from"`
	To          string             `json:"to"`
	Subject     string             `json:"subject"`
	Text        string             `json:"text"`
	HTML        string             `json:"html,omitempty"`
	Attachments []resendAttachment `json:"attachments,omitempty"`
}

type resendAttachment struct {
	Filename string `json:"filename"`
	Content  string `json:"content"`
}

// resendSendResponse carries the message id returned by Resend.
type resendSendResponse struct {
	ID string `json:"id"`
}

func (s *resendEmailSender) Send(ctx context.Context, message accountauth.EmailMessage) error {
	if s.apiKey == "" || s.from == "" {
		return errors.New("resend sender is not configured")
	}

	// A minimal safe HTML rendering of the plain body; the body is trusted
	// template output containing only the action URL and display name.
	htmlBody := strings.ReplaceAll(html.EscapeString(message.Body), "\n", "<br>")

	payload := resendSendRequest{
		From:    s.from,
		To:      message.To,
		Subject: message.Subject,
		Text:    message.Body,
		HTML:    htmlBody,
	}
	for _, attachment := range message.Attachments {
		payload.Attachments = append(payload.Attachments, resendAttachment{
			Filename: attachment.Filename,
			Content:  base64.StdEncoding.EncodeToString(attachment.Data),
		})
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal resend request: %w", err)
	}

	baseURL := s.baseURL
	if baseURL == "" {
		baseURL = "https://api.resend.com"
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/emails", bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("build resend request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := s.client
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Second}
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errBody map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("resend returned status %d", resp.StatusCode)
	}
	return nil
}

// NewAccountEmailSender builds the delivery adapter for the configured
// AUTH_EMAIL_DELIVERY_MODE. "capture" is allowed only in non-production
// environments; "resend" requires a configured API key and from address.
func NewAccountEmailSender(cfg config.AccountAuthConfig) (accountauth.EmailSender, error) {
	switch cfg.EmailMode {
	case "capture":
		// Config already rejects capture mode in production; guard again here
		// so the sender can never be constructed against production.
		if strings.EqualFold(cfg.Environment, "production") {
			return nil, errors.New("capture email mode is forbidden in production")
		}
		return &captureEmailSender{sink: &memoryCaptureSink{}}, nil
	case "resend":
		if cfg.ResendAPIKey == "" || cfg.EmailFrom == "" {
			return nil, errors.New("resend email mode requires RESEND_API_KEY and ACCOUNT_EMAIL_FROM")
		}
		return &resendEmailSender{apiKey: cfg.ResendAPIKey, from: cfg.EmailFrom}, nil
	default:
		return nil, fmt.Errorf("unknown email delivery mode %q", cfg.EmailMode)
	}
}
