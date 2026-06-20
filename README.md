# ♟️ Catur Online — Web Chess Game

Aplikasi catur berbasis web yang bisa langsung dimainkan tanpa instalasi. Main sebagai tamu, tantang teman lewat link, lawan komputer, atau cari lawan publik secara otomatis.

## ✨ Fitur

### 🎮 Mode Permainan
- **vs Komputer** — 3 level kesulitan (Mudah/Sedang/Sulit) ditenagai Stockfish, langsung main tanpa login.
- **vs Teman** — tantang teman lewat link yang bisa dibagikan, dengan opsi jam catur (timer) yang bisa diaktifkan/dinonaktifkan.
- **Main Publik** — matchmaking otomatis dengan pemain lain. Kalau lawan tidak ditemukan dalam 30 detik, otomatis dialihkan ke vs Komputer dengan kekuatan menyesuaikan rating Elo pemain.

### 👤 Akun & Progres
- Bisa langsung main sebagai **Tamu** tanpa daftar apa pun.
- Opsional bikin akun via **Email/Password** atau **OAuth (Google/GitHub)**.
- Pemain yang login mendapat:
  - Rating Elo (terpisah untuk PvP — vs Teman & Main Publik)
  - Riwayat permainan (vs Teman, vs Komputer, Main Publik)
  - Halaman profil dengan statistik

### 🛠️ Lainnya
- Gerak bidak via drag-and-drop maupun tap/klik (ramah mobile)
- Papan otomatis flip sesuai warna pemain
- Popup pemilihan bidak saat promosi pion
- Fitur menyerah (resign)
- Tema terang/gelap (manual atau mengikuti sistem)
- Responsif penuh untuk perangkat mobile
- Deteksi otomatis room penuh, koneksi terputus, dan reconnect setelah refresh

## 🧱 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router) |
| Logika catur | chess.js |
| UI Papan | react-chessboard |
| Lawan komputer | Stockfish (WASM, single-threaded lite) |
| Realtime multiplayer | Supabase Realtime |
| Auth & Database | Supabase (Postgres + Auth) |

## 🚀 Memulai (Development)

### Prasyarat
- Node.js 18+
- Project Supabase (tier gratis sudah cukup)

### Instalasi
```bash
git clone <repo-url>
cd catur-app
npm install
```

### Environment Variables
Buat file `.env.local` di root project:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Setup Database
Jalankan migration SQL yang ada di `supabase/migrations/` lewat **Supabase SQL Editor** (atau `supabase db push` kalau pakai Supabase CLI). Ini akan membuat:
- Tabel `profiles`, `games`, `matchmaking_queue`
- Row Level Security (RLS) policy
- Fungsi RPC `record_game` dan `join_matchmaking` untuk kalkulasi Elo yang aman di sisi server

### Aktifkan Auth Provider
Di **Supabase Dashboard → Authentication → Providers**, aktifkan:
- Email
- Google OAuth
- GitHub OAuth

Callback URL untuk OAuth: `https://<project-ref>.supabase.co/auth/v1/callback`

### Jalankan secara lokal
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

## ☁️ Deployment

Direkomendasikan deploy ke **Vercel**:
1. Push project ke GitHub.
2. Import repo di [vercel.com](https://vercel.com).
3. Tambahkan environment variable yang sama (lihat bagian Environment Variables) di **Project Settings → Environment Variables**.
4. Deploy.

> Catatan: kalau project menyimpan file besar (misal engine WASM), pastikan tidak ter-track oleh Git LFS tanpa konfigurasi yang sesuai, atau gunakan versi engine yang lebih kecil agar kompatibel dengan batas ukuran file Git biasa.

## 🗺️ Roadmap

- [x] Fase 1 — Main sebagai tamu (vs Komputer, vs Teman via link)
- [x] Fase 2 — Akun, rating Elo, riwayat permainan, Main Publik (matchmaking)
- [ ] Draw offer & rematch
- [ ] Chat dalam permainan
- [ ] Panel riwayat langkah (notasi PGN/SAN)
- [ ] Efek suara

## 📄 Lisensi

Belum ditentukan — tambahkan lisensi sesuai kebutuhan (mis. MIT) jika project akan bersifat open source.