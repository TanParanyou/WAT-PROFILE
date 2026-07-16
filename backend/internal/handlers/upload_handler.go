package handlers

import (
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"gorm.io/gorm"
)

type UploadHandler struct {
	db *gorm.DB
	r2 *storage.R2Service
}

func NewUploadHandler(db *gorm.DB, r2 *storage.R2Service) *UploadHandler {
	return &UploadHandler{db: db, r2: r2}
}

func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	log := logger.Log

	if h.r2 == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Storage service not configured",
		})
	}

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "No file uploaded or file field must be named 'file'",
		})
	}

	// เช็คว่าเป็นรูปภาพหรือไม่
	if !strings.HasPrefix(file.Header.Get("Content-Type"), "image/") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Only image files are allowed",
		})
	}

	// เช็คขนาดไฟล์ (5MB)
	if file.Size > 5*1024*1024 {
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
			"success": false,
			"error":   "File size must be less than 5MB",
		})
	}

	// สร้างชื่อไฟล์ใหม่
	ext := filepath.Ext(file.Filename)
	newFilename := uuid.New().String() + ext

	// เปิดไฟล์
	src, err := file.Open()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open uploaded file")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to open uploaded file",
		})
	}
	defer src.Close()

	// อัปโหลดไฟล์ไป R2
	url, err := h.r2.UploadFile(c.Context(), src, newFilename, file.Header.Get("Content-Type"))
	if err != nil {
		log.Error().Err(err).Msg("Failed to upload file to R2")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to upload file to storage",
		})
	}

	// บันทึกข้อมูลลงฐานข้อมูล
	userID, ok := c.Locals("user_id").(string)
	var userUUID *uuid.UUID
	if ok && userID != "" {
		id, err := uuid.Parse(userID)
		if err == nil {
			userUUID = &id
		}
	}

	media := models.Media{
		Filename:         newFilename,
		OriginalFilename: file.Filename,
		MimeType:         file.Header.Get("Content-Type"),
		Size:             file.Size,
		URL:              url,
		Path:             newFilename,
		UploadedByID:     userUUID,
		Category:         "gallery",
	}

	if err := h.db.Create(&media).Error; err != nil {
		log.Error().Err(err).Msg("Failed to save media record")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to save media record",
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"url":   url,
			"media": media,
		},
	})
}
