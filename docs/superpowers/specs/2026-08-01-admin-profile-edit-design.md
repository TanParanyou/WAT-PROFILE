# Admin Profile Edit Design

## 1. Overview
The goal is to allow authenticated admin users to edit their own profile information (Name, Email) and change their password from within the Admin Panel.

## 2. Architecture & Data Flow
- **Frontend**: A new dedicated page at `/admin/profile`. The page will fetch the current user's profile from the existing `AuthContext` (which is populated via `GET /api/v1/auth/me`). 
- **Backend**: A new endpoint `PUT /api/v1/auth/me` will handle the profile update.
- **Data Flow**:
  1. Admin navigates to `/admin/profile`.
  2. Form is pre-filled with the current `Name` and `Email`.
  3. Admin submits the form.
  4. Frontend sends a `PUT` request to `/api/v1/auth/me` with the updated data.
  5. Backend validates the data (e.g., email uniqueness, password complexity, current password correctness if changing password).
  6. Backend updates the `users` table in the database and returns the updated user object.
  7. Frontend receives the updated user, updates the `AuthContext` (so the header reflects the new name/email), and shows a success toast.

## 3. Backend (Go Fiber)
### Endpoint
- `PUT /api/v1/auth/me`
- **Middleware**: `middleware.AuthRequired`

### Request Payload
```json
{
  "name": "New Name",          // Optional (if unchanged)
  "email": "new@email.com",    // Optional (if unchanged)
  "current_password": "...",   // Required ONLY if new_password is provided
  "new_password": "..."        // Optional
}
```

### Validation & Error Handling
- **Email Validation**: Must be a valid email format.
- **Email Uniqueness**: Check if the new email is already used by *another* user. Return `400 Bad Request` if duplicate.
- **Password Change**: 
  - If `new_password` is provided, `current_password` MUST be provided.
  - Verify `current_password` against the database hash. Return `401 Unauthorized` or `400 Bad Request` if incorrect.
  - `new_password` must meet complexity requirements (min length 8).

### Services
- Update `UserService.Update` or create a new `UserService.UpdateProfile` method that handles the `current_password` verification specifically for self-service updates, separating it from the admin-overriding `Update` method.

## 4. Frontend (Next.js App Router)
### API Service
- Add `updateProfile(data: UpdateProfileRequest): Promise<User>` to `src/services/authService.ts`.

### UI Components
- **Page**: `src/app/[locale]/admin/profile/page.tsx`
  - Use `react-hook-form` and `zod` for form validation.
  - Two logical sections in the form (can be visually separated cards/panels):
    1. **General Information**: Name, Email.
    2. **Security**: Current Password, New Password, Confirm New Password.
- **Header**: `src/components/admin/AdminHeader.tsx`
  - Wrap the User Info section (Name, Role icon) with a `Link` to `/admin/profile` or add a specific "Edit Profile" button in a dropdown or just make the name clickable.

### State Management
- Update `AuthContext` to expose an `updateUser(user: User)` or just call `refreshUser()` after a successful profile update to fetch the latest state and trigger UI re-renders across the admin layout.

## 5. Security Considerations
- Rate limiting on the `PUT /api/v1/auth/me` endpoint to prevent brute-forcing the `current_password`. (Will rely on existing global/auth rate limiters if any).
- Ensure users cannot elevate their own role (`role_id`) or modify `is_active` via this endpoint. The endpoint must ONLY accept `name`, `email`, and password fields.

## 6. Internationalization (i18n)
- Add translation keys for the new profile page in `th.json`, `en.json`, and `de.json` under `Admin.profile` (e.g., `title`, `nameLabel`, `emailLabel`, `currentPasswordLabel`, `newPasswordLabel`, `updateSuccess`).
