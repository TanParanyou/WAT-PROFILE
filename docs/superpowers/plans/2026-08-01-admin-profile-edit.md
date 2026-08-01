# Admin Profile Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated admin users to update their personal profile (Name, Email) and change their password via the Admin Panel.

**Architecture:** A new backend endpoint `PUT /api/v1/auth/me` with self-service password verification, integrated with a new frontend page at `/admin/profile` and linked from `AdminHeader`.

**Tech Stack:** Go 1.22+ (Go Fiber, GORM, PostgreSQL), Next.js 14+ (App Router, React Hook Form, Zod, TanStack Query, TailwindCSS, next-intl).

## Global Constraints
- Preserve `th`, `en`, and `de` variants of localized data and messages.
- Use `utils.SuccessResponse` and `utils.ErrorResponse` for all backend Fiber handler responses.
- Granular permission/auth checks: `PUT /api/v1/auth/me` requires `middleware.AuthRequired`.
- Update `backend/docs/openapi.yaml` when adding or modifying API endpoints.
- No TypeScript `any` or `@ts-ignore`.

---

### Task 1: Backend Service - Update Profile Method & Tests

**Files:**
- Modify: `backend/internal/services/user_service.go`
- Test: `backend/internal/services/user_service_test.go`

**Interfaces:**
- Produces: `UserService.UpdateProfile(userID uuid.UUID, name, email, currentPassword, newPassword string) (*models.User, error)`

- [ ] **Step 1: Write the failing unit test for UpdateProfile**

Create `backend/internal/services/user_service_test.go`:
```go
package services

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	err = db.AutoMigrate(&models.User{}, &models.Role{})
	assert.NoError(t, err)
	return db
}

func TestUserService_UpdateProfile(t *testing.T) {
	db := setupTestDB(t)
	svc := NewUserService(db)

	hashed, _ := utils.HashPassword("OldPassword123")
	user := models.User{
		ID:           uuid.New(),
		Email:        "admin@wat.local",
		PasswordHash: hashed,
		Name:         "Old Admin",
		IsActive:     true,
	}
	assert.NoError(t, db.Create(&user).Error)

	t.Run("successfully update name and email without password", func(t *testing.T) {
		updated, err := svc.UpdateProfile(user.ID, "New Admin", "newadmin@wat.local", "", "")
		assert.NoError(t, err)
		assert.Equal(t, "New Admin", updated.Name)
		assert.Equal(t, "newadmin@wat.local", updated.Email)
	})

	t.Run("fail to update password if current password is wrong", func(t *testing.T) {
		_, err := svc.UpdateProfile(user.ID, "New Admin", "newadmin@wat.local", "WrongPassword", "NewPassword123")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "current password")
	})

	t.Run("successfully update password with valid current password", func(t *testing.T) {
		updated, err := svc.UpdateProfile(user.ID, "New Admin", "newadmin@wat.local", "OldPassword123", "NewPassword123")
		assert.NoError(t, err)
		assert.True(t, utils.CheckPasswordHash("NewPassword123", updated.PasswordHash))
	})
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services/... -run TestUserService_UpdateProfile`
Expected: FAIL with "svc.UpdateProfile undefined"

- [ ] **Step 3: Implement UpdateProfile in UserService**

Add to `backend/internal/services/user_service.go`:
```go
// UpdateProfile allows a user to update their own profile (name, email) and optionally their password
func (s *UserService) UpdateProfile(userID uuid.UUID, name, email, currentPassword, newPassword string) (*models.User, error) {
	var user models.User
	if err := s.db.Preload("Role").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("user not found")
	}

	// Email uniqueness check if email is changed
	if email != "" && email != user.Email {
		var count int64
		if err := s.db.Model(&models.User{}).Where("email = ? AND id != ?", email, userID).Count(&count).Error; err != nil {
			return nil, err
		}
		if count > 0 {
			return nil, errors.New("email already in use")
		}
		user.Email = email
	}

	if name != "" {
		user.Name = name
	}

	// Handle password change if newPassword is provided
	if newPassword != "" {
		if currentPassword == "" {
			return nil, errors.New("current password is required to set a new password")
		}
		if !utils.CheckPasswordHash(currentPassword, user.PasswordHash) {
			return nil, errors.New("incorrect current password")
		}
		hashedPassword, err := utils.HashPassword(newPassword)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = hashedPassword
	}

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services/... -run TestUserService_UpdateProfile`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/services/user_service.go backend/internal/services/user_service_test.go
git commit -m "feat(backend): add UpdateProfile service method with tests"
```

---

### Task 2: Backend Handler, Route & OpenAPI

**Files:**
- Modify: `backend/internal/handlers/auth_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Endpoint: `PUT /api/v1/auth/me`
- Middleware: `middleware.AuthRequired`

- [ ] **Step 1: Add UpdateProfile handler in auth_handler.go**

Modify `backend/internal/handlers/auth_handler.go`:
```go
// UpdateProfileRequest defines request body for updating current user profile
type UpdateProfileRequest struct {
	Name            string `json:"name"`
	Email           string `json:"email"`
	CurrentPassword string `json:"current_password,omitempty"`
	NewPassword     string `json:"new_password,omitempty"`
}

// UpdateProfile godoc
// @Summary Update current user profile
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/auth/me [put]
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	user, err := middleware.GetCurrentUser(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Unauthorized")
	}

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)

	if req.Email != "" && !utils.ValidateEmail(req.Email) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid email format")
	}

	if req.NewPassword != "" {
		if err := utils.ValidateMinLength(req.NewPassword, 8, "new_password"); err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
	}

	userService := services.NewUserService(h.authService.GetDB())
	updatedUser, err := userService.UpdateProfile(user.ID, req.Name, req.Email, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, updatedUser)
}
```
*(Ensure `authService.GetDB()` or direct db injection is available in `AuthHandler` / `AuthService`).*

- [ ] **Step 2: Add Route in backend/internal/routes/routes.go**

Under `// ============ AUTH ROUTES ============`:
```go
auth.Get("/me", middleware.AuthRequired, authHandler.GetProfile)
auth.Put("/me", middleware.AuthRequired, authHandler.UpdateProfile)
```

- [ ] **Step 3: Update OpenAPI specification in backend/docs/openapi.yaml**

Add `PUT` method under `/api/v1/auth/me`:
```yaml
  /api/v1/auth/me:
    get:
      summary: Get current user profile
      tags:
        - auth
      security:
        - BearerAuth: []
      responses:
        '200':
          description: User profile retrieved
    put:
      summary: Update current user profile
      tags:
        - auth
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
                current_password:
                  type: string
                new_password:
                  type: string
      responses:
        '200':
          description: Profile updated successfully
        '400':
          description: Validation error or wrong password
        '401':
          description: Unauthorized
```

- [ ] **Step 4: Verify backend builds and tests pass**

Run: `cd backend && go build ./... && go vet ./...`
Expected: Build and vet succeed with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/auth_handler.go backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat(backend): implement PUT /api/v1/auth/me endpoint and update OpenAPI doc"
```

---

### Task 3: Frontend API & Types

**Files:**
- Modify: `frontend/src/types/auth.ts`
- Modify: `frontend/src/services/authService.ts`
- Modify: `frontend/src/context/AuthContext.tsx`

**Interfaces:**
- Produces: `authService.updateProfile(data: UpdateProfileRequest): Promise<User>`

- [ ] **Step 1: Add UpdateProfileRequest type in frontend/src/types/auth.ts**

Add to `frontend/src/types/auth.ts`:
```ts
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}
```

- [ ] **Step 2: Add updateProfile to frontend/src/services/authService.ts**

Add to `authService`:
```ts
async updateProfile(data: UpdateProfileRequest): Promise<User> {
  const res = await api.put<ApiResponse<User>>('/auth/me', data);
  return res.data.data!;
},
```

- [ ] **Step 3: Ensure AuthContext can update profile and refresh state**

In `frontend/src/context/AuthContext.tsx`, ensure `refreshUser` can be invoked or add `updateUserProfile(data: UpdateProfileRequest)` if needed:
```ts
const updateProfile = async (data: UpdateProfileRequest) => {
  if (skipAdminAuth) {
    setUser((prev) => (prev ? { ...prev, name: data.name || prev.name, email: data.email || prev.email } : null));
    return;
  }
  const updated = await authService.updateProfile(data);
  setUser(updated);
};
```
And expose `updateProfile` in `AuthContextType`.

- [ ] **Step 4: Type-check frontend**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/auth.ts frontend/src/services/authService.ts frontend/src/context/AuthContext.tsx
git commit -m "feat(frontend): add updateProfile service and context method"
```

---

### Task 4: Translations (i18n)

**Files:**
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [ ] **Step 1: Add profile messages to th.json**

Under `"Admin"` in `frontend/src/messages/admin/th.json`:
```json
"profile": {
  "title": "โปรไฟล์ของฉัน",
  "subtitle": "จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ",
  "generalInfo": "ข้อมูลทั่วไป",
  "security": "ความปลอดภัยและรหัสผ่าน",
  "name": "ชื่อ-นามสกุล",
  "email": "อีเมล",
  "role": "ตำแหน่ง / บทบาท",
  "currentPassword": "รหัสผ่านปัจจุบัน",
  "newPassword": "รหัสผ่านใหม่",
  "confirmPassword": "ยืนยันรหัสผ่านใหม่",
  "namePlaceholder": "กรอกชื่อ-นามสกุล",
  "emailPlaceholder": "กรอกอีเมล",
  "currentPasswordPlaceholder": "กรอกรหัสผ่านปัจจุบันเพื่อยืนยัน",
  "newPasswordPlaceholder": "กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)",
  "confirmPasswordPlaceholder": "กรอกรหัสผ่านใหม่อีกครั้ง",
  "passwordLeaveBlank": "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน",
  "updateSuccess": "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว",
  "updateError": "ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลอีกครั้ง",
  "passwordMismatch": "รหัสผ่านใหม่ไม่ตรงกัน",
  "passwordTooShort": "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
  "currentPasswordRequired": "กรุณากรอกรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่าน"
}
```

- [ ] **Step 2: Add profile messages to en.json**

Under `"Admin"` in `frontend/src/messages/admin/en.json`:
```json
"profile": {
  "title": "My Profile",
  "subtitle": "Manage your personal account details and password",
  "generalInfo": "General Information",
  "security": "Security & Password",
  "name": "Full Name",
  "email": "Email Address",
  "role": "Role / Permission Level",
  "currentPassword": "Current Password",
  "newPassword": "New Password",
  "confirmPassword": "Confirm New Password",
  "namePlaceholder": "Enter your full name",
  "emailPlaceholder": "Enter your email",
  "currentPasswordPlaceholder": "Enter current password to verify",
  "newPasswordPlaceholder": "Enter new password (min 8 characters)",
  "confirmPasswordPlaceholder": "Confirm new password",
  "passwordLeaveBlank": "Leave blank if you do not wish to change your password",
  "updateSuccess": "Profile updated successfully",
  "updateError": "Failed to update profile. Please verify your input.",
  "passwordMismatch": "New passwords do not match",
  "passwordTooShort": "Password must be at least 8 characters long",
  "currentPasswordRequired": "Current password is required to change password"
}
```

- [ ] **Step 3: Add profile messages to de.json**

Under `"Admin"` in `frontend/src/messages/admin/de.json`:
```json
"profile": {
  "title": "Mein Profil",
  "subtitle": "Verwalten Sie Ihre persönlichen Kontodaten und Ihr Passwort",
  "generalInfo": "Allgemeine Informationen",
  "security": "Sicherheit & Passwort",
  "name": "Vollständiger Name",
  "email": "E-Mail-Adresse",
  "role": "Rolle / Berechtigungsstufe",
  "currentPassword": "Aktuelles Passwort",
  "newPassword": "Neues Passwort",
  "confirmPassword": "Neues Passwort bestätigen",
  "namePlaceholder": "Geben Sie Ihren vollständigen Namen ein",
  "emailPlaceholder": "Geben Sie Ihre E-Mail ein",
  "currentPasswordPlaceholder": "Aktuelles Passwort zur Bestätigung eingeben",
  "newPasswordPlaceholder": "Neues Passwort eingeben (mind. 8 Zeichen)",
  "confirmPasswordPlaceholder": "Neues Passwort bestätigen",
  "passwordLeaveBlank": "Leer lassen, wenn Sie das Passwort nicht ändern möchten",
  "updateSuccess": "Profil erfolgreich aktualisiert",
  "updateError": "Profil konnte nicht aktualisiert werden. Bitte überprüfen Sie Ihre Eingaben.",
  "passwordMismatch": "Neue Passwörter stimmen nicht überein",
  "passwordTooShort": "Das Passwort muss mindestens 8 Zeichen lang sein",
  "currentPasswordRequired": "Das aktuelle Passwort ist erforderlich, um das Passwort zu ändern"
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "feat(i18n): add Admin.profile translations in th, en, de"
```

---

### Task 5: Frontend Admin Header Link & Profile Page UI

**Files:**
- Modify: `frontend/src/components/admin/AdminHeader.tsx`
- Create: `frontend/src/app/[locale]/admin/profile/page.tsx`

**Interfaces:**
- Route: `/[locale]/admin/profile`

- [ ] **Step 1: Modify AdminHeader to link user details to /admin/profile**

In `frontend/src/components/admin/AdminHeader.tsx`:
Import `Link` from `next/link`.
Wrap the user info box with a `Link` pointing to `/${currentLocale}/admin/profile` with hover effect and accessibility attributes.

- [ ] **Step 2: Create Admin Profile Page in frontend/src/app/[locale]/admin/profile/page.tsx**

Create `frontend/src/app/[locale]/admin/profile/page.tsx`:
- Render `AdminPageHeader` with title and breadcrumbs (`Dashboard` -> `Profile`).
- Form with 2 sections:
  1. General Info: Name (input), Email (input), Role (disabled/read-only input or badge).
  2. Security: Current password, New password, Confirm new password.
- Handle submit with form state loading, validation error messages, and success Toast using `useToast`.
- Auto-sync updated user back to `AuthContext`.

- [ ] **Step 3: Type-check and Lint Frontend**

Run: `cd frontend && npm run build`
Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/AdminHeader.tsx frontend/src/app/[locale]/admin/profile/page.tsx
git commit -m "feat(admin): create admin profile edit page and link from header"
```

---

### Task 6: End-to-End Verification

- [ ] **Step 1: Verify Backend tests & build**
Run: `cd backend && go test ./... && go vet ./...`

- [ ] **Step 2: Verify Frontend build & typecheck**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit && npm run build`

- [ ] **Step 3: Verification complete**
Report results in walkthrough.md.
