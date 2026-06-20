'use client';

import { PromotionPiece } from '@/types/chess';

interface PromotionModalProps {
  isOpen: boolean;
  color: 'w' | 'b';
  onSelect: (piece: PromotionPiece) => void;
}

const PIECES: { piece: PromotionPiece; labelW: string; labelB: string }[] = [
  { piece: 'q', labelW: '♕', labelB: '♛' },
  { piece: 'r', labelW: '♖', labelB: '♜' },
  { piece: 'b', labelW: '♗', labelB: '♝' },
  { piece: 'n', labelW: '♘', labelB: '♞' },
];

const PIECE_NAMES: Record<PromotionPiece, string> = {
  q: 'Ratu',
  r: 'Benteng',
  b: 'Gajah',
  n: 'Kuda',
};

export default function PromotionModal({ isOpen, color, onSelect }: PromotionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Pilih promosi pion">
      <div className="modal-content" style={{ maxWidth: '360px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
          ♟ Promosi Pion
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Pilih bidak untuk pion yang mencapai baris akhir:
        </p>

        <div className="promotion-grid">
          {PIECES.map(({ piece, labelW, labelB }) => (
            <button
              key={piece}
              className="promotion-piece"
              onClick={() => onSelect(piece)}
              title={PIECE_NAMES[piece]}
              aria-label={`Promosi menjadi ${PIECE_NAMES[piece]}`}
            >
              <span>{color === 'w' ? labelW : labelB}</span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {PIECE_NAMES[piece]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
