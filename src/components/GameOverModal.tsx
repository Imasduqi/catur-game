'use client';

import { GameStatus, PieceColor } from '@/types/chess';

interface GameOverModalProps {
  status: GameStatus;
  winner: PieceColor | 'draw' | null;
  playerColor?: PieceColor; // used in vs komputer to show "Kamu menang/kalah"
  onPlayAgain: () => void;
  onGoHome: () => void;
  isOpen: boolean;
  onClose: () => void;
  ratingChange?: number | null; // rating change feedback
}

function getResultInfo(
  status: GameStatus,
  winner: PieceColor | 'draw' | null,
  playerColor?: PieceColor
): { icon: string; title: string; subtitle: string } {
  if (status === 'draw' || status === 'stalemate') {
    return {
      icon: '🤝',
      title: 'Seri!',
      subtitle: status === 'stalemate' ? 'Stalemate — tidak ada langkah yang valid.' : 'Permainan berakhir seri.',
    };
  }

  if (status === 'resigned') {
    const resignerWon = winner === playerColor;
    if (playerColor) {
      return resignerWon
        ? { icon: '🏆', title: 'Kamu Menang!', subtitle: 'Lawan menyerah.' }
        : { icon: '🏳️', title: 'Kamu Kalah', subtitle: 'Kamu memilih untuk menyerah (resign).' };
    }
    return {
      icon: '🏳️',
      title: `${winner === 'w' ? 'Putih' : 'Hitam'} Menang`,
      subtitle: 'Lawan menyerah.',
    };
  }

  if (status === 'checkmate') {
    if (playerColor) {
      const playerWon = winner === playerColor;
      return playerWon
        ? { icon: '🏆', title: 'Kamu Menang!', subtitle: 'Skakmat — raja lawan tertawan!' }
        : { icon: '😔', title: 'Kamu Kalah', subtitle: 'Skakmat — rajamu tertawan.' };
    }
    return {
      icon: '♛',
      title: `${winner === 'w' ? 'Putih' : 'Hitam'} Menang!`,
      subtitle: 'Skakmat!',
    };
  }

  return { icon: '♟', title: 'Permainan Selesai', subtitle: '' };
}

export default function GameOverModal({
  status,
  winner,
  playerColor,
  onPlayAgain,
  onGoHome,
  isOpen,
  onClose,
  ratingChange = null,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const { icon, title, subtitle } = getResultInfo(status, winner, playerColor);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Permainan selesai">
      <div className="modal-content" style={{ textAlign: 'center', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
          className="modal-close-btn"
          aria-label="Tutup"
        >
          &times;
        </button>
        <span className="game-over-icon" role="img" aria-label={title}>
          {icon}
        </span>
        <h2 className="game-over-title" style={{ marginBottom: ratingChange !== null ? '0.5rem' : '1.5rem' }}>{title}</h2>
        
        {ratingChange !== null && (
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: ratingChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
            }}
          >
            {ratingChange >= 0 ? `+${ratingChange}` : ratingChange} Rating Elo
          </div>
        )}

        {subtitle && (
          <p
            style={{
              color: 'var(--color-text-secondary)',
              margin: '0.75rem 0 2rem',
              fontSize: '0.95rem',
            }}
          >
            {subtitle}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="btn-play-again"
            className="btn btn-primary btn-lg"
            onClick={onPlayAgain}
          >
            🔄 Main Lagi
          </button>
          <button
            id="btn-go-home"
            className="btn btn-secondary"
            onClick={onGoHome}
          >
            🏠 Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
