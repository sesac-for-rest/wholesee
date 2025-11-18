package models

import (
	"time"

	"gorm.io/gorm"
)

// User 사용자 (익명)
type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 익명 식별자
	AnonymousID string `gorm:"uniqueIndex;not null" json:"anonymous_id"`

	// 호감도 정보
	Level              int       `gorm:"default:1" json:"level"`
	Points             int       `gorm:"default:0" json:"points"`
	TotalConversations int       `gorm:"default:0" json:"total_conversations"`
	DeepConversations  int       `gorm:"default:0" json:"deep_conversations"`
	ConsecutiveDays    int       `gorm:"default:0" json:"consecutive_days"`
	LastVisitDate      time.Time `json:"last_visit_date"`

	// 커뮤니티 언락
	CommunityUnlocked bool `gorm:"default:false" json:"community_unlocked"`

	// 관계
	Messages []Message `gorm:"foreignKey:UserID" json:"-"`
}
