'use client';

import { Difficulty } from '@/types/chess';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
}

const OPTIONS: { value: Difficulty; label: string; icon: string; desc: string }[] = [
  { value: 'mudah', label: 'Mudah', icon: '🌱', desc: 'ELO ~800' },
  { value: 'sedang', label: 'Sedang', icon: '⚔️', desc: 'Depth 8' },
  { value: 'sulit', label: 'Sulit', icon: '🔥', desc: 'Depth 18' },
];

export default function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
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
        Level Kesulitan
      </p>
      <div className="difficulty-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`difficulty-btn ${value === opt.value ? 'active' : ''}`}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            aria-pressed={value === opt.value}
            aria-label={`Level ${opt.label}`}
          >
            <span className="diff-icon">{opt.icon}</span>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</span>
            <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
