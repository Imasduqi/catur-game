import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home-hero">
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'fixed', width: '100%', top: 0, left: 0 }}>
        <div className="navbar-inner">
          <span className="navbar-logo">♟ CaturKita</span>
        </div>
      </nav>

      {/* Hero content */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '4rem' }}>
        <h1 className="home-title">Main Catur<br />Online</h1>
        <p className="home-subtitle">
          Tantang komputer dengan 3 level kesulitan, atau ajak temanmu bermain
          secara realtime — langsung dari browser, tanpa install apapun.
        </p>

        <div className="mode-cards">
          {/* VS Komputer */}
          <Link href="/vs-komputer" style={{ textDecoration: 'none' }}>
            <div className="mode-card">
              <span className="mode-card-icon">🤖</span>
              <div className="mode-card-title">vs Komputer</div>
              <div className="mode-card-desc">
                Main sendiri melawan AI Stockfish. Pilih level mudah, sedang,
                atau sulit.
              </div>
            </div>
          </Link>

          {/* VS Teman */}
          <Link href="/vs-teman" style={{ textDecoration: 'none' }}>
            <div className="mode-card">
              <span className="mode-card-icon">👥</span>
              <div className="mode-card-title">vs Teman</div>
              <div className="mode-card-desc">
                Buat room, bagikan link ke teman, dan bermain secara realtime
                dengan papan yang sinkron.
              </div>
            </div>
          </Link>
        </div>

        {/* Feature highlights */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: '3rem',
          }}
        >
          {[
            '♟ Papan drag-and-drop',
            '⏱ Timer opsional',
            '♜ Promosi pion',
            '🔄 Auto-flip papan',
            '📱 Mobile friendly',
            '⚡ Realtime',
          ].map((feat) => (
            <span key={feat} className="badge badge-accent">
              {feat}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
