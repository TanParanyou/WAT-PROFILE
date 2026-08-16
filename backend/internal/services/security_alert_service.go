package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

// SecurityAlertService dispatches security notifications based on user preferences
type SecurityAlertService struct {
	db     *gorm.DB
	sender accountauth.EmailSender
}

func NewSecurityAlertService(db *gorm.DB, sender accountauth.EmailSender) *SecurityAlertService {
	return &SecurityAlertService{
		db:     db,
		sender: sender,
	}
}

// NotifyNewDeviceLogin sends an alert email if enabled in user security preferences
func (s *SecurityAlertService) NotifyNewDeviceLogin(ctx context.Context, user *models.User, ip, userAgent string) {
	if s.sender == nil || user == nil || !user.SecurityPreferences.EmailOnNewDevice {
		return
	}

	loc, _ := time.LoadLocation("Europe/Berlin")
	if loc == nil {
		loc = time.UTC
	}
	nowStr := time.Now().In(loc).Format("2006-01-02 15:04:05 MST")

	subject := "Security Alert: New Sign-in to Your Admin Account - Wat Loung Por Sai"
	body := fmt.Sprintf(
		"Hello %s,\n\n"+
			"Your admin account was just signed in from a new device or IP address.\n\n"+
			"Details:\n"+
			"- Time: %s\n"+
			"- IP Address: %s\n"+
			"- User-Agent: %s\n\n"+
			"If this was you, you can safely ignore this message.\n"+
			"If you did not perform this login, please sign in immediately, change your password, and revoke all active sessions.\n\n"+
			"Wat Loung Por Sai Security Team",
		user.Name, nowStr, ip, userAgent,
	)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Error().Interface("recover", r).Msg("panic in security alert email goroutine")
			}
		}()
		sendCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.sender.Send(sendCtx, accountauth.EmailMessage{
			To:      user.Email,
			Subject: subject,
			Body:    body,
		}); err != nil {
			log.Warn().Err(err).Str("email", user.Email).Msg("failed to send new device login security alert")
		}
	}()
}

// NotifyFailedLoginAttempts alerts user when consecutive failed logins are detected
func (s *SecurityAlertService) NotifyFailedLoginAttempts(ctx context.Context, user *models.User, ip string, attempts int) {
	if s.sender == nil || user == nil || !user.SecurityPreferences.EmailOnFailedLogin {
		return
	}

	loc, _ := time.LoadLocation("Europe/Berlin")
	if loc == nil {
		loc = time.UTC
	}
	nowStr := time.Now().In(loc).Format("2006-01-02 15:04:05 MST")

	subject := "Security Notice: Multiple Failed Sign-in Attempts - Wat Loung Por Sai"
	body := fmt.Sprintf(
		"Hello %s,\n\n"+
			"There have been %d consecutive failed sign-in attempts for your admin account.\n\n"+
			"Details:\n"+
			"- Time: %s\n"+
			"- Request IP: %s\n\n"+
			"If this was not you, someone may be trying to access your account. We recommend enabling Two-Factor Authentication (2FA) in your Admin Profile.\n\n"+
			"Wat Loung Por Sai Security Team",
		user.Name, attempts, nowStr, ip,
	)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Error().Interface("recover", r).Msg("panic in failed login alert email goroutine")
			}
		}()
		sendCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.sender.Send(sendCtx, accountauth.EmailMessage{
			To:      user.Email,
			Subject: subject,
			Body:    body,
		}); err != nil {
			log.Warn().Err(err).Str("email", user.Email).Msg("failed to send failed login security alert")
		}
	}()
}

// NotifySecurityChange alerts user when 2FA or credentials change
func (s *SecurityAlertService) NotifySecurityChange(ctx context.Context, user *models.User, changeType string) {
	if s.sender == nil || user == nil || !user.SecurityPreferences.EmailOnSecurityChange {
		return
	}

	loc, _ := time.LoadLocation("Europe/Berlin")
	if loc == nil {
		loc = time.UTC
	}
	nowStr := time.Now().In(loc).Format("2006-01-02 15:04:05 MST")

	var title string
	switch changeType {
	case "2fa_enabled":
		title = "Two-Factor Authentication (2FA) has been ENABLED"
	case "2fa_disabled":
		title = "Two-Factor Authentication (2FA) has been DISABLED"
	case "password_changed":
		title = "Your password was successfully changed"
	case "backup_codes_regenerated":
		title = "New 2FA backup recovery codes were generated"
	default:
		title = strings.ReplaceAll(changeType, "_", " ")
	}

	subject := fmt.Sprintf("Security Update: %s - Wat Loung Por Sai", title)
	body := fmt.Sprintf(
		"Hello %s,\n\n"+
			"A security change occurred on your admin account:\n"+
			"- Event: %s\n"+
			"- Time: %s\n\n"+
			"If you did not make this change, please contact an administrator immediately.\n\n"+
			"Wat Loung Por Sai Security Team",
		user.Name, title, nowStr,
	)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Error().Interface("recover", r).Msg("panic in security change alert email goroutine")
			}
		}()
		sendCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.sender.Send(sendCtx, accountauth.EmailMessage{
			To:      user.Email,
			Subject: subject,
			Body:    body,
		}); err != nil {
			log.Warn().Err(err).Str("email", user.Email).Msg("failed to send security change alert")
		}
	}()
}
