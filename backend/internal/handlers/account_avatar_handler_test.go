package handlers

import (
	"bytes"
	"context"
	"image"
	"image/jpeg"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"testing"

	"github.com/gofiber/fiber/v2"
)

type avatarTestUploader struct{}

func (avatarTestUploader) UploadFile(context.Context, multipart.File, string, string) (string, error) {
	return "https://cdn.example/avatar.jpg", nil
}

func avatarUploadRequest(t *testing.T, body []byte, contentType string) *http.Request {
	t.Helper()
	var payload bytes.Buffer
	writer := multipart.NewWriter(&payload)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="avatar.jpg"`)
	header.Set("Content-Type", contentType)
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create multipart part: %v", err)
	}
	if _, err := part.Write(body); err != nil {
		t.Fatalf("write multipart part: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/account/avatar", &payload)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}

func avatarTestApp() *fiber.App {
	app := fiber.New(fiber.Config{BodyLimit: 6 * 1024 * 1024})
	app.Post("/api/v1/account/avatar", (&AccountAuthHandler{avatarStorage: avatarTestUploader{}}).UploadAvatar)
	return app
}

func TestUploadAvatarRejectsSpoofedImageContent(t *testing.T) {
	res, err := avatarTestApp().Test(avatarUploadRequest(t, []byte("not an image"), "image/jpeg"))
	if err != nil {
		t.Fatalf("avatar request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusBadRequest)
	}
}

func TestUploadAvatarRejectsFilesOverFiveMiB(t *testing.T) {
	res, err := avatarTestApp().Test(avatarUploadRequest(t, bytes.Repeat([]byte("a"), maxAvatarFileSize+1), "image/jpeg"))
	if err != nil {
		t.Fatalf("avatar request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusRequestEntityTooLarge && res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d, want size validation status", res.StatusCode)
	}
}

func TestUploadAvatarRejectsOversizedDimensions(t *testing.T) {
	var payload bytes.Buffer
	if err := jpeg.Encode(&payload, image.NewRGBA(image.Rect(0, 0, maxAvatarDimension+1, 1)), nil); err != nil {
		t.Fatalf("encode test image: %v", err)
	}
	res, err := avatarTestApp().Test(avatarUploadRequest(t, payload.Bytes(), "image/jpeg"))
	if err != nil {
		t.Fatalf("avatar request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusBadRequest)
	}
}
