import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Difficulty } from '@/types/chess';
import { getStockfishEngine, destroyStockfishEngine } from '@/lib/stockfish';

interface UseStockfishProps {
  difficulty: Difficulty;
  enabled: boolean;
  elo?: number | null;
}

export function useStockfish({ difficulty, enabled, elo = null }: UseStockfishProps) {
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const engineRef = useRef(getStockfishEngine());

  useEffect(() => {
    if (!enabled) return;

    const engine = engineRef.current;
    engine.init()
      .then(() => setIsReady(true))
      .catch((err) => console.error('Stockfish init error:', err));

    return () => {
      destroyStockfishEngine();
    };
  }, [enabled]);

  const getBestMove = useCallback(
    (fen: string): Promise<string> => {
      return new Promise((resolve) => {
        setIsThinking(true);
        engineRef.current.findBestMove(fen, difficulty, (bestMove) => {
          setIsThinking(false);
          resolve(bestMove);
        }, elo);
      });
    },
    [difficulty, elo]
  );

  const startNewGame = useCallback(() => {
    engineRef.current.startNewGame();
  }, []);

  return { isReady, isThinking, getBestMove, startNewGame };
}
