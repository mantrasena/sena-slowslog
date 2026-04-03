

# Month/Year Dropdown Filters for Admin Tabs

## Overview
Tambahkan dropdown filter bulan/tahun di ketiga tab (Users, IC Orders, Stories & Backup) agar data bisa difilter per periode secara rapih. Stories tab sudah punya date filter — Users dan IC Orders akan mendapat dropdown serupa.

## Changes (1 file: `src/pages/Admin.tsx`)

### 1. New State Variables
- `userDateFilter` — default `"all"`
- `orderDateFilter` — default `"all"`

### 2. Reuse `getDateFilterOptions()` & generalize `filterByDate()`
- Generalize `filterByDate` to work with any item + date key (not just stories)
- Reuse `dateOptions` yang sudah ada

### 3. Users Tab
- Add month/year dropdown next to search bar (same style as Stories tab)
- Filter `filteredUsers` by `joined_at` using the selected period
- Reset `userPage` to 1 when `userDateFilter` changes

### 4. IC Orders Tab
- Add month/year dropdown next to status filter
- Filter `filteredOrders` by `created_at` using the selected period
- Reset `orderPage` to 1 when `orderDateFilter` changes

### 5. Stories Tab
- Already has date filter — no changes needed, just keep consistent styling

### UI Layout
- Each dropdown uses the same compact style: `<Filter icon> <select>` pattern already used in Stories tab
- Placed inline with existing filters for clean layout

