'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chess, Move, Square } from 'chess.js';
import { useRouter } from 'next/navigation';

const Chessboard = dynamic(
  () => import('react-chessboard').then((mod) => mod.Chessboard),
  { ssr: false }
);

import Navbar from '@/components/Navbar';
import DifficultySelector from '@/components/DifficultySelector';
import MoveHistory from '@/components/MoveHistory';
import PromotionModal from '@/components/PromotionModal';
import GameOverModal from '@/components/GameOverModal';
import { useStockfish } from '@/hooks/useStockfish';
import { Difficulty, GameStatus, PieceColor, PromotionPiece } from '@/types/chess';

type PendingPromotion = { from: Square; to: Square };

export default function VsKomputerPage() {
  const router = useRouter();

  // Game state
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moveHistory, setMoveHistory] = useState(chess.history({ verbose: true }));
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isInCheck, setIsInCheck] = useState(false);

  const [showGameOverModal, setShowGameOverModal] = useState(false);

  useEffect(() => {
    const isOver =
      status === 'checkmate' ||
      status === 'draw' ||
      status === 'stalemate' ||
      status === 'resigned';
    if (isOver) {
      setShowGameOverModal(true);
    } else {
      setShowGameOverModal(false);
    }
  }, [status]);

  // Settings
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('sedang');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // Promotion
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  // Stockfish
  const { isReady: sfReady, isThinking, getBestMove, startNewGame } = useStockfish({
    difficulty,
    enabled: true,
  });

  // Start new game in engine when ready
  useEffect(() => {
    if (sfReady) {
      startNewGame();
    }
  }, [sfReady, startNewGame]);

  const isPlayerTurn = chess.turn() === playerColor && status === 'playing';

  // Sync board orientation with player color
  useEffect(() => {
    setBoardOrientation(playerColor === 'w' ? 'white' : 'black');
  }, [playerColor]);

  const updateGameState = useCallback(() => {
    const currentFen = chess.fen();
    setFen(currentFen);
    setMoveHistory(chess.history({ verbose: true }) as Move[]);
    setIsInCheck(chess.inCheck());

    if (chess.isCheckmate()) {
      const loser = chess.turn() as PieceColor;
      const w = loser === 'w' ? 'b' : 'w';
      setStatus('checkmate');
      setWinner(w);
    } else if (chess.isDraw() || chess.isStalemate()) {
      setStatus(chess.isStalemate() ? 'stalemate' : 'draw');
      setWinner('draw');
    }
  }, [chess]);

  // Stockfish move
  const doStockfishMove = useCallback(
    async (currentFen: string) => {
      if (!sfReady) return;
      const bestMoveStr = await getBestMove(currentFen);
      if (!bestMoveStr || bestMoveStr === '(none)') return;

      const from = bestMoveStr.slice(0, 2) as Square;
      const to = bestMoveStr.slice(2, 4) as Square;
      const promotion = bestMoveStr[4] as PromotionPiece | undefined;

      try {
        chess.move({ from, to, promotion: promotion ?? 'q' });
        setLastMove({ from, to });
        updateGameState();
      } catch {
        // invalid engine move (shouldn't happen)
      }
    },
    [sfReady, getBestMove, chess, updateGameState]
  );

  // Watch for computer's turn
  useEffect(() => {
    if (status !== 'playing') return;
    const computerColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
    if (chess.turn() === computerColor) {
      doStockfishMove(chess.fen());
    }
  }, [fen, playerColor, status, chess, doStockfishMove]);

  console.log('VsKomputerPage render', { fen, playerColor, status, isPlayerTurn });

  // react-chessboard v5: onPieceDrop receives an object { piece, sourceSquare, targetSquare }
  const handlePieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
      console.log('handlePieceDrop triggered', { piece, sourceSquare, targetSquare, turn: chess.turn(), playerColor, status });
      if (!targetSquare) return false;
      if (status !== 'playing') return false;
      if (chess.turn() !== playerColor) return false;

      const src = sourceSquare as Square;
      const tgt = targetSquare as Square;

      // Check if this is a valid pawn promotion
      const moves = chess.moves({ square: src, verbose: true }) as Move[];
      const isPromotion = moves.some((m) => m.to === tgt && m.flags.includes('p'));

      if (isPromotion) {
        setPendingPromotion({ from: src, to: tgt });
        return false; // board will snap back; promotion modal handles the actual move
      }

      try {
        const result = chess.move({ from: src, to: tgt });
        if (result) {
          setLastMove({ from: src, to: tgt });
          updateGameState();
          return true;
        }
      } catch {
        // illegal move — board snaps back
      }
      return false;
    },
    [chess, playerColor, status, updateGameState]
  );

  // Tap/click support (for mobile and keyboard users)
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const handleSquareClick = useCallback(
    ({ square, piece }: { piece: any; square: string }) => {
      console.log('handleSquareClick triggered', { square, piece, turn: chess.turn(), playerColor, status });
      if (status !== 'playing') return;
      if (chess.turn() !== playerColor) return;

      const sq = square as Square;

      if (!selectedSquare) {
        // First click: select a piece belonging to the player
        const p = chess.get(sq);
        if (p && p.color === playerColor) {
          setSelectedSquare(sq);
        }
        return;
      }

      // Second click: attempt the move
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }

      const moves = chess.moves({ square: selectedSquare, verbose: true }) as Move[];
      const isPromotion = moves.some((m) => m.to === sq && m.flags.includes('p'));

      if (isPromotion) {
        setPendingPromotion({ from: selectedSquare, to: sq });
        setSelectedSquare(null);
        return;
      }

      try {
        const result = chess.move({ from: selectedSquare, to: sq });
        if (result) {
          setLastMove({ from: selectedSquare, to: sq });
          updateGameState();
          setSelectedSquare(null);
          return;
        }
      } catch {
        // illegal move
      }

      // Clicked on another own piece — re-select
      const newPiece = chess.get(sq);
      if (newPiece && newPiece.color === playerColor) {
        setSelectedSquare(sq);
      } else {
        setSelectedSquare(null);
      }
    },
    [chess, playerColor, status, selectedSquare, updateGameState]
  );

  const handlePromotionSelect = useCallback(
    (piece: PromotionPiece) => {
      if (!pendingPromotion) return;
      try {
        const result = chess.move({
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion: piece,
        });
        if (result) {
          setLastMove({ from: pendingPromotion.from, to: pendingPromotion.to });
          updateGameState();
        }
      } catch {
        // invalid
      }
      setPendingPromotion(null);
    },
    [pendingPromotion, chess, updateGameState]
  );

  const handleResign = useCallback(() => {
    if (status !== 'playing') return;
    setStatus('resigned');
    const computerColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
    setWinner(computerColor);
  }, [playerColor, status]);

  const handlePlayAgain = useCallback(() => {
    chess.reset();
    setFen(chess.fen());
    setMoveHistory([]);
    setStatus('playing');
    setWinner(null);
    setLastMove(null);
    setIsInCheck(false);
    setPendingPromotion(null);
    startNewGame();
  }, [chess, startNewGame]);

  const handleFlipBoard = () => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  };

  const handleColorChange = (color: PieceColor) => {
    setPlayerColor(color);
    chess.reset();
    setFen(chess.fen());
    setMoveHistory([]);
    setStatus('playing');
    setWinner(null);
    setLastMove(null);
    setIsInCheck(false);
    startNewGame();
  };

  // Square styles: highlight last move, check, and selected square
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'rgba(124, 106, 247, 0.35)' };
    squareStyles[lastMove.to] = { background: 'rgba(124, 106, 247, 0.5)' };
  }
  if (isInCheck) {
    const kingSquare = findKingSquare(chess, chess.turn() as PieceColor);
    if (kingSquare) {
      squareStyles[kingSquare] = { background: 'rgba(255, 92, 92, 0.65)' };
    }
  }
  if (selectedSquare) {
    squareStyles[selectedSquare] = { background: 'rgba(124, 106, 247, 0.7)' };
  }

  const computerColor: PieceColor = playerColor === 'w' ? 'b' : 'w';

  return (
    <>
      <Navbar title="vs Komputer" />

      <div className="game-layout">
        {/* Board area */}
        <div className="board-wrapper">
          {/* Opponent (Computer) info */}
          <div className={`player-info ${!isPlayerTurn && status === 'playing' ? 'active' : ''}`}>
            <div className={`player-avatar ${computerColor}`}>🤖</div>
            <span className="player-name">Komputer</span>
            {isThinking && (
              <div className="thinking-dots" aria-label="Komputer sedang berpikir">
                <span /><span /><span />
              </div>
            )}
            {!isThinking && (
              <span
                className={`badge ${computerColor === 'w' ? '' : 'badge-accent'}`}
                style={{
                  background: computerColor === 'w' ? 'rgba(240,240,240,0.12)' : undefined,
                  color: computerColor === 'w' ? '#ccc' : undefined,
                  border: computerColor === 'w' ? '1px solid rgba(255,255,255,0.1)' : undefined,
                }}
              >
                {computerColor === 'w' ? '♔ Putih' : '♚ Hitam'}
              </span>
            )}
          </div>

          {/* Status bar */}
          <div className={`status-bar ${isInCheck && status === 'playing' ? 'check' : ''}`}>
            {status === 'playing' && isInCheck && '⚠️ Skak! Raja dalam bahaya'}
            {status === 'playing' && !isInCheck && isPlayerTurn && '♟ Giliranmu'}
            {status === 'playing' && !isInCheck && !isPlayerTurn && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 Komputer berpikir...
              </span>
            )}
            {status !== 'playing' && '✓ Permainan selesai'}
          </div>

          {/* Chessboard — react-chessboard v5: all props inside options={{}} */}
          <div style={{ width: '100%', maxWidth: 'min(560px, calc(100vw - 2rem))' }}>
            <Chessboard
              options={{
                id: 'vs-komputer-board',
                position: fen,
                boardOrientation,
                onPieceDrop: handlePieceDrop,
                onSquareClick: handleSquareClick,
                squareStyles,
                boardStyle: {
                  borderRadius: '10px',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                },
                darkSquareStyle: { backgroundColor: '#a57c52' },
                lightSquareStyle: { backgroundColor: '#e8d5b0' },
                animationDurationInMs: 200,
                allowDragging: isPlayerTurn,
              }}
            />
          </div>

          {/* Player info */}
          <div className={`player-info ${isPlayerTurn ? 'active' : ''}`}>
            <div className={`player-avatar ${playerColor}`}>
              {playerColor === 'w' ? '♔' : '♚'}
            </div>
            <span className="player-name">Kamu</span>
            <span
              className="badge"
              style={{
                background: playerColor === 'w' ? 'rgba(240,240,240,0.12)' : 'var(--color-accent-glow)',
                color: playerColor === 'w' ? '#ccc' : 'var(--color-accent-primary)',
                border: playerColor === 'w' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124,106,247,0.3)',
              }}
            >
              {playerColor === 'w' ? '♔ Putih' : '♚ Hitam'}
            </span>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Difficulty */}
          <div className="card">
            <DifficultySelector
              value={difficulty}
              onChange={setDifficulty}
              disabled={status !== 'playing' || moveHistory.length > 0}
            />
          </div>

          {/* Color selector */}
          <div className="card">
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
              Main sebagai
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['w', 'b'] as PieceColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={`btn ${playerColor === c ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.85rem' }}
                  id={`btn-color-${c}`}
                >
                  {c === 'w' ? '♔ Putih' : '♚ Hitam'}
                </button>
              ))}
            </div>
          </div>

          {/* Move history */}
          <div className="card">
            <MoveHistory moves={moveHistory as any} />
          </div>

          {/* Game controls */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {status !== 'playing' && !showGameOverModal && (
              <button
                id="btn-show-results"
                className="btn btn-primary w-full"
                onClick={() => setShowGameOverModal(true)}
              >
                🏆 Lihat Hasil Game
              </button>
            )}
            <button
              id="btn-flip-board"
              className="btn btn-secondary w-full"
              onClick={handleFlipBoard}
            >
              🔄 Balik Papan
            </button>
            <button
              id="btn-new-game"
              className="btn btn-secondary w-full"
              onClick={handlePlayAgain}
            >
              ♻ Permainan Baru
            </button>
            {status === 'playing' && (
              <button
                id="btn-resign-komputer"
                className="btn btn-danger w-full"
                onClick={handleResign}
              >
                🏳 Menyerah
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Modals */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        color={playerColor}
        onSelect={handlePromotionSelect}
      />

      <GameOverModal
        status={status}
        winner={winner}
        playerColor={playerColor}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.push('/')}
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
      />
    </>
  );
}

// Helper: find king square
function findKingSquare(chess: Chess, color: PieceColor): string | null {
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (sq && sq.type === 'k' && sq.color === color) {
        const files = 'abcdefgh';
        return `${files[f]}${8 - r}`;
      }
    }
  }
  return null;
}
