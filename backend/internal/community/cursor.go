package community

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func EncodeCursor(cursor QuestionCursor) string {
	raw, _ := json.Marshal(cursor)
	return base64.RawURLEncoding.EncodeToString(raw)
}

func DecodeCursor(value string) (QuestionCursor, error) {
	if strings.TrimSpace(value) == "" || len(value) > 512 {
		return QuestionCursor{}, fmt.Errorf("invalid cursor")
	}
	raw, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return QuestionCursor{}, fmt.Errorf("invalid cursor: %w", err)
	}
	var cursor QuestionCursor
	decoder := json.NewDecoder(strings.NewReader(string(raw)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&cursor); err != nil || cursor.ID == uuid.Nil || cursor.LastActivityAt.IsZero() {
		return QuestionCursor{}, fmt.Errorf("invalid cursor")
	}
	return cursor, nil
}
