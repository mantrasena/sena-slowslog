

# Implementasi Route `/@username`

## Perubahan

### 1. `src/App.tsx` — Tambah route baru + redirect lama
- Tambah `<Route path="/@:username" element={<Profile />} />`
- Ubah route lama `/profile/:username` menjadi redirect ke `/@:username` agar link lama tetap berfungsi

### 2. Update semua link internal ke format `/@username`
File yang perlu diubah (5 file, 5 lokasi):

| File | Perubahan |
|------|-----------|
| `src/components/StoryCard.tsx` | `/profile/${username}` → `/@${username}` |
| `src/components/Header.tsx` | `/profile/${username}` → `/@${username}` |
| `src/pages/StoryDetail.tsx` | 2 link `/profile/` → `/@` |
| `src/components/SearchDialog.tsx` | `/profile/${username}` → `/@${username}` |

### 3. `src/pages/Profile.tsx` — Tidak perlu diubah
`useParams()` tetap mengembalikan `username` dengan benar karena `@` adalah bagian dari path prefix, bukan parameter.

## Dampak
- URL lama (`/profile/mantra`) otomatis redirect ke `/@mantra`
- Tidak ada perubahan database atau query
- Semua link internal langsung menggunakan format baru

