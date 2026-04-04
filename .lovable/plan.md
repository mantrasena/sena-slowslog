

# Collapsible Month/Year Groups with Per-Group Pagination

## Overview
Replace the current flat-list-with-dropdown-filter approach with collapsible month/year sections. Each month becomes a clickable header that expands to show its items (max 20 per page), with pagination inside each group if needed.

## Current vs New

```text
CURRENT:
  [Dropdown: March 2026 ▼]  ← filter selects one period
  ── March 2026 ──
  user1, user2, ... user20
  [< 1 2 3 >]               ← global pagination

NEW:
  ▶ March 2026 (24 users)   ← collapsed, click to expand
  ▼ February 2026 (18 users) ← expanded
     user1, user2, ... user18
  ▶ January 2026 (45 users) ← collapsed
```

## Changes (1 file: `src/pages/Admin.tsx`)

### 1. Remove global date filter dropdowns & global pagination
- Remove `userDateFilter`, `orderDateFilter`, `dateFilter` states
- Remove `filterByDate` usage from `filteredUsers`, `filteredOrders`, `filteredStories`
- Remove `getDateFilterOptions`, `filterByDate` functions (no longer needed)
- Remove global `SimplePagination` from Users, Orders, Stories tabs
- Remove `userPage`, `orderPage`, `storyPage` and their totalPages calculations

### 2. New `CollapsibleMonthGroup` component
- Props: `label`, `count`, `children`, `defaultOpen` (first group defaults open)
- Clickable header row: chevron icon (▶/▼) + month label + item count badge
- Toggling expands/collapses the content area with smooth transition
- Uses local state for open/closed

### 3. Per-group pagination
- Each month group internally paginates its items (20 per page)
- `CollapsibleMonthGroup` manages its own page state
- `SimplePagination` renders inside each group when items > 20

### 4. Apply to all three tabs
- **Users tab**: Group by `joined_at`, search still works as global filter across all groups
- **IC Orders tab**: Group by `created_at`, status filter still works globally
- **Stories tab**: Group by `published_at`, author filter still works globally
- Groups are sorted newest-first (already the case with `groupByMonth`)

### 5. Future-proof
- Pattern is generic — any new tab (e.g. Registration Waitlist) can reuse `CollapsibleMonthGroup` + `groupByMonth`

## UI Detail
- Header: `border-b`, subtle `bg-muted/30`, `cursor-pointer`, chevron rotates on open
- Count badge: small `(24)` next to month label
- Collapsed state saves vertical space — solves the original problem

