'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function ProfileCard() {
  const { user, profile, isGuest, signOut, updateUsername } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setNewUsername(profile.username);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      setLoadingGames(true);
      supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)
        .then(({ data, error }) => {
          if (!error && data) {
            setGames(data);
          }
          setLoadingGames(false);
        });
    } else {
      setGames([]);
    }
  }, [user]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      alert('Username minimal 3 karakter');
      return;
    }
    setUpdating(true);
    const { success, error } = await updateUsername(newUsername.trim());
    setUpdating(false);
    if (success) {
      setEditMode(false);
    } else {
      alert(error || 'Gagal mengubah username');
    }
  };

  if (isGuest) {
    return (
      <div className="card-elevated" style={{ padding: 'var(--space-6)', minHeight: '300px' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          👤 Mode Tamu
        </h3>
        <div style={{ margin: '1.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Anda bermain sebagai <strong>Tamu</strong>. Nilai rating default Anda adalah <strong>1200</strong>.
          </p>
          <p>
            Riwayat game Anda tidak akan disimpan secara permanen dan rating Anda tidak akan di-update di leaderboard.
          </p>
        </div>
        <button
          onClick={signOut}
          className="btn btn-primary w-full"
          style={{ marginTop: '1.5rem' }}
        >
          Masuk / Daftar Akun
        </button>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Profile Info Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {editMode ? (
            <form onSubmit={handleUpdateUsername} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '0.9rem', maxWidth: '150px' }}
                disabled={updating}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={updating} style={{ padding: '4px 8px' }}>
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setNewUsername(profile.username);
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{profile.username}</h3>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
                title="Edit Username"
              >
                ✏️
              </button>
            </div>
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{user.email}</span>
        </div>

        {/* Rating Display */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Rating PvP
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-gold)' }}>
            🏆 {profile.rating_pvp}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={signOut}
          className="btn btn-secondary btn-sm w-full"
          style={{
            background: 'rgba(255, 92, 92, 0.1)',
            color: 'var(--color-danger)',
            border: '1px solid rgba(255, 92, 92, 0.2)',
          }}
        >
          Keluar
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {/* Game History List */}
      <div>
        <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
          📜 Riwayat Game
        </h4>

        {loadingGames ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
            Memuat riwayat game...
          </div>
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>
            Belum ada permainan yang tercatat.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {games.map((game) => {
              const date = new Date(game.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              });

              let resultColor = 'var(--color-text-muted)';
              let resultLabel = 'Seri';
              if (game.result === 'menang') {
                resultColor = 'var(--color-success)';
                resultLabel = 'Menang';
              } else if (game.result === 'kalah') {
                resultColor = 'var(--color-danger)';
                resultLabel = 'Kalah';
              }

              let modeLabel = '';
              switch (game.mode) {
                case 'vs_komputer':
                  modeLabel = 'vs Komputer';
                  break;
                case 'vs_teman':
                  modeLabel = 'vs Teman';
                  break;
                case 'main_publik':
                  modeLabel = 'Main Publik';
                  break;
              }

              return (
                <div
                  key={game.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-bg-secondary)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {modeLabel}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Lawan: {game.opponent_label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: resultColor, fontWeight: 700 }}>
                      {resultLabel}
                    </span>
                    {game.rating_change !== null && (
                      <span
                        style={{
                          fontWeight: 600,
                          color: game.rating_change >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
                      >
                        {game.rating_change >= 0 ? `+${game.rating_change}` : game.rating_change}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
