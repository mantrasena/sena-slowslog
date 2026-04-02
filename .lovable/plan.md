

# Homepage Popup Modal — Admin-Managed Promotion

## Overview
Admin can configure a popup (image + optional redirect URL) from the Settings tab. Visitors see it once per session on the homepage.

## Database

### New table: `popup_settings`
| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| is_active | boolean | false |
| image_url | text | null |
| redirect_url | text | null |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: readable by everyone (SELECT), manageable by admin/founder (ALL).

## File Changes

### 1. `src/components/admin/PopupManager.tsx` (new)
Admin UI in Settings tab alongside VoucherManager:
- Toggle enable/disable popup
- Upload square image (1:1 ratio) to `story-images` bucket (reuse existing bucket)
- Input for redirect URL (optional)
- Web & mobile preview of uploaded image (proportional, not stretched)
- Delete button to remove popup
- Only 1 popup allowed — upsert logic

### 2. `src/pages/Admin.tsx`
- Import and render `<PopupManager />` in the Settings tab below VoucherManager

### 3. `src/components/HomepagePopup.tsx` (new)
- Fetch active popup from `popup_settings` where `is_active = true`
- Check `sessionStorage` for `popup_dismissed` flag — if set, don't show
- Render centered modal with semi-transparent overlay
- Image displayed with `object-contain` (no distortion, responsive)
- Close button (❌) top-right
- If redirect_url exists, image is wrapped in `<a>` tag
- On close, set `sessionStorage.popup_dismissed = true`

### 4. `src/pages/Index.tsx`
- Import and render `<HomepagePopup />` inside the page

## Technical Details
- Image upload reuses existing `story-images` bucket
- `object-contain` + `max-w-[90vw] max-h-[70vh]` ensures responsive display without distortion
- Session-based dismissal via `sessionStorage` (resets on new tab/session)
- Single row in `popup_settings` enforced by deleting old row before insert

