package utils

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

// ValidateEmail ตรวจสอบ format ของ email
func ValidateEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// ValidateRequired ตรวจสอบว่า field ไม่เป็นค่าว่าง
func ValidateRequired(fields map[string]string) []string {
	var missing []string
	for name, value := range fields {
		if strings.TrimSpace(value) == "" {
			missing = append(missing, name)
		}
	}
	return missing
}

// ValidateMinLength ตรวจสอบความยาวขั้นต่ำ
func ValidateMinLength(value string, min int, fieldName string) error {
	if len(value) < min {
		return fmt.Errorf("%s must be at least %d characters", fieldName, min)
	}
	return nil
}

// ParseID แปลง string ID เป็น int พร้อม error handling
func ParseID(c *fiber.Ctx, param string) (int, error) {
	id, err := strconv.Atoi(c.Params(param))
	if err != nil || id < 1 {
		return 0, fmt.Errorf("invalid %s parameter", param)
	}
	return id, nil
}

// ClampPagination จำกัดค่า pagination ไม่ให้เกิน max
func ClampPagination(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}
