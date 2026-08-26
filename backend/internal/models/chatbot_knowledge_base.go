package models

import (
	"gorm.io/gorm"
)

type ChatbotKnowledgeBase struct {
	gorm.Model
	Category string        `gorm:"type:varchar(100);index;not null;default:'general'" json:"category"`
	Question MultiLangText `gorm:"type:jsonb;not null" json:"question"`
	Answer   MultiLangText `gorm:"type:jsonb;not null" json:"answer"`
	Keywords StringSlice   `gorm:"type:jsonb;default:'[]'" json:"keywords"`
	Priority int           `gorm:"default:0;index" json:"priority"`
	IsActive bool          `gorm:"default:true;index" json:"is_active"`
}

func (ChatbotKnowledgeBase) TableName() string {
	return "chatbot_knowledge_bases"
}
