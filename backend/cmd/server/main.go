package main

import (
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/saedam/backend/internal/database"
	"github.com/saedam/backend/internal/handlers"
	openaiPkg "github.com/saedam/backend/pkg/openai"
)

func main() {
	// .env 로드 (프로덕션에서는 환경변수 직접 설정)
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found")
	}

	// 데이터베이스 연결
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	// 마이그레이션
	if err := database.Migrate(); err != nil {
		log.Fatal(err)
	}

	// OpenAI 초기화
	openaiPkg.Init()

	// Fiber 앱 생성
	app := fiber.New(fiber.Config{
		AppName: "Saedam API v1.0",
	})

	// 미들웨어
	app.Use(recover.New())
	app.Use(logger.New())

	// CORS 설정
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173,http://localhost:15174"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: strings.Join([]string{
			fiber.MethodGet,
			fiber.MethodPost,
			fiber.MethodPut,
			fiber.MethodDelete,
		}, ","),
	}))

	// 라우트
	api := app.Group("/api/v1")

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"message": "🧚 Saedam API is running",
		})
	})

	// Chat
	api.Post("/chat", handlers.Chat)

	// User
	api.Get("/users/:id", handlers.GetUser)
	api.Get("/users/:id/messages", handlers.GetMessages)

	// 서버 시작
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal(err)
	}
}
