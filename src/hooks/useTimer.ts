import { useEffect, useRef, useState } from 'react';
import { PieceColor } from '@/types/chess';

interface UseTimerProps {
  initialSeconds: number;
  activeTurn: PieceColor;
  isRunning: boolean;
  onTimeout: (loser: PieceColor) => void;
  whiteTimeRemaining: number;
  blackTimeRemaining: number;
  turnStartedAt: number | null;
}

export function useTimer({
  initialSeconds,
  activeTurn,
  isRunning,
  onTimeout,
  whiteTimeRemaining,
  blackTimeRemaining,
  turnStartedAt,
}: UseTimerProps) {
  const [whiteTime, setWhiteTime] = useState(whiteTimeRemaining);
  const [blackTime, setBlackTime] = useState(blackTimeRemaining);

  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!isRunning) {
      setWhiteTime(whiteTimeRemaining);
      setBlackTime(blackTimeRemaining);
      return;
    }

    const updateTimes = () => {
      const now = Date.now();
      const elapsed = turnStartedAt ? Math.floor((now - turnStartedAt) / 1000) : 0;

      if (activeTurn === 'w') {
        const computedWhiteTime = Math.max(0, whiteTimeRemaining - elapsed);
        setWhiteTime(computedWhiteTime);
        setBlackTime(blackTimeRemaining);
        if (computedWhiteTime <= 0) {
          onTimeoutRef.current('w');
        }
      } else {
        const computedBlackTime = Math.max(0, blackTimeRemaining - elapsed);
        setBlackTime(computedBlackTime);
        setWhiteTime(whiteTimeRemaining);
        if (computedBlackTime <= 0) {
          onTimeoutRef.current('b');
        }
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 200);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, activeTurn, whiteTimeRemaining, blackTimeRemaining, turnStartedAt]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    whiteTime,
    blackTime,
    formatTime,
  };
}
