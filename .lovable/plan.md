

## Plan: Google Sign-In Only + Toggleable Invite Code

### Perubahan

**1. Database migration**
- Update trigger `handle_new_user` untuk ambil `avatar_url` dan `full_name` dari Google metadata (`raw_user_meta_data->>'avatar_url'`, `raw_user_meta_data->>'full_name'`)
- Insert default site setting `invite_required` = `{ "enabled": true }`

**2. `src/pages/Auth.tsx` — tulis ulang total**
- Hapus semua form email/password, forgot password, invite code di signup
- Tampilkan satu tombol "Sign in with Google" via `lovable.auth.signInWithOAuth("google")`
- Setelah Google sign-in berhasil, cek apakah user baru (profile belum ada) DAN invite mode ON:
  - Jika ya → tampilkan input invite code, validasi via RPC `use_invite_code`
  - Jika tidak → redirect ke home
- State management: `needsInviteCode` boolean untuk toggle antara Google button dan invite code input

**3. `src/App.tsx`**
- Hapus route `/reset-password`
- Hapus import `ResetPassword`

**4. Hapus `src/pages/ResetPassword.tsx`**

**5. `src/pages/Admin.tsx` — tambah toggle "Require Invite Code"**
- Di Settings tab, tambah card baru dengan Switch untuk toggle `invite_required` setting
- Query dan update ke `site_settings` table, pattern sama seperti `inner_circle_enabled` toggle yang sudah ada
- Letakkan di atas `InviteCodeManager` supaya kontekstual

### Alur

```text
User → /auth → "Sign in with Google" button
  → Google OAuth redirect → callback
  → Cek profile exists?
    → YES (returning user) → redirect /
    → NO (new user) → cek invite_required setting
      → ON  → tampilkan invite code input → validasi → redirect /
      → OFF → redirect /
```

### File

| File | Aksi |
|------|------|
| Migration SQL | Update trigger + insert `invite_required` setting |
| `src/pages/Auth.tsx` | Tulis ulang — Google only + conditional invite |
| `src/pages/ResetPassword.tsx` | Hapus |
| `src/App.tsx` | Hapus route reset-password |
| `src/pages/Admin.tsx` | Tambah toggle invite_required di Settings |

