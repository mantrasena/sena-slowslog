

# Maintenance Mode

## Approach

Best approach for your question: **Auth page (`/auth`) stays accessible, plus `/admin` and `/settings`**. Founder/Admin yang sudah login bisa akses semua halaman secara normal. User biasa akan melihat halaman maintenance di semua route. Ini paling simpel dan efektif — admin tinggal login seperti biasa lewat `/auth`, lalu akses `/admin` untuk disable maintenance.

## How It Works

```text
User visits any page
  → Fetch `maintenance_mode` from site_settings
  → If enabled:
     → Is user founder/admin? → Normal access
     → Is route /auth? → Allow (so admin can login)
     → Otherwise → Show maintenance page
  → If disabled: Normal
```

## Changes

### 1. New Component: `src/components/MaintenanceGuard.tsx`
- Wraps all routes in `App.tsx`
- Fetches `maintenance_mode` key from `site_settings` table (reuse existing table, no migration needed)
- If maintenance ON and user is NOT founder/admin and route is NOT `/auth`:
  - Render maintenance page with the copywriting provided
  - Minimalist design sesuai look Sena (centered, monospace, kaomoji)
- Otherwise render children normally

### 2. `src/App.tsx`
- Wrap `<Routes>` with `<MaintenanceGuard>`

### 3. Admin Settings — `src/components/admin/MaintenanceToggle.tsx` (new)
- Simple toggle switch (Enable/Disable maintenance mode)
- Reads/writes `maintenance_mode` key in `site_settings` table
- Placed in Settings tab alongside VoucherManager and PopupManager

### 4. `src/pages/Admin.tsx`
- Import and render `<MaintenanceToggle />` in Settings tab

## Maintenance Page Design
- Centered vertically and horizontally
- Font serif for heading, mono for body (consistent with site)
- Copy exactly as provided:
  - "No rush. No noise."
  - "Just a little maintenance."
  - "We'll be back soon."
  - "Maybe this is a good time to step away for a moment."
  - "(◕ᴗ◕✿)"
- No header, no footer — clean full-page

## No Database Migration Needed
Uses existing `site_settings` table with key `maintenance_mode` and value `{"enabled": true/false}`.

