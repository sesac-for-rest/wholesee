package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/saedam/backend/internal/database"
	"github.com/saedam/backend/internal/models"
	openaiPkg "github.com/saedam/backend/pkg/openai"
	openai "github.com/sashabaranov/go-openai"
)

// ChatRequest 채팅 요청
type ChatRequest struct {
	AnonymousID string `json:"anonymous_id"`
	Message     string `json:"message"`
}

// ChatResponse 채팅 응답
type ChatResponse struct {
	Message            string `json:"message"`
	AffectionGained    int    `json:"affection_gained"`
	NewLevel           int    `json:"new_level"`
	NewPoints          int    `json:"new_points"`
	CommunityUnlocked  bool   `json:"community_unlocked"`
}

// Chat 채팅 핸들러
func Chat(c *fiber.Ctx) error {
	var req ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// 사용자 찾기 또는 생성
	var user models.User
	result := database.DB.Where("anonymous_id = ?", req.AnonymousID).First(&user)
	if result.Error != nil {
		// 새 사용자 생성
		user = models.User{
			AnonymousID:   req.AnonymousID,
			Level:         1,
			Points:        0,
			LastVisitDate: time.Now(),
		}
		database.DB.Create(&user)
	}

	// 사용자 메시지 저장
	userMsg := models.Message{
		UserID:  user.ID,
		Role:    models.RoleUser,
		Content: req.Message,
	}
	database.DB.Create(&userMsg)

	// 이전 대화 히스토리 가져오기
	var messages []models.Message
	database.DB.Where("user_id = ?", user.ID).
		Order("created_at desc").
		Limit(20).
		Find(&messages)

	// OpenAI용 히스토리 변환
	history := make([]openai.ChatCompletionMessage, 0)
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		role := openai.ChatMessageRoleUser
		if msg.Role == models.RoleFairy {
			role = openai.ChatMessageRoleAssistant
		}
		history = append(history, openai.ChatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		})
	}

	// OpenAI API 호출 (60초 타임아웃)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	aiResp, err := openaiPkg.GetFairyResponse(ctx, openaiPkg.ChatRequest{
		UserMessage: req.Message,
		Level:       user.Level,
		History:     history,
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get AI response"})
	}

	// 요정 메시지 저장
	fairyMsg := models.Message{
		UserID:             user.ID,
		Role:               models.RoleFairy,
		Content:            aiResp.Message,
		IsDeep:             aiResp.IsDeep,
		EmotionalIntensity: aiResp.EmotionalIntensity,
		AffectionGained:    aiResp.AffectionGained,
	}
	database.DB.Create(&fairyMsg)

	// 사용자 호감도 업데이트
	user.Points += aiResp.AffectionGained
	user.TotalConversations++
	if aiResp.IsDeep {
		user.DeepConversations++
	}

	// 레벨 계산
	user.Level = calculateLevel(user.Points)

	// 커뮤니티 언락 체크 (레벨 10)
	if user.Level >= 10 && !user.CommunityUnlocked {
		user.CommunityUnlocked = true
	}

	database.DB.Save(&user)

	return c.JSON(ChatResponse{
		Message:           aiResp.Message,
		AffectionGained:   aiResp.AffectionGained,
		NewLevel:          user.Level,
		NewPoints:         user.Points,
		CommunityUnlocked: user.CommunityUnlocked,
	})
}

// calculateLevel 포인트로 레벨 계산
func calculateLevel(points int) int {
	levelPoints := map[int]int{
		1:  0,
		2:  30,
		3:  70,
		4:  120,
		5:  180,
		6:  250,
		7:  330,
		8:  420,
		9:  520,
		10: 630,
	}

	for level := 10; level >= 1; level-- {
		if points >= levelPoints[level] {
			return level
		}
	}
	return 1
}
