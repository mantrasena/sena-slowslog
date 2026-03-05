

## Plan: Fix Logo, Update Footer, and Add Search Functionality

### 1. Fix Logo Kaomoji Color
The issue is on line 30 of `Header.tsx` — the kaomoji `(◕ᴗ◕✿)` is wrapped in `text-muted-foreground`, making it appear faded/transparent. Same issue on line 49 of `Auth.tsx`.

**Fix:** Remove the separate `<span>` wrapper and make the entire logo text `text-primary` (black), so "Sena (◕ᴗ◕✿)" renders as one unified color.

### 2. Update Footer
Current footer has a single `<p>` with both lines. Change to two separate lines with "Mantra" in bold:

```
Built and maintained by **Mantra**
A work in progress, taking it slow.
```

Style: `font-mono text-xs text-muted-foreground`, with `<strong>` on "Mantra".

### 3. Add Search Functionality
Currently the search button in the Header toggles `searchOpen` state but nothing happens. Will build a full search dialog using the existing `CommandDialog` component (cmdk).

**Search features:**
- Opens a command dialog (Cmd+K shortcut too)
- Searches both **stories** (by title/subtitle) and **users** (by username/display_name)
- Results grouped into "Stories" and "Users" sections
- Clicking a story navigates to `/story/:id`, clicking a user navigates to `/profile/:username`
- Debounced search query against the database

**Implementation:**
- Create `src/components/SearchDialog.tsx` — uses `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`
- Queries `stories` table (where `is_draft = false`, title/subtitle ilike search term) and `profiles` table (username/display_name ilike search term)
- Update `Header.tsx` to render `SearchDialog` with `searchOpen` state instead of just toggling a boolean

### Files to modify:
- `src/components/Header.tsx` — fix logo color, integrate SearchDialog
- `src/pages/Auth.tsx` — fix logo color
- `src/components/Footer.tsx` — two-line layout with bold Mantra
- `src/components/SearchDialog.tsx` — new file for search

