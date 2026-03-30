

# Fix: Paragraph-Based Editor (Medium/Blogger Style)

## Root Cause

The editor currently uses `insertLineBreak` (creates `<br>` tags), then the normalizer converts `<br>` to `<p>` for storage. But when re-editing, the `<p>` structure doesn't convert back to visual breaks — causing inconsistency across the write → publish → re-edit cycle.

## Solution

Switch the editor to work **natively with `<p>` blocks**, like Medium and Blogger. Every line is a `<p>`, and double-Enter creates `<p class="spacer"><br></p>`.

## Changes

### 1. `src/pages/Write.tsx` — Editor behavior

- **Remove** the `onKeyDown` handler that intercepts Enter and calls `insertLineBreak`
- **Replace** with a handler that uses `insertParagraph` (browser-native `<p>` creation)
- On double-Enter (detect empty current paragraph), insert a `<p class="spacer"><br></p>` spacer
- On initial load of existing story content: ensure content is already `<p>`-based (it is, from normalizer), so it loads correctly
- Add CSS to the contentEditable div for consistent `<p>` spacing: `[&_p]:my-0` base spacing + spacer height

### 2. `src/lib/html-normalize.ts` — Normalizer adjustments

- Keep the existing logic for converting stray `<br>` and text nodes into `<p>` blocks (handles legacy/pasted content)
- Fix the `<p>` handler (line 80-92): when a `<p>` contains `<br>`, split correctly but also **preserve empty splits as spacer paragraphs** instead of discarding them
- Ensure idempotency: running normalizer on already-normalized content should produce the same output

### 3. `src/pages/StoryDetail.tsx` — Published view

- Keep existing `[&_p]:!my-2` and `[&_p.spacer]` styles (already correct)
- No changes needed if normalizer output is consistent

### 4. Preview in `Write.tsx`

- Same prose styles as StoryDetail for consistency

## Result

- **Single Enter** → new `<p>` (normal paragraph break)
- **Double Enter** → `<p class="spacer"><br></p>` (visible gap)
- **Storage** → clean `<p>` HTML, consistent across save/load cycles
- **Re-edit** → content loads exactly as written, no lost spacing

