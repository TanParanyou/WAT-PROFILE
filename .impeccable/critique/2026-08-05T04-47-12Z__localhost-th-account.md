---
target: "http://localhost:3002/th/account"
total_score: 24
p0_count: 0
p1_count: 2
timestamp: 2026-08-05T04-47-12Z
slug: localhost-th-account
---
# Account page critique — `/th/account`

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Loading and saved states exist, but the anonymous state is presented as an account-load failure. |
| 2 | Match System / Real World | 3/4 | Account concepts are familiar, but a raw URL field and raw locale codes feel technical. |
| 3 | User Control and Freedom | 2/4 | Logout and cancellation exist, but the close-account cancellation label is misleading. |
| 4 | Consistency and Standards | 3/4 | Controls follow the public register system; cookie consent does not follow dialog semantics. |
| 5 | Error Prevention | 3/4 | Destructive close confirmation and input validation are good, but the expected signed-out state is not modeled clearly. |
| 6 | Recognition Rather Than Recall | 2/4 | The authenticated form has too little grouping, so users must infer which controls belong to profile, language, and security. |
| 7 | Flexibility and Efficiency | 2/4 | The flow is usable but offers no quick account hub or efficient separation of routine and security actions. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Calm, flat, square-cornered styling is on-brand; hierarchy becomes sparse and generic in the fallback state. |
| 9 | Error Recovery | 2/4 | The fallback offers sign-in, but the copy does not distinguish “not signed in” from “account could not load,” and there is no retry path. |
| 10 | Help and Documentation | 2/4 | The subtitle is broad, while disabled-account support has no direct contact action and avatar/session terms are unexplained. |
| **Total** |  | **24/40** | **Functional, but needs a focused UX pass.** |

## Anti-Patterns Verdict

**Does this look AI-generated?** Not immediately. The page uses the project’s restrained register well: flat surfaces, square controls, hairline rules, no gradients, decorative shadows, or repeated card grid. The authenticated form does drift toward a generic account-settings template because all fields and actions are stacked without a stronger information architecture, but it is not visually noisy or obviously generated.

**Deterministic scan:** The bundled detector found 0 findings across the account route and the imported account markup. No rule names or file locations were reported, and there were no false positives. The clean scan is useful, but it cannot detect the dynamic auth-state ambiguity, cookie overlay obstruction, or misleading button copy.

**Browser evidence:** A fresh tab was inspected at 1440×900 and 390×844. There was no horizontal overflow; the page had one `main`, one page-level `h1`, labeled primary navigation, and readable contrast in the observed dark theme. No user-visible overlay is available: mutable script injection was unavailable in the browser surface, so no `[Human]` overlay was injected.

## Overall Impression

The page feels technically careful and visually calm, but its first meaningful state is a dead end for anyone who is not already signed in. The single biggest opportunity is to make authentication state explicit, then reshape the signed-in view as a small, trustworthy account hub with clear Profile, Language, Sessions, and Security boundaries.

## What’s Working

- The public register styling is carried into a functional surface without resorting to dashboard cards: square inputs, flat canvas, restrained action color, and consistent 44px controls fit the temple’s “ทะเบียนศาลา” direction.
- The page includes real loading, error, success, disabled, closed-account, and destructive-confirmation states. The source uses `role="status"`, `aria-live`, and `role="alert"` in the important feedback paths.
- Responsive behavior is sound in the inspected sizes. The main content stays inside the viewport, the mobile menu target is 44×44px, and text contrast passes in the observed dark theme: main text 15.47:1, muted text 7.57:1, and accent text 6.80:1.

## Priority Issues

### [P1] The signed-out state is framed as a load error

**Why it matters:** A visitor who reaches `/th/account` without a session is not experiencing a server failure; they are in an expected state. “ไม่สามารถโหลดข้อมูลบัญชีได้ กรุณาเข้าสู่ระบบอีกครั้ง” makes the product feel broken and withholds the next useful choice—sign in or create an account.

**Fix:** Branch explicitly on `status === "anonymous"`. Render a calm access gate with a heading such as “เข้าสู่ระบบเพื่อจัดการบัญชี”, one sentence explaining the benefit, a primary “เข้าสู่ระบบ” action, and a secondary “สร้างบัญชี” action. Reserve the red `role="alert"` block for an authenticated account-fetch failure, and add a retry action for that case. The current branch is in [`ProfileForm.tsx`](</Users/syaco/Documents/development/WAT-PROFILE/frontend/src/features/public/account/components/ProfileForm.tsx:51>).

**Suggested command:** `$impeccable clarify`

### [P1] Cookie consent obscures too much of the mobile page and is not a dialog

**Why it matters:** At 390×844, the fixed cookie panel was approximately 390×378px from y=466, covering a large part of the page. It has no `dialog`/`aria-modal` semantics or focus management, while its animation can move a large surface into view without a reduced-motion branch. This competes directly with account recovery and navigation on a small screen.

**Fix:** Make the consent surface compact on mobile, add an accessible dialog name and modal behavior where appropriate, move focus to the consent heading or first action, return focus after dismissal, support Escape only if dismissal is safe, and add a reduced-motion alternative. Keep the privacy link and the two choices, but reduce the copy shown in the fixed surface.

**Suggested command:** `$impeccable adapt`

### [P2] The signed-in form lacks a clear information architecture

**Why it matters:** Email/status, display name, avatar URL, language, save, sessions, logout, and irreversible close-account actions are all presented as one long sequence. The page makes the user scan for the boundary between routine profile edits and security-sensitive actions.

**Fix:** Keep the flat register treatment, but introduce explicit sections: “ข้อมูลบัญชี” for email/status, “โปรไฟล์” for display name/avatar, “ภาษา” for the locale preference, “เซสชัน” for device access, and “ความปลอดภัย” for logout/close. Put Save beside the editable profile fields on desktop and keep the danger area last with a stronger separation and a clearly named cancel action. The current composition begins at [`ProfileForm.tsx`](</Users/syaco/Documents/development/WAT-PROFILE/frontend/src/features/public/account/components/ProfileForm.tsx:170>).

**Suggested command:** `$impeccable layout`

### [P2] Account controls expose technical or misleading labels

**Why it matters:** The language selector displays `th`, `en`, and `de` instead of human-readable localized names, and the close-account cancel button is labeled with the logout translation key. A user who changes their mind could read the cancel action as another sign-out action.

**Fix:** Render “ไทย”, “English”, and “Deutsch” (or localized equivalents) as option labels while preserving stable locale values. Add a dedicated `cancel` message in all three locales and use it for the close-account confirmation. Consider replacing the avatar URL field with a simpler avatar choice or clearly explain why a URL is needed. See [`ProfileForm.tsx`](</Users/syaco/Documents/development/WAT-PROFILE/frontend/src/features/public/account/components/ProfileForm.tsx:213>) and [`ProfileForm.tsx`](</Users/syaco/Documents/development/WAT-PROFILE/frontend/src/features/public/account/components/ProfileForm.tsx:293>).

**Suggested command:** `$impeccable clarify`

## Persona Red Flags

**Jordan (First-Timer):** Reaches `/th/account` from the navigation while signed out. The page initially loads, then reports that the account could not be loaded instead of saying that sign-in is required. There is a login action but no create-account action at this decision point, so Jordan must discover the registration link on the next page.

**Alex (Power User):** Can reach sessions and logout, but the account screen does not separate routine profile edits from security operations. In the close-account confirmation, the cancellation control is labeled “ออกจากระบบ”, which creates unnecessary hesitation at a high-stakes moment.

**Marta (German-first visitor):** Can use the localized page, but the preferred-language selector still shows raw `th`, `en`, and `de` codes. The interface asks her to interpret implementation values rather than choose a language in her own terms.

## Minor Observations

- The observed dark-theme divider token is about 2.94:1 against the canvas. That is fine for decorative hairlines, but too weak for a boundary that carries interaction meaning.
- `Navbar` leaves the mobile menu open after Escape and has no focus-management behavior. This is not account-specific, but the cookie surface and the account route make the missing keyboard path more consequential.
- The account page’s source uses `accountLoading` from `useAccountSession`, while the current provider interface shown in the working tree does not expose that property. This looks like a type-check/build drift worth checking separately; it was not part of the browser detector result.
- The page’s source-level font tokens still use `Inter` and `Georgia`, while `DESIGN.md` specifies Noto Sans Thai and Pridi for the public system. Verify whether this is intentional before polishing the account surface.

## Questions to Consider

- Should `/account` redirect signed-out visitors to `/account/login`, or is an explicit access gate the more welcoming choice for this audience?
- Can the account page be organized around the visitor’s mental model—profile, language, sessions, security—instead of the API’s field order?
- Is an avatar URL genuinely valuable to temple visitors, or is it implementation detail that should disappear from the public UI?
- What would make the disabled-account state immediately actionable—an email link or contact route—without making the page feel commercial?
