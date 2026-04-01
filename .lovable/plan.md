

# Rapihkan Admin Dashboard — Pagination + Grouping by Month/Year

## Overview
Tambahkan pagination (20 item per halaman) dan pengelompokan berdasarkan Bulan & Tahun untuk ketiga tab: Users, IC Orders, dan Stories & Backup.

## Perubahan (1 file: `src/pages/Admin.tsx`)

### 1. Users Tab
- Grup user berdasarkan bulan+tahun registrasi (`joined_at`), tampilkan header separator "November 2025", "October 2025", dst
- Pagination 20 user per halaman dengan navigasi halaman di bawah
- State baru: `userPage`

### 2. IC Orders Tab
- Grup order berdasarkan bulan+tahun `created_at`, tampilkan header separator per bulan
- Pagination 20 order per halaman
- State baru: `orderPage`
- Tambah date filter dropdown (mirip Stories tab yang sudah ada)

### 3. Stories & Backup Tab
- Grup story berdasarkan bulan+tahun `published_at`, tampilkan header separator per bulan
- Pagination 20 story per halaman (sudah ada date filter, tinggal tambah pagination)
- State baru: `storyPage`

### 4. Shared Pattern
- Helper function `groupByMonth(items, dateKey)` yang mengembalikan items diurutkan dengan section headers
- Komponen pagination sederhana (Previous / 1 2 3 / Next) menggunakan UI pagination yang sudah ada di project
- Reset halaman ke 1 saat filter/search berubah

### Detail Teknis
- Semua perubahan di `src/pages/Admin.tsx` saja
- Menggunakan `src/components/ui/pagination.tsx` yang sudah ada
- Tidak ada perubahan database

