package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/saedam/backend/internal/database"
	"github.com/saedam/backend/internal/models"
)

// GetUser 사용자 정보 조회
func GetUser(c *fiber.Ctx) error {
	anonymousID := c.Params("id")

	var user models.User
	result := database.DB.Where("anonymous_id = ?", anonymousID).First(&user)

	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user)
}

// GetMessages 사용자 메시지 히스토리 조회
func GetMessages(c *fiber.Ctx) error {
	anonymousID := c.Params("id")

	var user models.User
	result := database.DB.Where("anonymous_id = ?", anonymousID).First(&user)
	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	var messages []models.Message
	database.DB.Where("user_id = ?", user.ID).
		Order("created_at asc").
		Find(&messages)

	return c.JSON(messages)
}
