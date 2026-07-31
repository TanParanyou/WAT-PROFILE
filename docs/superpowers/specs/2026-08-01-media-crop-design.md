# Image Cropping Feature Design for MediaPickerDialog

## Overview
Add image cropping capability to `MediaPickerDialog` in the WAT-PROFILE frontend Admin panel. Users can crop, rotate, zoom, and select aspect ratios (Free, 1:1, 4:3, 16:9) when uploading a new image or when selecting an existing image from the media library.

## Components & File Structure

### 1. `frontend/src/components/admin/media/cropUtils.ts`
Utility helper functions to process cropped image pixels and canvas rotation:
- `createImage(url: string): Promise<HTMLImageElement>`: Asynchronously loads image element with CORS support.
- `getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }, rotation = 0): Promise<File>`: Uses HTML5 Canvas to rotate, crop, and convert the image into a JPEG `File` object ready for `mediaService.upload()`.

### 2. `frontend/src/components/admin/media/ImageCropDialog.tsx`
Dedicated modal component for image cropping powered by `react-easy-crop`:
- **Props**:
  - `isOpen: boolean`
  - `imageSrc: string`
  - `fileName?: string`
  - `onClose: () => void`
  - `onCropComplete: (croppedFile: File) => Promise<void> | void`
- **UI Controls**:
  - **Aspect Ratio Buttons**: Free (`undefined`), `1:1`, `4:3`, `16:9`.
  - **Zoom Control**: Slider and -/+ controls for zooming (1x to 3x).
  - **Rotate Controls**: Rotate left (-90°) / Rotate right (+90°).
  - **Footer Actions**: Cancel button and Save/Upload button (with loading spinner during processing).

### 3. `frontend/src/components/admin/media/MediaPickerDialog.tsx`
Integrate cropping into the main media picker workflow:
- **New Image Upload Flow**:
  - File selected -> Read as Data URL via `FileReader`.
  - Open `ImageCropDialog`.
  - On confirm -> `mediaService.upload(croppedFile)` -> Return uploaded image URL via `onSelect(url)` and close dialogs.
- **Existing Gallery Image Flow**:
  - Add crop button on gallery thumbnail overlay.
  - Clicking crop -> Fetch/Set image URL in `ImageCropDialog`.
  - On confirm -> `mediaService.upload(croppedFile)` -> Refresh gallery list -> Select uploaded image URL via `onSelect(url)` and close dialogs.

## Dependencies
- Install `react-easy-crop` npm package in `frontend`.

## Verification Plan
1. **Lint & Build Verification**:
   - `cd frontend && npm run lint`
   - `cd frontend && ./node_modules/.bin/tsc --noEmit`
   - `cd frontend && npm run build`
2. **Manual UI Verification**:
   - Verify uploading a new image prompts crop modal with aspect ratio, zoom, and rotation controls.
   - Verify clicking crop on an existing gallery image opens crop modal and uploads cropped result.
