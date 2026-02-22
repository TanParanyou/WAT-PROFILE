package models

import "github.com/google/uuid"

type BulkDeleteRequest struct {
	IDs []int `json:"ids"`
}

type BulkDeleteUUIDRequest struct {
	IDs []uuid.UUID `json:"ids"`
}

type BulkDeleteStringRequest struct {
	IDs []string `json:"ids"`
}
