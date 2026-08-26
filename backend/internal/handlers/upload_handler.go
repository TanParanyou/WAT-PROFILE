package handlers

import (
	"context"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"gorm.io/gorm"
)

// maxUploadFileSize is the largest accepted image upload (20 MiB). The Fiber
// BodyLimit is configured slightly larger to leave room for multipart overhead.
const maxUploadFileSize = 20 * 1024 * 1024

var allowedImageMIMEs = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

var allowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
}

// fileUploader uploads a file to storage and returns its public URL.
type fileUploader interface {
	UploadFile(ctx context.Context, file multipart.File, filename string, contentType string) (string, error)
}

type UploadHandler struct {
	db *gorm.DB
	r2 fileUploader
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

	// เช็คขนาดไฟล์ (20MB)
	if file.Size > maxUploadFileSize {
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
			"success": false,
			"error":   "File size must be less than 20MB",
		})
	}

	// ตรวจสอบนามสกุลไฟล์
	rawExt := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedImageExtensions[rawExt] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Only JPG, PNG, WEBP, and GIF images are allowed",
		})
	}

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

	// ตรวจสอบ Magic Bytes (หัวไฟล์ 512 ไบต์) เพื่อระบุ MIME Type จริง
	headerBuf := make([]byte, 512)
	n, readErr := io.ReadFull(src, headerBuf)
	if readErr != nil && readErr != io.EOF && readErr != io.ErrUnexpectedEOF {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to inspect uploaded file contents",
		})
	}
	detectedMIME := http.DetectContentType(headerBuf[:n])

	canonicalExt, ok := allowedImageMIMEs[detectedMIME]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid image content or unsupported format",
		})
	}

	// Reset read pointer
	if seeker, ok := src.(io.Seeker); ok {
		if _, err := seeker.Seek(0, io.SeekStart); err != nil {
			log.Error().Err(err).Msg("Failed to seek uploaded file")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Failed to process uploaded file",
			})
		}
	}

	// สร้างชื่อไฟล์ใหม่ที่ปลอดภัย
	newFilename := uuid.New().String() + canonicalExt

	// อัปโหลดไฟล์ไป R2
	url, err := h.r2.UploadFile(c.Context(), src, newFilename, detectedMIME)
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
		OriginalFilename: filepath.Base(file.Filename),
		MimeType:         detectedMIME,
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
