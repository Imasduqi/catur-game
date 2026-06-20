'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function MainPublikPage() {
  const router = useRouter();
  const { user, profile, isGuest, guestSessionId, loading } = useAuth();

  const [status, setStatus] = useState<'initializing' | 'searching' | 'matched' | 'cancelled' | 'fallback'>('initializing');
  const [seconds, setSeconds] = useState(0);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [opponentElo, setOpponentElo] = useState<number | null>(null);

  const queueIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const myElo = user ? (profile?.rating_pvp || 1200) : 1200;

  // Protect route
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.replace('/');
    }
  }, [loading, user, isGuest, router]);

  // Handle Matchmaking Search lifecycle
  useEffect(() => {
    if (loading || (!user && !isGuest)) return;

    const startMatchmaking = async () => {
      setStatus('searching');
      setSeconds(0);

      // 1. Call RPC join_matchmaking
      try {
        const { data, error } = await supabase.rpc('join_matchmaking', {
          p_elo: myElo,
          p_guest_session_id: isGuest ? guestSessionId : null
        });

        if (error) throw error;
        if (!data || !data[0]) throw new Error('Format respon matchmaking tidak valid');

        const result = data[0];
        
        if (result.match_status === 'matched') {
          // Immediately matched!
          setStatus('matched');
          setOpponentName(result.opponent_name || 'Lawan');
          setOpponentElo(result.opponent_elo || 1200);
          
          setTimeout(() => {
            router.push(`/vs-teman/${result.room_id}?host=1&color=w&timer=300&mode=main_publik`);
          }, 1500);
        } else {
          // Waiting in queue
          queueIdRef.current = result.queue_id;

          // Start search timer
          timerRef.current = setInterval(() => {
            setSeconds((prev) => {
              if (prev >= 30) {
                // Fallback to stockfish after 30 seconds
                handleFallback();
                return prev;
              }
              return prev + 1;
            });
          }, 1000);

          // Subscribe to my queue row updates
          const channel = supabase
            .channel(`matchmaking_queue_row:${result.queue_id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'matchmaking_queue',
                filter: `id=eq.${result.queue_id}`,
              },
              (payload) => {
                const updatedRow = payload.new;
                if (updatedRow.status === 'matched' && updatedRow.matched_room_id) {
                  // Clean up local timer
                  if (timerRef.current) clearInterval(timerRef.current);
                  setStatus('matched');
                  
                  // Redirect as Guest to the room after a brief delay
                  setTimeout(() => {
                    router.push(`/vs-teman/${updatedRow.matched_room_id}?mode=main_publik`);
                  }, 1500);
                }
              }
            )
            .subscribe();

          channelRef.current = channel;
        }
      } catch (err) {
        console.error('Error starting matchmaking:', err);
        alert('Gagal memulai matchmaking. Silakan coba kembali.');
        router.replace('/');
      }
    };

    startMatchmaking();

    return () => {
      cleanupQueue();
    };
  }, [loading, user, isGuest]);

  const cleanupQueue = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Unsubscribe from channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    // Delete queue row from database asynchronously if we are leaving
    const queueId = queueIdRef.current;
    if (queueId) {
      queueIdRef.current = null;
      supabase
        .from('matchmaking_queue')
        .delete()
        .eq('id', queueId)
        .then(({ error }) => {
          if (error) console.error('Error cleaning up matchmaking row:', error);
        });
    }
  };

  const handleCancel = () => {
    setStatus('cancelled');
    cleanupQueue();
    router.replace('/');
  };

  const handleFallback = () => {
    setStatus('fallback');
    cleanupQueue();
    setTimeout(() => {
      // Clamped Elo configuration for Stockfish:
      // Redirect to vs-komputer in main_publik mode with elo param
      router.push(`/vs-komputer?mode=main_publik&elo=${myElo}`);
    }, 1500);
  };

  if (loading || status === 'initializing') {
    return (
      <>
        <Navbar title="Main Publik" showBack={false} />
        <div className="home-hero flex justify-center items-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Menyiapkan Matchmaking...</h2>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Main Publik" showBack={false} />
      <main
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div className="card-elevated" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--color-border-strong)' }}>
          {status === 'searching' && (
            <>
              {/* Pulsing Radar Animation */}
              <div className="radar-container" style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
                <div className="radar-circle circle-1"></div>
                <div className="radar-circle circle-2"></div>
                <div className="radar-circle circle-3"></div>
                <div style={{ zIndex: 10, fontSize: '3rem', filter: 'drop-shadow(0 0 10px var(--color-accent-primary))' }}>⚡</div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Mencari Lawan...</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Rating Anda: <strong style={{ color: 'var(--color-accent-gold)' }}>🏆 {myElo}</strong>
                </p>
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
              </div>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', maxWidth: '300px' }}>
                Menghubungkan Anda dengan pemain lain. Jika tidak ditemukan lawan dalam 30 detik, Anda akan otomatis bermain dengan Komputer (Stockfish) yang kekuatannya disesuaikan dengan rating Anda.
              </p>

              <button className="btn btn-secondary w-full" onClick={handleCancel} style={{ background: 'rgba(255, 92, 92, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(255, 92, 92, 0.2)' }}>
                🚫 Batalkan Pencarian
              </button>
            </>
          )}

          {status === 'matched' && (
            <>
              <div className="success-check" style={{ fontSize: '4rem', animation: 'bounce 0.5s ease-out' }}>
                🤝
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>Lawan Ditemukan!</h2>
                {opponentName && (
                  <p style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {opponentName} {opponentElo && `(🏆 ${opponentElo})`}
                  </p>
                )}
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Mempersiapkan papan permainan...
                </p>
              </div>
            </>
          )}

          {status === 'fallback' && (
            <>
              <div style={{ fontSize: '4rem' }}>🤖</div>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-warning)', marginBottom: '0.5rem' }}>Bermain vs Komputer</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Lawan publik tidak ditemukan dalam 30 detik.
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Kekuatan AI Stockfish disesuaikan dengan rating Elo Anda ({myElo}).
                </p>
              </div>
            </>
          )}

          {status === 'cancelled' && (
            <>
              <div style={{ fontSize: '4rem' }}>✕</div>
              <h2>Pencarian Dibatalkan</h2>
            </>
          )}
        </div>
      </main>

      <style jsx global>{`
        .radar-container {
          position: relative;
        }
        .radar-circle {
          position: absolute;
          border: 2px solid var(--color-accent-primary);
          border-radius: 50%;
          inset: 0;
          opacity: 0;
          animation: pulseRadar 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        }
        .circle-1 {
          animation-delay: 0s;
        }
        .circle-2 {
          animation-delay: 0.6s;
        }
        .circle-3 {
          animation-delay: 1.2s;
        }
        
        @keyframes pulseRadar {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes bounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
