package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/saedam/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect 데이터베이스 연결 (재시도 로직 포함)
func Connect() error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Seoul",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	maxRetries := 10

	for i := 0; i < maxRetries; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if err == nil {
			log.Println("✅ Database connected")
			return nil
		}

		log.Printf("⏳ Database connection failed (attempt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(2 * time.Second)
	}

	return fmt.Errorf("failed to connect database after %d attempts: %w", maxRetries, err)
}

// Migrate 데이터베이스 마이그레이션
func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Message{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("✅ Database migrated")
	return nil
}
