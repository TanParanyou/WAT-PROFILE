# Media Library & Media Picker UX/UI Design

Date: 2026-07-11
Project: WAT-PROFILE
Topic: Media Library UX/UI (Mock Phase)

## Objective
Design and build the UX/UI for the Website CMS Media Library and Media Picker components. The implementation will initially use mock data (no API connections) to allow UX/UI testing and validation before backend integration.

## Architecture & Components
1. **`MediaLibraryPage`** (`frontend/src/app/[locale]/admin/website/media/page.tsx`): 
   - Full-page view for managing media assets.
   - Includes search bar, filter/sort controls, and an upload button.
2. **`MediaPickerModal`** (`frontend/src/components/admin/website/MediaPickerModal.tsx`): 
   - A modal component designed to be invoked from content editors (e.g., Home Page Editor).
   - Reuses the core media grid but adds "Select" and "Cancel" actions.
3. **`MediaGrid` & `MediaCard`**: 
   - Displays image thumbnails in a responsive grid.
   - Shows selection state (active border/checkmark).
4. **`MediaDetailsSidebar`**: 
   - A slide-out panel on the right side when an image is selected.
   - Contains fields: `Alt Text` (TH/EN/DE via `MultiLangInput`), `Caption`, and `Credit`.
   - Displays metadata: file size, dimensions, upload date (using monospace fonts).
   - Contains a "Delete" action.

## Data Flow (Mock Implementation)
- **State Management**: A local React state (e.g., a simple Zustand store `useMockMediaStore`) will hold an array of mock media objects.
- **Mock Data**: Pre-populated with 5-10 high-quality sample images.
- **Actions**:
  - **Upload**: Simulates a delay, then adds a new mock object to the state.
  - **Update**: Modifies the Alt Text/Caption of the selected item in state.
  - **Delete**: Removes the item from state.
- **Persistence**: None for this phase. Refreshing the page resets the mock data.

## UX/UI Guidelines (Mono-Style)
- **Colors**: Strictly black, white, and gray scales. 
- **Typography**: 
  - Sans-serif for main UI elements.
  - Monospace for technical metadata (file size, dates).
- **Shapes**: Small border radius (`rounded-sm`), thin borders (`border-zinc-200`).
- **Interactions**: 
  - Hover states on media cards.
  - Smooth transitions for the details sidebar sliding in.
  - Drag and drop zone for uploads.

## Verification
- Can open the full Media Library page.
- Can open the Media Picker Modal.
- Can select an image and view/edit details in the sidebar.
- Can simulate uploading a new image.
- Can simulate deleting an image.
