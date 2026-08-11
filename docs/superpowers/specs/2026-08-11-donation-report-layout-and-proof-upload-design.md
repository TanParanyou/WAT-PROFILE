# Donation Report Layout and Proof Upload Design

## Goal

Make `/[locale]/donate/report` read as one calm, stable register sheet for a
donor who has already transferred money. The page's only job is to collect an
accurate donation report and proof without making the page reflow as the proof
selection changes.

## Scope

- Keep donation reporting as a dedicated post-transfer page, not an inline
  form or multi-step wizard.
- Make the page header, form rail, grouped fields, and submit action share one
  readable width at desktop and mobile sizes.
- Replace the native proof file control with a reusable public proof-upload
  component and feature hook.
- Preview selected images, present PDF name and size, validate selection early,
  and let users replace or remove the selected file.
- Preserve the existing `POST /public/donations` multipart contract: the file
  remains local until the donor submits the form.

## Information Architecture

The page remains a single form sheet with three ordered moments:

1. **After-transfer orientation** — a quiet one-line rail states that the
   donor needs the transfer date and proof. It replaces the duplicated title
   eyebrow and does not introduce a progress stepper.
2. **Donation details** — amount and currency share a row on desktop; date
   and donation method share the next row; optional category spans the full
   available row so no empty desktop grid cell remains.
3. **Donor and proof** — name and email share a row, phone follows, then the
   fixed-height proof uploader, receipt request, privacy acknowledgement, and
   full-width submit action.

Mobile uses a single reading-order column. The page, form sheet, and submit
button use the same `max-w-3xl` rail and fluid horizontal padding.

## Visual Direction

The public site's “ทะเบียนศาลา” register treatment remains the visual system:
one continuous paper sheet, square corners, hairline rules, and calm type. The
two current bordered fieldset cards become semantic fieldsets inside that sheet
with a single separating rule. This reduces card density and makes desktop and
mobile proportions more consistent.

The page's one signature element is the **after-transfer rail**: a narrow,
structured strip above the fields that names the concrete materials required
for the report. It is contextual information, not decoration, and avoids a
generic numbered wizard or commercial checkout aesthetic.

No new colour, typography, or shadow tokens are introduced. The component uses
the existing public role tokens, 1px rules, square corners, 44px controls, and
3px focus treatment.

## Proof Upload Component and Hook

Create feature-owned `DonationProofUpload` and `useDonationProofUpload` in
`frontend/src/features/public/donations/`.

### `useDonationProofUpload`

- Owns selected `File`, `isDragging`, image object URL, and the hidden input
  reference.
- Accepts PDF, JPEG, PNG, and WebP up to 10 MB; validates before changing the
  visible selected state.
- Produces a local object URL only for images and revokes it on replacement,
  removal, and unmount.
- Exposes file-picker, drag/drop, selection, replace, and remove handlers.
- Does not call an upload endpoint or duplicate React Hook Form submission
  state.

### `DonationProofUpload`

- Receives the current `File | undefined`, `onChange`, validation message, and
  localized copy from the report form.
- Uses a visually hidden native input with a visible button and optional
  drag/drop target. Keyboard users use the same button; drag/drop is an
  enhancement.
- Has a fixed `min-height` and a two-column internal layout on larger screens:
  a fixed preview/icon area and flexible file metadata/actions. Mobile stacks
  these parts without changing the container height unpredictably.
- Shows image preview for images and a document icon, filename, and formatted
  byte size for PDFs. Replace and remove actions retain 44px touch targets.
- Uses outline/ring feedback rather than changing border width, preventing
  focus/error layout shifts.

The existing Admin media and avatar upload components are not reused directly:
they upload to authenticated media/account endpoints and only support images.
The new component reuses their interaction pattern while preserving private
proof handling and PDF support.

## Form Integration and Error Handling

`DonationReportForm` remains the owner of React Hook Form. It supplies the
proof file to the new component through `Controller` so the component does not
need to know form field names. Local upload-selection errors render below the
uploader and schema/server errors remain mapped to the same proof field.

The user can replace a proof after either client or server validation failure.
The page does not upload a proof until every form rule passes and the donor
chooses “Submit donation report.”

All new copy is added consistently to Thai, English, and German messages.

## Accessibility and Responsiveness

- Every visible action has a 44px touch target and a visible 3px focus state.
- The selected file is announced through a polite status region; validation
  stays attached to the upload control with `aria-describedby`.
- The file picker remains a semantic input and the visible button uses it
  rather than simulating a file dialog.
- Long German filenames wrap inside the metadata column without expanding the
  overall rail or overflowing mobile widths.
- The page is checked at 375px and 1440px in `th`, `en`, and `de`.

## Acceptance Criteria

- Header, orientation rail, form sheet, and submit action align to one rail.
- No empty desktop grid cell appears after the optional category field.
- Selecting, replacing, or removing a proof does not change the uploader's
  outer height or make neighbouring fields jump.
- Images preview locally; PDFs show useful metadata; both can be removed or
  replaced before submission.
- Unsupported and oversized files show a local, localized error and do not
  become the selected proof.
- The backend receives the same multipart `proof` only at final form submit.
- Mobile keeps all inputs and actions readable, fully visible, and operable by
  touch and keyboard.
