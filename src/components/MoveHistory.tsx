'use client';

import { Move } from 'chess.js';

interface MoveHistoryProps {
  moves: Move[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const pairs: [Move, Move | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
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
        Riwayat Langkah
      </p>
      <div className="move-history" id="move-history-list">
        {pairs.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.82rem',
              padding: '1rem',
            }}
          >
            Belum ada langkah
          </p>
        )}
        {pairs.map(([white, black], idx) => (
          <div key={idx} className="move-row">
            <span className="move-number">{idx + 1}.</span>
            <span
              className={`move-san ${
                idx === pairs.length - 1 && !black ? 'last' : ''
              }`}
            >
              {white.san}
            </span>
            <span
              className={`move-san ${
                idx === pairs.length - 1 && black ? 'last' : ''
              }`}
            >
              {black?.san ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
