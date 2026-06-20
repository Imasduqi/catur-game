import { useCallback, useEffect, useState } from 'react';
import { Chess, Move } from 'chess.js';
import {
  GameStatus,
  PieceColor,
  PromotionPiece,
} from '@/types/chess';

export interface ChessMove {
  from: string;
  to: string;
  promotion?: PromotionPiece;
}

interface UseChessGameReturn {
  chess: Chess;
  fen: string;
  turn: PieceColor;
  status: GameStatus;
  winner: PieceColor | 'draw' | null;
  lastMove: { from: string; to: string } | null;
  moveHistory: Move[];
  isInCheck: boolean;
  makeMove: (move: ChessMove) => Move | null;
  resetGame: () => void;
  loadFen: (fen: string) => void;
}

export function useChessGame(): UseChessGameReturn {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [isInCheck, setIsInCheck] = useState(false);

  const updateState = useCallback(() => {
    const currentFen = chess.fen();
    setFen(currentFen);
    setTurn(chess.turn() as PieceColor);
    setMoveHistory([...chess.history({ verbose: true }) as Move[]]);
    setIsInCheck(chess.inCheck());

    if (chess.isCheckmate()) {
      // Winner is the OPPOSITE of whose turn it is (they just moved)
      const loserTurn = chess.turn() as PieceColor;
      const winnerColor: PieceColor = loserTurn === 'w' ? 'b' : 'w';
      setStatus('checkmate');
      setWinner(winnerColor);
    } else if (chess.isDraw()) {
      setStatus('draw');
      setWinner('draw');
    } else if (chess.isStalemate()) {
      setStatus('stalemate');
      setWinner('draw');
    } else {
      setStatus('playing');
      setWinner(null);
    }
  }, [chess]);

  const makeMove = useCallback(
    (move: ChessMove): Move | null => {
      try {
        const result = chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion ?? 'q',
        });
        if (result) {
          setLastMove({ from: move.from, to: move.to });
          updateState();
          return result;
        }
      } catch {
        // illegal move
      }
      return null;
    },
    [chess, updateState]
  );

  const resetGame = useCallback(() => {
    chess.reset();
    setLastMove(null);
    setWinner(null);
    setStatus('playing');
    updateState();
  }, [chess, updateState]);

  const loadFen = useCallback(
    (newFen: string) => {
      try {
        chess.load(newFen);
        updateState();
      } catch {
        console.error('Invalid FEN:', newFen);
      }
    },
    [chess, updateState]
  );

  // Resign function exposed via status mutation (called externally)
  // We expose setStatus via a separate method below if needed.

  return {
    chess,
    fen,
    turn,
    status,
    winner,
    lastMove,
    moveHistory,
    isInCheck,
    makeMove,
    resetGame,
    loadFen,
  };
}
