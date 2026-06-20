'use client';

import Link from 'next/link';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
}

export default function Navbar({ title, showBack = true }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="navbar-logo">♟ CaturKita</span>
        </Link>
        {title && (
          <span
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        )}
        {showBack && (
          <Link href="/" className="btn btn-secondary btn-sm" id="btn-back-home">
            ← Beranda
          </Link>
        )}
      </div>
    </nav>
  );
}
