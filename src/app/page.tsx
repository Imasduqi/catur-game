'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/AuthModal';
import ProfileCard from '@/components/ProfileCard';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="home-hero flex justify-center items-center" style={{ height: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>♟ Memuat CaturKita...</h2>
          <div
            style={{
              border: '4px solid rgba(255,255,255,0.1)',
              borderLeftColor: 'var(--color-accent-primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }}
          ></div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const showAuthModal = !user && !isGuest;

  return (
    <main className="home-hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar (showBack = false for homepage) */}
      <Navbar showBack={false} />

      {/* Main Grid Layout */}
      <div className="container" style={{ marginTop: '5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            paddingBottom: '3rem',
          }}
          className="home-grid"
        >
          {/* Left Column: Hero & Play Modes */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 className="home-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', lineHeight: '1.15', marginBottom: '1.15rem' }}>
              Main Catur<br />Online & Realtime
            </h1>
            <p className="home-subtitle" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
              Tantang komputer dengan level Stockfish yang disesuaikan, buat room untuk bermain bersama teman,
              atau masuk antrian Main Publik untuk matchmaking PvP otomatis.
            </p>

            <div className="mode-cards" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {/* Matchmaking / Main Publik Card */}
              <Link href="/main-publik" style={{ textDecoration: 'none' }}>
                <div
                  className="mode-card"
                  style={{
                    border: '2px solid var(--color-accent-primary)',
                    boxShadow: 'var(--shadow-glow-accent)',
                    background: 'rgba(124, 106, 247, 0.05)',
                  }}
                >
                  <span className="mode-card-icon" style={{ filter: 'drop-shadow(0 0 8px var(--color-accent-primary))' }}>⚡</span>
                  <div className="mode-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Main Publik
                    <span className="badge badge-accent" style={{ fontSize: '0.7rem', padding: '2px 8px', textTransform: 'uppercase' }}>PvP Otomatis</span>
                  </div>
                  <div className="mode-card-desc">
                    Masuk antrian matchmaking otomatis melawan pemain lain yang aktif secara online. Fallback ke komputer jika lawan tidak ditemukan dalam 30 detik.
                  </div>
                </div>
              </Link>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '1rem',
                }}
                className="mode-grid-sub"
              >
                {/* VS Komputer */}
                <Link href="/vs-komputer" style={{ textDecoration: 'none' }}>
                  <div className="mode-card" style={{ height: '100%' }}>
                    <span className="mode-card-icon">🤖</span>
                    <div className="mode-card-title">vs Komputer</div>
                    <div className="mode-card-desc">
                      Main melawan AI Stockfish lokal di browser. Pilih tingkat kesulitan Mudah, Sedang, atau Sulit.
                    </div>
                  </div>
                </Link>

                {/* VS Teman */}
                <Link href="/vs-teman" style={{ textDecoration: 'none' }}>
                  <div className="mode-card" style={{ height: '100%' }}>
                    <span className="mode-card-icon">👥</span>
                    <div className="mode-card-title">vs Teman</div>
                    <div className="mode-card-desc">
                      Buat room privat dengan jam catur kustom, bagikan link tantangan untuk bermain realtime dengan teman.
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Badges */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '2.5rem',
              }}
            >
              {[
                '🏆 Sistem Rating Elo',
                '⚡ Matchmaking Realtime',
                '⏱ Jam Catur Kustom',
                '📜 Riwayat Permainan',
                '📱 Mobile Friendly',
                '🤖 Fallback AI Stockfish',
              ].map((feat) => (
                <span key={feat} className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
                  {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Profile & History */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '1rem' }}>
            <ProfileCard />
          </div>
        </div>
      </div>

      {/* Auth Modal Overlay (forces login/register or guest session selection) */}
      <AuthModal isOpen={showAuthModal} />

      <style jsx global>{`
        @media (min-width: 900px) {
          .home-grid {
            grid-template-columns: 1.6fr 1fr !important;
          }
        }
        @media (min-width: 600px) {
          .mode-grid-sub {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
