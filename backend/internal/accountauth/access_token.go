package accountauth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	// publicAccountIssuer is the JWT issuer shared with the Admin tokens so the
	// audience check is the sole differentiator between principals.
	publicAccountIssuer = "wat-profile"
	// PublicAccountAudience is the audience carried by public-account access
	// tokens. Admin middleware rejects tokens that do not carry the admin
	// audience, and this audience rejects legacy Admin/member tokens.
	PublicAccountAudience = "public-account"
)

// PublicAccountClaims are the JWT claims of a public-account access token.
// The explicit public-account audience guarantees that a public-account token
// can never satisfy Admin middleware.
type PublicAccountClaims struct {
	SessionID string `json:"sid"`
	AuthTime  int64  `json:"auth_time"`
	jwt.RegisteredClaims
}

// AccessTokenIssuer signs short-lived public-account access tokens.
type AccessTokenIssuer struct {
	secret []byte
	clock  Clock
	ttl    time.Duration
}

// NewAccessTokenIssuer builds a public-account token issuer. The secret is the
// JWT signing secret; access tokens expire after ttl.
func NewAccessTokenIssuer(secret []byte, clock Clock, ttl time.Duration) *AccessTokenIssuer {
	return &AccessTokenIssuer{secret: secret, clock: clock, ttl: ttl}
}

// TTL returns the configured lifetime of access tokens. Session responses use
// this value for expires_in; refresh-token lifetime is communicated by the
// HttpOnly cookie instead.
func (i *AccessTokenIssuer) TTL() time.Duration { return i.ttl }

// Issue signs a new access token for the given user and session. authTime is
// the moment the user last authenticated, used for recent-authentication checks.
func (i *AccessTokenIssuer) Issue(userID, sessionID uuid.UUID, authTime time.Time) (string, error) {
	now := i.clock.Now()
	claims := PublicAccountClaims{
		SessionID: sessionID.String(),
		AuthTime:  authTime.Unix(),
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    publicAccountIssuer,
			Subject:   userID.String(),
			Audience:  jwt.ClaimStrings{PublicAccountAudience},
			ExpiresAt: jwt.NewNumericDate(now.Add(i.ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(i.secret)
}

// VerifyPublicAccountToken validates a public-account access token. It accepts
// only HS256-signed tokens with the exact public-account issuer and audience.
// Legacy Admin tokens (audience "admin") are rejected.
func VerifyPublicAccountToken(raw string, secret []byte) (*PublicAccountClaims, error) {
	claims := &PublicAccountClaims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil || !token.Valid {
		return nil, ErrTokenInvalid
	}
	if claims.Issuer != publicAccountIssuer {
		return nil, ErrTokenInvalid
	}
	if !hasAudience(claims.Audience, PublicAccountAudience) {
		return nil, ErrTokenInvalid
	}
	if claims.Subject == "" {
		return nil, ErrTokenInvalid
	}
	return claims, nil
}

func hasAudience(audiences jwt.ClaimStrings, expected string) bool {
	for _, audience := range audiences {
		if audience == expected {
			return true
		}
	}
	return false
}
