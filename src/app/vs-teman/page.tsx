'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PieceColor } from '@/types/chess';

function generateRoomId(): string {
  // 6-char alphanumeric room ID
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TIMER_OPTIONS = [
  { label: 'Tanpa Timer', value: 0 },
  { label: '1 menit', value: 60 },
  { label: '3 menit', value: 180 },
  { label: '5 menit', value: 300 },
  { label: '10 menit', value: 600 },
  { label: '15 menit', value: 900 },
];

export default function VsTemanPage() {
  const router = useRouter();
  const [colorChoice, setColorChoice] = useState<PieceColor | 'random'>('random');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'buat' | 'gabung'>('buat');

  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    const params = new URLSearchParams();
    params.set('host', '1');
    params.set('color', colorChoice);
    if (timerSeconds > 0) params.set('timer', String(timerSeconds));
    router.push(`/vs-teman/${roomId}?${params.toString()}`);
  };

  const handleJoinRoom = () => {
    const id = joinRoomId.trim().toUpperCase();
    if (!id || id.length < 4) return;
    router.push(`/vs-teman/${id}`);
  };

  return (
    <>
      <Navbar title="vs Teman" />
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
            Main vs Teman
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Buat room lalu bagikan link ke temanmu, atau masukkan ID room yang kamu dapat.
          </p>

          {/* Tab switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              marginBottom: '1.5rem',
              gap: '4px',
            }}
          >
            {(['buat', 'gabung'] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab ? 'var(--color-accent-primary)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--color-text-secondary)',
                  boxShadow: activeTab === tab ? '0 2px 8px var(--color-accent-glow)' : 'none',
                }}
              >
                {tab === 'buat' ? '✨ Buat Room' : '🔗 Gabung Room'}
              </button>
            ))}
          </div>

          {/* Create room */}
          {activeTab === 'buat' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Color choice */}
              <div>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                  }}
                >
                  Pilih Warna
                </p>
                <div className="color-picker">
                  {([
                    { value: 'w', icon: '♔', label: 'Putih' },
                    { value: 'random', icon: '🎲', label: 'Acak' },
                    { value: 'b', icon: '♚', label: 'Hitam' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      id={`color-opt-${opt.value}`}
                      className={`color-option ${colorChoice === opt.value ? 'selected' : ''}`}
                      onClick={() => setColorChoice(opt.value)}
                    >
                      <span className="piece-icon">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  Timer (per pemain)
                </p>
                <select
                  id="timer-select"
                  className="select"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Number(e.target.value))}
                >
                  {TIMER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="btn-create-room"
                className="btn btn-primary btn-lg w-full"
                onClick={handleCreateRoom}
              >
                ✨ Buat Room
              </button>
            </div>
          )}

          {/* Join room */}
          {activeTab === 'gabung' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  Masukkan ID Room
                </p>
                <input
                  id="input-room-id"
                  className="input"
                  placeholder="contoh: X7K3P2"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  maxLength={8}
                  style={{ fontFamily: 'Outfit, monospace', letterSpacing: '0.1em', fontSize: '1.1rem' }}
                />
              </div>
              <button
                id="btn-join-room"
                className="btn btn-primary btn-lg w-full"
                onClick={handleJoinRoom}
                disabled={joinRoomId.trim().length < 4}
              >
                🔗 Gabung Room
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
