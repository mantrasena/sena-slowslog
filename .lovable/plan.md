

## Plan: Invite-Only Registration

### Masalah
Siapa pun bisa mendaftar dengan email asal-asalan dan langsung masuk. Kamu ingin registrasi hanya untuk orang yang punya kode undangan.

### Pendekatan
Buat sistem **invite code** terpisah dari voucher (yang sudah dipakai untuk diskon Inner Circle). Admin/Founder bisa membuat invite code dari dashboard, dan user wajib memasukkan kode saat sign up.

### Perubahan

**1. Database — tabel baru `invite_codes`**
- Kolom: `id`, `code` (unique), `max_uses`, `used_count`, `is_active`, `created_at`
- RLS: readable oleh semua (untuk validasi saat signup), manageable oleh admin/founder
- Fungsi SQL `use_invite_code(p_code text)` — validasi kode aktif, belum penuh, lalu increment `used_count`. Return boolean.

**2. Auth page (`src/pages/Auth.tsx`)**
- Tambah field **"invite code"** di form sign up (required)
- Sebelum memanggil `supabase.auth.signUp`, panggil RPC `use_invite_code` untuk validasi
- Jika kode tidak valid → tampilkan error, batalkan signup
- Jika valid → lanjut signup seperti biasa
- Pesan sukses diganti: "account created (◕‿◕)" + auto-login + redirect ke home (sesuai plan sebelumnya)

**3. Admin dashboard — tab/section Invite Codes**
- Komponen baru `InviteCodeManager.tsx` di halaman Admin
- Fitur: generate kode (format `SENA-XXXXXX`), set max uses, toggle aktif/nonaktif, hapus, copy kode
- UI mirip VoucherManager yang sudah ada

**4. Forgot password flow** (dari plan sebelumnya, tetap diimplementasi)
- Link "forgot password?" di halaman Auth
- Halaman baru `/reset-password` untuk set password baru
- Route baru di `App.tsx`

### Alur User
```text
User buka /auth → pilih "sign up"
  → isi invite code, username, email, password
  → klik "create account"
  → sistem validasi kode via RPC
  → jika invalid: "invalid or expired invite code"
  → jika valid: signup + auto-login → redirect ke home
```

### File yang berubah/dibuat
| File | Aksi |
|------|------|
| Migration SQL | Tabel `invite_codes` + fungsi `use_invite_code` |
| `src/pages/Auth.tsx` | Tambah field invite code, auto-login, forgot password link |
| `src/pages/ResetPassword.tsx` | Baru — form reset password |
| `src/components/admin/InviteCodeManager.tsx` | Baru — kelola invite codes |
| `src/pages/Admin.tsx` | Tambah tab/section invite codes |
| `src/App.tsx` | Tambah route `/reset-password` |

