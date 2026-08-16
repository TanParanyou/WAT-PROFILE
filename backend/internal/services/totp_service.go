package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/subtle"
	"encoding/base32"
	"encoding/binary"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	totpPeriodSec = 30
	totpDigits    = 6
	totpSkewSteps = 1 // allow -1, 0, +1 (±30s)
	backupCodeLen = 8
	backupCodeCnt = 10
	totpIssuer    = "WatLoungPorSai"
)

var (
	ErrInvalidTOTPCode   = errors.New("invalid or expired verification code")
	ErrInvalidBackupCode = errors.New("invalid or already used backup code")
)

// TOTPService provides standard RFC 6238 Time-based One-Time Password helpers
type TOTPService struct {
	db *gorm.DB
}

func NewTOTPService(db *gorm.DB) *TOTPService {
	return &TOTPService{db: db}
}

// GenerateSecret produces a cryptographically random 20-byte base32 secret
func (s *TOTPService) GenerateSecret() (string, error) {
	bytes := make([]byte, 20)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(bytes), nil
}

// GenerateOTPAuthURI constructs the standard otpauth URI for QR codes
func (s *TOTPService) GenerateOTPAuthURI(secret, email string) string {
	label := fmt.Sprintf("%s:%s", totpIssuer, email)
	params := url.Values{}
	params.Set("secret", secret)
	params.Set("issuer", totpIssuer)
	params.Set("algorithm", "SHA1")
	params.Set("digits", strconv.Itoa(totpDigits))
	params.Set("period", strconv.Itoa(totpPeriodSec))

	return fmt.Sprintf("otpauth://totp/%s?%s", url.PathEscape(label), params.Encode())
}

// ComputeCode generates a 6-digit TOTP code for a given timestamp
func ComputeCode(secret string, t time.Time) (string, error) {
	normalizedSecret := strings.ToUpper(strings.TrimSpace(secret))
	key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(normalizedSecret)
	if err != nil {
		// Try with padding if without failed
		key, err = base32.StdEncoding.DecodeString(normalizedSecret)
		if err != nil {
			return "", err
		}
	}

	counter := uint64(t.Unix() / totpPeriodSec)
	counterBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(counterBytes, counter)

	mac := hmac.New(sha1.New, key)
	mac.Write(counterBytes)
	hash := mac.Sum(nil)

	offset := hash[len(hash)-1] & 0x0f
	codeInt := (binary.BigEndian.Uint32(hash[offset:offset+4]) & 0x7fffffff) % 1000000

	return fmt.Sprintf("%06d", codeInt), nil
}

// ValidateCode verifies if the given 6-digit code matches within the skew window
func (s *TOTPService) ValidateCode(secret, code string) bool {
	cleanCode := strings.TrimSpace(code)
	if len(cleanCode) != totpDigits {
		return false
	}

	now := time.Now()
	for step := -totpSkewSteps; step <= totpSkewSteps; step++ {
		t := now.Add(time.Duration(step*totpPeriodSec) * time.Second)
		computed, err := ComputeCode(secret, t)
		if err == nil && subtle.ConstantTimeCompare([]byte(computed), []byte(cleanCode)) == 1 {
			return true
		}
	}
	return false
}

// GenerateBackupCodes produces a list of random alphanumeric codes and saves their hashes in DB
func (s *TOTPService) GenerateBackupCodes(tx *gorm.DB, userID uuid.UUID) ([]string, error) {
	plainCodes := make([]string, backupCodeCnt)
	chars := "23456789ABCDEFGHJKLMNPQRSTUVWXYZ" // exclude ambiguous 0,1,I,O

	// Delete existing unused backup codes
	if err := tx.Where("user_id = ?", userID).Delete(&models.UserBackupCode{}).Error; err != nil {
		return nil, err
	}

	records := make([]models.UserBackupCode, backupCodeCnt)
	for i := 0; i < backupCodeCnt; i++ {
		bytes := make([]byte, backupCodeLen)
		if _, err := rand.Read(bytes); err != nil {
			return nil, err
		}
		var sb strings.Builder
		for _, b := range bytes {
			sb.WriteByte(chars[int(b)%len(chars)])
		}
		plain := sb.String()
		plainCodes[i] = plain

		hashBytes, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}

		records[i] = models.UserBackupCode{
			UserID:    userID,
			CodeHash:  string(hashBytes),
			CreatedAt: time.Now(),
		}
	}

	if err := tx.Create(&records).Error; err != nil {
		return nil, err
	}

	return plainCodes, nil
}

// ValidateAndConsumeBackupCode checks if the code is valid for the user and marks it used
func (s *TOTPService) ValidateAndConsumeBackupCode(userID uuid.UUID, code string) (bool, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	if len(cleanCode) == 0 {
		return false, nil
	}

	var codes []models.UserBackupCode
	if err := s.db.Where("user_id = ? AND used_at IS NULL", userID).Find(&codes).Error; err != nil {
		return false, err
	}

	now := time.Now()
	for _, record := range codes {
		if err := bcrypt.CompareHashAndPassword([]byte(record.CodeHash), []byte(cleanCode)); err == nil {
			// Mark code used
			if err := s.db.Model(&models.UserBackupCode{}).Where("id = ? AND used_at IS NULL", record.ID).Update("used_at", now).Error; err != nil {
				return false, err
			}
			return true, nil
		}
	}

	return false, nil
}
