'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
}

export default function Navbar({ title, showBack = true }: NavbarProps) {
  const { user, profile, isGuest, signOut } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="navbar-logo">♟ CaturKita</span>
          </Link>
          {title && (
            <span
              style={{
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                borderLeft: '1px solid var(--color-border)',
                paddingLeft: '1rem',
              }}
            >
              {title}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* User Status Badge */}
          {user && profile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-strong)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {profile.username}
              </span>
              <span style={{ color: 'var(--color-accent-gold)', fontWeight: 700 }}>
                🏆 {profile.rating_pvp}
              </span>
            </div>
          )}

          {isGuest && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-strong)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>👤 Tamu</span>
              <span style={{ color: 'var(--color-text-muted)' }}>(1200)</span>
            </div>
          )}

          {showBack && (
            <Link href="/" className="btn btn-secondary btn-sm" id="btn-back-home" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              ← Beranda
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
