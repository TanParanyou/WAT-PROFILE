package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/calendar"
)

type calendarSourceStub struct{}

func (calendarSourceStub) Name() string { return "stub" }

func (calendarSourceStub) List(context.Context, calendar.Request, bool) ([]calendar.Entry, error) {
	return []calendar.Entry{{ID: "1", Source: "event", Title: "Merit", Start: "2026-08-10", End: "2026-08-11", AllDay: true, Status: "active", Display: calendar.Display{Tone: "default"}, Detail: calendar.Detail{CanEdit: false}}}, nil
}

func TestPublicCalendarRejectsMissingRangeAndUnsupportedLocale(t *testing.T) {
	handler := &CalendarHandler{source: calendarSourceStub{}}
	app := fiber.New()
	app.Get("/calendar", handler.GetPublic)

	for _, path := range []string{
		"/calendar?to=2026-08-31&locale=th",
		"/calendar?from=2026-08-01&to=2026-08-31&locale=fr",
	} {
		response, err := app.Test(httptest.NewRequest(http.MethodGet, path, nil))
		if err != nil {
			t.Fatal(err)
		}
		if response.StatusCode != fiber.StatusBadRequest {
			t.Fatalf("%s: got %d", path, response.StatusCode)
		}
	}
}

func TestPublicCalendarRejectsRangesLongerThanMaximum(t *testing.T) {
	handler := &CalendarHandler{source: calendarSourceStub{}}
	app := fiber.New()
	app.Get("/calendar", handler.GetPublic)

	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/calendar?from=2026-01-01&to=2026-04-04&locale=th", nil))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("got %d, want %d", response.StatusCode, fiber.StatusBadRequest)
	}
}

func TestPublicCalendarAcceptsMaximumInclusiveRange(t *testing.T) {
	handler := &CalendarHandler{source: calendarSourceStub{}}
	app := fiber.New()
	app.Get("/calendar", handler.GetPublic)

	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/calendar?from=2026-01-01&to=2026-04-03&locale=th", nil))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusOK {
		t.Fatalf("got %d, want %d", response.StatusCode, fiber.StatusOK)
	}
}

func TestCalendarFeedIncludesTimezoneAndInclusiveRequestRange(t *testing.T) {
	handler := &CalendarHandler{source: calendarSourceStub{}}
	app := fiber.New()
	app.Get("/calendar", handler.GetPublic)
	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/calendar?from=2026-08-01&to=2026-08-31&locale=th", nil))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusOK {
		t.Fatalf("got %d", response.StatusCode)
	}
	var payload struct {
		Success bool `json:"success"`
		Data    struct {
			Timezone string `json:"timezone"`
			Range    struct {
				StartDate string `json:"startDate"`
				EndDate   string `json:"endDate"`
			} `json:"range"`
		} `json:"data"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if !payload.Success || payload.Data.Timezone != "Europe/Berlin" || payload.Data.Range.StartDate != "2026-08-01" || payload.Data.Range.EndDate != "2026-08-31" {
		t.Fatalf("unexpected payload: %#v", payload)
	}
}
