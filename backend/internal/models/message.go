package models

import (
	"time"

	"gorm.io/gorm"
)

// MessageRole 메시지 역할
type MessageRole string

const (
	RoleUser   MessageRole = "user"
	RoleFairy  MessageRole = "fairy"
	RoleSystem MessageRole = "system"
)

// Message 채팅 메시지
type Message struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID  uint        `gorm:"not null;index" json:"user_id"`
	Role    MessageRole `gorm:"type:varchar(20);not null" json:"role"`
	Content string      `gorm:"type:text;not null" json:"content"`

	// AI 분석
	IsDeep             bool `gorm:"default:false" json:"is_deep"`              // 깊이 있는 대화인지
	EmotionalIntensity int  `gorm:"default:0" json:"emotional_intensity"`      // 감정 강도 (0-100)
	AffectionGained    int  `gorm:"default:0" json:"affection_gained"`         // 획득한 호감도

	// 관계
	User User `gorm:"foreignKey:UserID" json:"-"`
}
