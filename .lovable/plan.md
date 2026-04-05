

# Inner Circle Membership Details (Plan + Expiry Tracking)

## Overview
Add membership plan tracking (1 Year / Lifetime) with start/end dates. Admin can select plan type when granting IC. Users can click to see their membership details.

## Database Migration

New table `ic_memberships`:
```sql
CREATE TABLE public.ic_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL, -- 'yearly' or 'lifetime'
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, -- NULL for lifetime
  granted_by uuid, -- admin who granted
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ic_memberships ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed for profile display)
CREATE POLICY "Memberships readable by everyone" ON public.ic_memberships FOR SELECT TO public USING (true);

-- Admins/founders can manage
CREATE POLICY "Admins can manage memberships" ON public.ic_memberships FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Founders can manage memberships" ON public.ic_memberships FOR ALL TO public USING (has_role(auth.uid(), 'founder'::app_role));
```

## Changes

### 1. Admin — Grant IC with plan selection (`src/pages/Admin.tsx`)

**Users tab IC button**: Replace the simple toggle with a dropdown/dialog that asks:
- Plan: `1 Year` or `Lifetime`
- On grant: insert into `ic_memberships` (plan, starts_at, expires_at = starts_at + 1 year for yearly, NULL for lifetime), then add `inner_circle` role as before
- On remove: delete from `ic_memberships` + remove role
- Display on user row: small label showing plan type and dates (e.g., "1Y: Apr 2026 – Apr 2027" or "Lifetime ∞")

**IC Orders approve flow**: When approving an order, use the order's `plan` field to create the membership record with correct dates.

### 2. Admin — Membership info visible in user list

Each user with IC shows a small text under their name:
- Yearly: `1Y: 05 Apr 2026 → 05 Apr 2027`
- Lifetime: `Lifetime ∞`

### 3. User side — Settings page (`src/pages/Settings.tsx`)

The existing Inner Circle status box becomes clickable (when user is IC member). Clicking expands/reveals membership details:
- Plan type (1 Year / Lifetime)
- Start date
- Expiry date (or "Lifetime — no expiration")
- Styled consistently with existing muted boxes

### 4. User side — Profile page (`src/pages/Profile.tsx`)

On own profile, the IC badge area (below bio) shows clickable membership info similar to Settings.

### 5. Hook — `useICMembership` (`src/hooks/useICMembership.ts`)

Reusable hook to fetch membership details for a user:
```ts
const { data: membership } = useICMembership(userId);
// returns { plan, starts_at, expires_at } or null
```

## UI Examples

**Admin user row:**
```text
[Avatar] Display Name ✓ Writer
         @username
         Joined Mar 2025
         IC: 1Y · Apr 2026 → Apr 2027    [IC ▼] [Role ▼]
```

**Settings IC box (expanded):**
```text
☑ Inner Circle
  you're an Inner Circle member! (★‿★)
  ┌─────────────────────────────┐
  │ Plan: 1 Year                │
  │ Started: 05 April 2026      │
  │ Expires: 05 April 2027      │
  └─────────────────────────────┘
```

**Lifetime variant:**
```text
  │ Plan: Lifetime ∞            │
  │ Started: 05 April 2026      │
  │ Expires: never (◕ᴗ◕✿)      │
```

## Files
1. **Migration** — new `ic_memberships` table
2. `src/hooks/useICMembership.ts` — new hook
3. `src/pages/Admin.tsx` — IC grant with plan picker + display membership info
4. `src/pages/Settings.tsx` — clickable IC status with details
5. `src/pages/Profile.tsx` — show IC membership details on own profile

