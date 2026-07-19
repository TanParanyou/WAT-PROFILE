package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/eventalert"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type EventAlertHandler struct { service *eventalert.Service }
func NewEventAlertHandler(db *gorm.DB) *EventAlertHandler { return &EventAlertHandler{service:eventalert.NewService(db)} }
func (h *EventAlertHandler) Get(c *fiber.Ctx) error { value, err := h.service.Get(); if err != nil { return utils.ErrorResponse(c, 500, "Failed to fetch event alert settings") }; return utils.SuccessResponse(c,value) }
func (h *EventAlertHandler) Save(c *fiber.Ctx) error { var value eventalert.Settings; if err:=c.BodyParser(&value); err!=nil { return utils.ErrorResponse(c,400,"Invalid request body") }; if err:=h.service.Save(value); err!=nil { return utils.ErrorResponse(c,400,err.Error()) }; return utils.SuccessResponse(c,value) }
