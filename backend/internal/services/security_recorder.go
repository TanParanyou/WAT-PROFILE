package services

import (
	"context"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
)

type noopSecurityRecorder struct{}

func (noopSecurityRecorder) Record(context.Context, accountauth.SecurityEvent) {}

func pickSecurityRecorder(recorders []accountauth.SecurityRecorder) accountauth.SecurityRecorder {
	if len(recorders) > 0 && recorders[0] != nil {
		return recorders[0]
	}
	return noopSecurityRecorder{}
}
