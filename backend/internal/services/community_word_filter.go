package services

import (
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

// CheckCommunityWordFilter checks if any text contains blocked words that trigger auto-moderation.
func CheckCommunityWordFilter(db *gorm.DB, texts ...string) bool {
	var enabledSetting models.Setting
	if err := db.Where("key = ?", "community_word_filter_enabled").First(&enabledSetting).Error; err == nil {
		if enabledSetting.Value == "false" {
			return false
		}
	}

	var wordsSetting models.Setting
	blockedWordsRaw := ""
	if err := db.Where("key = ?", "community_blocked_words").First(&wordsSetting).Error; err == nil {
		blockedWordsRaw = wordsSetting.Value
	}

	var blockedWords []string
	if strings.TrimSpace(blockedWordsRaw) != "" {
		rawTokens := strings.FieldsFunc(blockedWordsRaw, func(r rune) bool {
			return r == ',' || r == '\n' || r == '\r' || r == ';'
		})
		for _, token := range rawTokens {
			cleaned := strings.ToLower(strings.TrimSpace(token))
			if cleaned != "" {
				blockedWords = append(blockedWords, cleaned)
			}
		}
	}

	if len(blockedWords) == 0 {
		return false
	}

	for _, text := range texts {
		lower := strings.ToLower(text)
		for _, word := range blockedWords {
			if strings.Contains(lower, word) {
				return true
			}
		}
	}

	return false
}
