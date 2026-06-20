'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
}

export default function AuthModal({ isOpen }: AuthModalProps) {
  const { loginAsGuest } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        // Sign Up
        if (!username || username.trim().length < 3) {
          throw new Error('Username minimal 3 karakter');
        }
        
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });
        
        if (signUpError) throw signUpError;
        setSuccessMsg('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi atau langsung login jika konfirmasi email dinonaktifkan.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError(null);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oAuthError) throw oAuthError;
    } catch (err: any) {
      setError(err.message || `Gagal login dengan ${provider}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', position: 'relative' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>♟ CaturKita</h2>
          <p style={{ fontSize: '0.875rem' }}>
            Main online dengan rating Elo & riwayat game, atau lanjut sebagai tamu.
          </p>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
              setSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              color: isLoginTab ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              borderBottom: isLoginTab ? '2px solid var(--color-accent-primary)' : 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Masuk
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
              setSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              color: !isLoginTab ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              borderBottom: !isLoginTab ? '2px solid var(--color-accent-primary)' : 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Daftar Akun
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              style={{
                background: 'rgba(255, 92, 92, 0.1)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(62, 207, 142, 0.1)',
                border: '1px solid var(--color-success)',
                color: 'var(--color-success)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              {successMsg}
            </div>
          )}

          {!isLoginTab && (
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Username</label>
              <input
                type="text"
                placeholder="Username Anda"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLoginTab}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : isLoginTab ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: 'var(--color-text-muted)',
            fontSize: '0.8rem',
          }}
        >
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <span style={{ padding: '0 0.75rem' }}>atau masuk dengan</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => handleOAuthLogin('google')}
            className="btn w-full"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)',
            }}
          >
            <span style={{ marginRight: '4px' }}>Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="btn w-full"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)',
            }}
          >
            <span style={{ marginRight: '4px' }}>GitHub</span>
          </button>
        </div>

        {/* Guest Button */}
        <button
          onClick={loginAsGuest}
          className="btn w-full"
          style={{
            background: 'none',
            border: '2px dashed var(--color-accent-primary)',
            color: 'var(--color-accent-primary)',
          }}
        >
          Lanjut sebagai Tamu
        </button>
      </div>
    </div>
  );
}
