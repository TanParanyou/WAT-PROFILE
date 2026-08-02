package handlers

import (
	"bytes"
	"context"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const maxUploadSize = 20 * 1024 * 1024

type stubUploader struct {
	url string
	err error
}

func (s *stubUploader) UploadFile(ctx context.Context, file multipart.File, filename string, contentType string) (string, error) {
	if s.err != nil {
		return "", s.err
	}
	return s.url, nil
}

type zeros struct{}

func (zeros) Read(p []byte) (int, error) {
	for i := range p {
		p[i] = 0
	}
	return len(p), nil
}

func buildUploadRequest(t *testing.T, size int64, contentType string) *http.Request {
	t.Helper()
	if contentType == "" {
		contentType = "image/png"
	}
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	partHeader := make(textproto.MIMEHeader)
	partHeader.Set("Content-Disposition", `form-data; name="file"; filename="test.png"`)
	partHeader.Set("Content-Type", contentType)
	part, err := writer.CreatePart(partHeader)
	if err != nil {
		t.Fatalf("failed to create form part: %v", err)
	}
	if size > 0 {
		if _, err := io.Copy(part, io.LimitReader(zeros{}, size)); err != nil {
			t.Fatalf("failed to write file body: %v", err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("failed to close writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/upload", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}

func newUploadTestApp(h *UploadHandler) *fiber.App {
	app := fiber.New(fiber.Config{BodyLimit: 25 * 1024 * 1024})
	app.Post("/api/v1/admin/upload", h.UploadFile)
	return app
}

func TestUploadRejectsFileLargerThan20MiB(t *testing.T) {
	app := newUploadTestApp(&UploadHandler{r2: &stubUploader{url: "https://cdn.example/test.png"}})
	req := buildUploadRequest(t, maxUploadSize+1, "image/png")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("upload request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusRequestEntityTooLarge)
	}
}

func TestUploadAcceptsFileAt20MiBBoundary(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not set; skipping upload DB test")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}
	if err := db.AutoMigrate(&models.Media{}); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	app := newUploadTestApp(&UploadHandler{
		db: db,
		r2: &stubUploader{url: "https://cdn.example/test.png"},
	})
	req := buildUploadRequest(t, maxUploadSize, "image/png")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("upload request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}
}
