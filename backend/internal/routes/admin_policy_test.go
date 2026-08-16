package routes

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"gorm.io/gorm"
)

// TestAdminRoutesDefinitionsAreValid ensures every admin route definition has a
// method, path, resource, action, and handler key, and that no method/path pair
// is registered twice.
func TestAdminRoutesDefinitionsAreValid(t *testing.T) {
	defs := adminRouteDefinitions()
	if len(defs) == 0 {
		t.Fatal("adminRouteDefinitions returned no routes")
	}

	seen := make(map[string]struct{})
	for _, d := range defs {
		if strings.TrimSpace(d.Method) == "" {
			t.Errorf("blank method for path %q", d.Path)
		}
		if strings.TrimSpace(d.Path) == "" {
			t.Errorf("blank path for method %q", d.Method)
		}
		if strings.TrimSpace(d.Resource) == "" {
			t.Errorf("blank resource for %s %s", d.Method, d.Path)
		}
		if strings.TrimSpace(d.Action) == "" {
			t.Errorf("blank action for %s %s", d.Method, d.Path)
		}
		if strings.TrimSpace(d.HandlerKey) == "" {
			t.Errorf("blank handler key for %s %s", d.Method, d.Path)
		}

		key := d.Method + " " + d.Path
		if _, ok := seen[key]; ok {
			t.Errorf("duplicate route definition %q", key)
		}
		seen[key] = struct{}{}
	}
}

// TestAdminRoutesAllHandlerKeysResolve ensures every definition references a
// handler that actually exists in the admin handler registry.
func TestAdminRoutesAllHandlerKeysResolve(t *testing.T) {
	handlers := adminHandlerMap(&gorm.DB{}, nil, config.AccountAuthConfig{})
	defs := adminRouteDefinitions()

	for _, d := range defs {
		if _, ok := handlers[d.HandlerKey]; !ok {
			t.Errorf("definition %s %s references missing handler key %q", d.Method, d.Path, d.HandlerKey)
		}
	}
}

// TestAdminRoutesRegisterAppliesPermissionMiddleware verifies that
// registerAdminRoutes always inserts the permission middleware: a request that
// reaches a registered route without an authenticated user must be rejected by
// the permission middleware, proving the stack is not unprotected.
func TestAdminRoutesRegisterAppliesPermissionMiddleware(t *testing.T) {
	handlers := adminHandlerMap(&gorm.DB{}, nil, config.AccountAuthConfig{})
	app := fiber.New()
	group := app.Group("/admin")
	registerAdminRoutes(group, adminRouteDefinitions(), handlers)

	req := httptest.NewRequest(http.MethodGet, "/admin/dashboard/stats", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 from permission middleware without auth, got %d", resp.StatusCode)
	}
}

func TestCalendarResourceRoutesUseDedicatedPermissionResource(t *testing.T) {
	defs := adminRouteDefinitions()
	want := map[string]string{
		"GET /admin/calendar-resources":        "read",
		"GET /admin/calendar-resources/:id":    "read",
		"POST /admin/calendar-resources":       "create",
		"PUT /admin/calendar-resources/:id":    "update",
		"DELETE /admin/calendar-resources/:id": "delete",
	}
	for key, action := range want {
		found := false
		for _, definition := range defs {
			if definition.Method+" /admin"+definition.Path != key {
				continue
			}
			found = true
			if definition.Resource != "calendar_resources" || definition.Action != action {
				t.Errorf("route %s has permission %s/%s", key, definition.Resource, definition.Action)
			}
		}
		if !found {
			t.Errorf("missing route %s", key)
		}
	}
}
