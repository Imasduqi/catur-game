'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Chess, Square } from 'chess.js';

const Chessboard = dynamic(
  () => import('react-chessboard').then((mod) => mod.Chessboard),
  { ssr: false }
);

import Navbar from '@/components/Navbar';
import MoveHistory from '@/components/MoveHistory';
import PromotionModal from '@/components/PromotionModal';
import GameOverModal from '@/components/GameOverModal';
import { supabase } from '@/lib/supabase';
import { useTimer } from '@/hooks/useTimer';
import { GameStatus, PieceColor, PromotionPiece, RealtimeMove } from '@/types/chess';
import { useAuth } from '@/lib/auth-context';

type PendingPromotion = { from: Square; to: Square };

export default function RoomPage() {
  const { user, profile } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>('Lawan');
  const [opponentElo, setOpponentElo] = useState<number>(1200);
  const [ratingChange, setRatingChange] = useState<number | null>(null);

  const roomId = (params?.roomId as string) ?? '';
  const isHost = searchParams?.get('host') === '1';
  const colorParam = searchParams?.get('color') ?? 'random';
  const timerParam = parseInt(searchParams?.get('timer') ?? '0', 10);

  // Determine player color
  const [playerColor] = useState<PieceColor>(() => {
    if (typeof window !== 'undefined') {
      const savedColor = sessionStorage.getItem(`chess_color_${roomId}`);
      if (savedColor === 'w' || savedColor === 'b') return savedColor as PieceColor;
    }
    if (isHost) {
      const selected =
        colorParam === 'b'
          ? 'b'
          : colorParam === 'w'
          ? 'w'
          : Math.random() < 0.5
          ? 'w'
          : 'b';
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`chess_color_${roomId}`, selected);
      }
      return selected;
    }
    // Guest gets opposite of what host sends via channel
    return 'pending' as any;
  });

  const [myColor, setMyColor] = useState<PieceColor | null>(() => {
    if (typeof window !== 'undefined') {
      const savedColor = sessionStorage.getItem(`chess_color_${roomId}`);
      if (savedColor === 'w' || savedColor === 'b') return savedColor as PieceColor;
    }
    return isHost ? playerColor : null;
  });
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gameTimer, setGameTimer] = useState<number>(timerParam);

  const [whiteTimeRemaining, setWhiteTimeRemaining] = useState<number>(() => timerParam || 300);
  const [blackTimeRemaining, setBlackTimeRemaining] = useState<number>(() => timerParam || 300);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);

  // Connection & edge cases
  const [myClientId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const key = `chess_client_${roomId}`;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem(key, id);
    }
    return id;
  });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isRoomNotFound, setIsRoomNotFound] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isHostOnline, setIsHostOnline] = useState(isHost);

  // Game state
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moveHistory, setMoveHistory] = useState(chess.history({ verbose: true }));
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isInCheck, setIsInCheck] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const hasSavedGame = useRef(false);

  useEffect(() => {
    const isOver =
      status === 'checkmate' ||
      status === 'draw' ||
      status === 'stalemate' ||
      status === 'resigned';
    if (isOver) {
      setShowGameOverModal(true);

      // Save game history securely on server-side if logged in
      if (user && !hasSavedGame.current && myColor) {
        hasSavedGame.current = true;
        
        const modeParam = searchParams?.get('mode') ?? 'vs_teman';
        
        let resultVal: 'menang' | 'kalah' | 'seri' = 'seri';
        if (winner === 'draw' || status === 'stalemate' || status === 'draw') {
          resultVal = 'seri';
        } else if (winner === myColor) {
          resultVal = 'menang';
        } else {
          resultVal = 'kalah';
        }

        supabase.rpc('record_game', {
          p_mode: modeParam,
          p_result: resultVal,
          p_opponent_id: opponentId,
          p_opponent_name: opponentName === 'Lawan' ? (modeParam === 'main_publik' ? 'Tamu' : 'Lawan') : opponentName,
          p_opponent_elo_fallback: opponentElo || 1200
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error recording game:', error);
          } else if (data && data[0]) {
            const ratingChangeVal = data[0].calculated_rating_change;
            setRatingChange(ratingChangeVal);
          }
        });
      }
    } else {
      setShowGameOverModal(false);
    }
  }, [status, winner, myColor, opponentId, opponentName, opponentElo, user, searchParams]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep refs of moving states to avoid stale closures in Supabase broadcast handlers
  const myColorRef = useRef(myColor);
  useEffect(() => {
    myColorRef.current = myColor;
  }, [myColor]);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const gameTimerRef = useRef(gameTimer);
  useEffect(() => {
    gameTimerRef.current = gameTimer;
  }, [gameTimer]);

  const winnerRef = useRef(winner);
  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  const whiteTimeRemainingRef = useRef(whiteTimeRemaining);
  useEffect(() => {
    whiteTimeRemainingRef.current = whiteTimeRemaining;
  }, [whiteTimeRemaining]);

  const blackTimeRemainingRef = useRef(blackTimeRemaining);
  useEffect(() => {
    blackTimeRemainingRef.current = blackTimeRemaining;
  }, [blackTimeRemaining]);

  const turnStartedAtRef = useRef(turnStartedAt);
  useEffect(() => {
    turnStartedAtRef.current = turnStartedAt;
  }, [turnStartedAt]);

  // Timer
  const timerEnabled = gameTimer > 0;
  const { whiteTime, blackTime, formatTime } = useTimer({
    initialSeconds: gameTimer || 300,
    activeTurn: chess.turn() as PieceColor,
    isRunning: status === 'playing' && timerEnabled,
    onTimeout: (loser) => {
      setStatus('resigned');
      setWinner(loser === 'w' ? 'b' : 'w');
      if (myColorRef.current === loser) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'resign',
          payload: { color: myColorRef.current },
        });
      }
    },
    whiteTimeRemaining,
    blackTimeRemaining,
    turnStartedAt,
  });

  const updateGameState = useCallback(() => {
    const currentFen = chess.fen();
    setFen(currentFen);
    setMoveHistory([...chess.history({ verbose: true }) as any]);
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

  // Setup Supabase Realtime & Presence
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: isHost ? 'host' : 'guest' },
        broadcast: { self: false },
      },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'move' }, ({ payload }: { payload: RealtimeMove }) => {
        try {
          chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? 'q' });
          if (payload.whiteTimeRemaining !== undefined) {
            setWhiteTimeRemaining(payload.whiteTimeRemaining);
          }
          if (payload.blackTimeRemaining !== undefined) {
            setBlackTimeRemaining(payload.blackTimeRemaining);
          }
          if (payload.turnStartedAt !== undefined) {
            setTurnStartedAt(payload.turnStartedAt);
          }
          setLastMove({ from: payload.from, to: payload.to });
          updateGameState();
        } catch {
          // invalid move from network
        }
      })
      .on('broadcast', { event: 'color_assign' }, ({ payload }: { payload: { guestColor: PieceColor; timerParam?: number } }) => {
        if (!isHost) {
          setMyColor(payload.guestColor);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`chess_color_${roomId}`, payload.guestColor);
          }
          if (payload.timerParam !== undefined) {
            setGameTimer(payload.timerParam);
            setWhiteTimeRemaining(payload.timerParam);
            setBlackTimeRemaining(payload.timerParam);
          }
          setStatus('playing');
          setTurnStartedAt(Date.now());
        }
      })
      .on('broadcast', { event: 'opponent_joined' }, () => {
        setOpponentJoined(true);
        if (isHost && statusRef.current === 'waiting') {
          setStatus('playing');
          // Assign guest the opposite color of myColorRef.current
          const currentHostColor = myColorRef.current || 'w';
          const guestColor: PieceColor = (currentHostColor === 'w' ? 'b' : 'w') as PieceColor;
          channel.send({
            type: 'broadcast',
            event: 'color_assign',
            payload: { guestColor, timerParam: gameTimerRef.current },
          });
          setTurnStartedAt(Date.now());
        }
      })
      .on('broadcast', { event: 'resign' }, ({ payload }: { payload: { color: PieceColor } }) => {
        const resigner = payload.color;
        setStatus('resigned');
        setWinner(resigner === 'w' ? 'b' : 'w');
      })
      .on('broadcast', { event: 'sync_request' }, () => {
        if (
          statusRef.current === 'playing' ||
          statusRef.current === 'checkmate' ||
          statusRef.current === 'draw' ||
          statusRef.current === 'stalemate' ||
          statusRef.current === 'resigned'
        ) {
          channel.send({
            type: 'broadcast',
            event: 'game_sync',
            payload: {
              fen: chess.fen(),
              history: chess.history({ verbose: true }),
              status: statusRef.current,
              winner: winnerRef.current,
              whiteTimeRemaining: whiteTimeRemainingRef.current,
              blackTimeRemaining: blackTimeRemainingRef.current,
              turnStartedAt: turnStartedAtRef.current,
            },
          });
        }
      })
      .on('broadcast', { event: 'game_sync' }, ({ payload }: { payload: { 
        fen: string; 
        history: any[]; 
        status: GameStatus; 
        winner: PieceColor | 'draw' | null;
        whiteTimeRemaining?: number;
        blackTimeRemaining?: number;
        turnStartedAt?: number | null;
      } }) => {
        if (statusRef.current === 'waiting') {
          try {
            chess.load(payload.fen);
            setFen(payload.fen);
            setMoveHistory(payload.history as any);
            setStatus(payload.status);
            setWinner(payload.winner);
            if (payload.whiteTimeRemaining !== undefined) {
              setWhiteTimeRemaining(payload.whiteTimeRemaining);
            }
            if (payload.blackTimeRemaining !== undefined) {
              setBlackTimeRemaining(payload.blackTimeRemaining);
            }
            if (payload.turnStartedAt !== undefined) {
              setTurnStartedAt(payload.turnStartedAt);
            }
          } catch {
            // invalid FEN
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences = Object.values(state).flat() as any[];

        // Group presences by clientId and keep the earliest joinedAt for each unique client
        const uniqueClientsMap = new Map<string, any>();
        presences.forEach((p) => {
          const existing = uniqueClientsMap.get(p.clientId);
          if (!existing || p.joinedAt < existing.joinedAt) {
            uniqueClientsMap.set(p.clientId, p);
          }
        });
        const uniquePresences = Array.from(uniqueClientsMap.values());

        // 1. Check if room is full based on unique client IDs
        const sorted = [...uniquePresences].sort((a, b) => a.joinedAt - b.joinedAt);
        const myIndex = sorted.findIndex((p) => p.clientId === myClientId);
        if (myIndex !== -1 && myIndex >= 2) {
          setIsRoomFull(true);
          return;
        }

        // 2. Host online detection for guest
        const hostExists = uniquePresences.some((p) => p.role === 'host');
        if (!isHost) {
          setIsHostOnline(hostExists);
        }

        // 3. Opponent disconnect detection (playing only)
        const opponentRole = isHost ? 'guest' : 'host';
        if (statusRef.current === 'playing') {
          const isOpponentPresent = uniquePresences.some((p) => p.role === opponentRole);
          setOpponentDisconnected(!isOpponentPresent);
        }

        // Get opponent profile information from Presence
        const opponentPresence = uniquePresences.find((p) => p.role === opponentRole);
        if (opponentPresence) {
          if (opponentPresence.userId) setOpponentId(opponentPresence.userId);
          if (opponentPresence.username) setOpponentName(opponentPresence.username);
          if (opponentPresence.rating) setOpponentElo(opponentPresence.rating);
          setOpponentJoined(true);
        }
      })
      .subscribe(async (subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
          // Register presence with auth info
          await channel.track({
            clientId: myClientId,
            role: isHost ? 'host' : 'guest',
            joinedAt: Date.now(),
            userId: user?.id || null,
            username: profile?.username || 'Tamu',
            rating: profile?.rating_pvp || 1200,
          });

          if (!isHost) {
            // Guest announces presence
            channel.send({ type: 'broadcast', event: 'opponent_joined', payload: {} });
          }
          // Request game state sync from opponent (if they are in the room)
          channel.send({ type: 'broadcast', event: 'sync_request', payload: {} });
        } else if (subStatus === 'CLOSED' || subStatus === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, isHost, chess, updateGameState, myClientId, user, profile]);

  // Check if host is online for guest (invalid/expired room check)
  useEffect(() => {
    if (isHost || isRoomFull || !isRealtimeConnected) return;

    // Start a 4-second timeout to check if host connects
    const timer = setTimeout(() => {
      if (!isHostOnline) {
        setIsRoomNotFound(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isHost, isHostOnline, isRoomFull, isRealtimeConnected]);

  const broadcastMove = useCallback(
    (
      from: string,
      to: string,
      promotion?: PromotionPiece,
      whiteTimeRem?: number,
      blackTimeRem?: number,
      turnStart?: number
    ) => {
      const payload: RealtimeMove = {
        from,
        to,
        promotion,
        fen: chess.fen(),
        moveCount: chess.history().length,
        whiteTimeRemaining: whiteTimeRem,
        blackTimeRemaining: blackTimeRem,
        turnStartedAt: turnStart,
      };
      channelRef.current?.send({ type: 'broadcast', event: 'move', payload });
    },
    [chess]
  );

  const handleMoveTransition = useCallback(
    (from: string, to: string, promotion?: PromotionPiece) => {
      const now = Date.now();
      const elapsed = turnStartedAtRef.current ? Math.floor((now - turnStartedAtRef.current) / 1000) : 0;
      let newWhiteTime = whiteTimeRemainingRef.current;
      let newBlackTime = blackTimeRemainingRef.current;

      // chess.turn() has already changed to the next player's turn inside chess.move
      if (chess.turn() === 'b') {
        newWhiteTime = Math.max(0, whiteTimeRemainingRef.current - elapsed);
      } else {
        newBlackTime = Math.max(0, blackTimeRemainingRef.current - elapsed);
      }

      setWhiteTimeRemaining(newWhiteTime);
      setBlackTimeRemaining(newBlackTime);
      setTurnStartedAt(now);

      setLastMove({ from, to });
      updateGameState();
      broadcastMove(from, to, promotion, newWhiteTime, newBlackTime, now);
    },
    [chess, updateGameState, broadcastMove]
  );

  // react-chessboard v5: onPieceDrop receives an object
  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
      setSelectedSquare(null);
      if (!targetSquare) return false;
      if (status !== 'playing' || opponentDisconnected) return false;
      if (!myColor || chess.turn() !== myColor) return false;

      const src = sourceSquare as Square;
      const tgt = targetSquare as Square;

      const movingPiece = chess.get(src);
      const isPromotion =
        movingPiece?.type === 'p' &&
        ((movingPiece.color === 'w' && tgt[1] === '8') ||
          (movingPiece.color === 'b' && tgt[1] === '1'));

      if (isPromotion) {
        setPendingPromotion({ from: src, to: tgt });
        return false;
      }

      try {
        const result = chess.move({ from: src, to: tgt });
        if (result) {
          handleMoveTransition(src, tgt);
          return true;
        }
      } catch {
        // illegal
      }
      return false;
    },
    [chess, myColor, status, opponentDisconnected, handleMoveTransition]
  );

  // Tap/click support
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Valid move squares for the selected piece
  const validMoveSquares: Record<string, { isCapture: boolean }> = {};
  if (selectedSquare && status === 'playing' && myColor && chess.turn() === myColor) {
    const moves = chess.moves({ square: selectedSquare, verbose: true }) as any[];
    moves.forEach((m: any) => {
      validMoveSquares[m.to] = { isCapture: !!(m.flags.includes('c') || m.flags.includes('e')) };
    });
  }

  // Handle drag begin: select the dragged piece to show valid moves
  const handlePieceDrag = useCallback(
    ({ square }: { isSparePiece: boolean; piece: any; square: string | null }) => {
      if (!square) return;
      if (status !== 'playing' || opponentDisconnected) return;
      if (!myColor || chess.turn() !== myColor) return;
      const piece = chess.get(square as Square);
      if (piece && piece.color === myColor) {
        setSelectedSquare(square as Square);
      }
    },
    [chess, myColor, status, opponentDisconnected]
  );

  const handleSquareClick = useCallback(
    ({ square }: { piece: any; square: string }) => {
      if (status !== 'playing' || opponentDisconnected) return;
      if (!myColor || chess.turn() !== myColor) return;

      const sq = square as Square;

      if (!selectedSquare) {
        const p = chess.get(sq);
        if (p && p.color === myColor) setSelectedSquare(sq);
        return;
      }

      if (selectedSquare === sq) { setSelectedSquare(null); return; }

      const movingPiece = chess.get(selectedSquare);
      const isPromotion =
        movingPiece?.type === 'p' &&
        ((movingPiece.color === 'w' && sq[1] === '8') ||
          (movingPiece.color === 'b' && sq[1] === '1'));

      if (isPromotion) {
        setPendingPromotion({ from: selectedSquare, to: sq });
        setSelectedSquare(null);
        return;
      }

      try {
        const result = chess.move({ from: selectedSquare, to: sq });
        if (result) {
          handleMoveTransition(selectedSquare, sq);
          setSelectedSquare(null);
          return;
        }
      } catch { /* illegal */ }

      const newPiece = chess.get(sq);
      if (newPiece && newPiece.color === myColor) setSelectedSquare(sq);
      else setSelectedSquare(null);
    },
    [chess, myColor, status, opponentDisconnected, selectedSquare, handleMoveTransition]
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
          handleMoveTransition(pendingPromotion.from, pendingPromotion.to, piece);
        }
      } catch {
        // invalid
      }
      setPendingPromotion(null);
    },
    [pendingPromotion, chess, handleMoveTransition]
  );

  const handleResign = useCallback(() => {
    if (status !== 'playing' || !myColor) return;
    setStatus('resigned');
    setWinner(myColor === 'w' ? 'b' : 'w');
    channelRef.current?.send({
      type: 'broadcast',
      event: 'resign',
      payload: { color: myColor },
    });
  }, [myColor, status]);

  const buildRoomUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (gameTimer > 0) {
      params.set('timer', String(gameTimer));
    }
    const queryString = params.toString();
    return `${window.location.origin}/vs-teman/${roomId}${queryString ? '?' + queryString : ''}`;
  }, [roomId, gameTimer]);

  const handleCopyLink = () => {
    const url = buildRoomUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'rgba(124, 106, 247, 0.35)' };
    squareStyles[lastMove.to] = { background: 'rgba(124, 106, 247, 0.5)' };
  }
  if (isInCheck) {
    const board = chess.board();
    const turn = chess.turn() as PieceColor;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = board[r][f];
        if (sq && sq.type === 'k' && sq.color === turn) {
          const files = 'abcdefgh';
          squareStyles[`${files[f]}${8 - r}`] = { background: 'rgba(255, 92, 92, 0.65)' };
        }
      }
    }
  }
  if (selectedSquare) {
    squareStyles[selectedSquare] = { background: 'rgba(124, 106, 247, 0.7)' };
  }
  // Valid move target highlights
  Object.entries(validMoveSquares).forEach(([sq, { isCapture }]) => {
    if (isCapture) {
      squareStyles[sq] = {
        ...squareStyles[sq],
        boxSizing: 'border-box',
        border: '4px solid rgba(220, 80, 80, 0.85)',
        borderRadius: '2px',
        background: squareStyles[sq]?.background
          ? squareStyles[sq].background
          : 'radial-gradient(circle, rgba(220,80,80,0.18) 0%, transparent 80%)',
      } as React.CSSProperties;
    } else {
      squareStyles[sq] = {
        ...squareStyles[sq],
        background: squareStyles[sq]?.background
          ? `radial-gradient(circle, rgba(124,106,247,0.55) 22%, transparent 23%), ${squareStyles[sq].background}`
          : 'radial-gradient(circle, rgba(124,106,247,0.55) 22%, transparent 23%)',
      } as React.CSSProperties;
    }
  });

  const isMyTurn = myColor && chess.turn() === myColor && status === 'playing';
  const opponentColor: PieceColor | null = myColor ? (myColor === 'w' ? 'b' : 'w') : null;
  const boardOrientation = myColor === 'b' ? 'black' : 'white';
  const roomUrl = typeof window !== 'undefined' ? buildRoomUrl() : '';

  return (
    <>
      <Navbar title={`Room ${roomId}`} />

      {/* Room Full state */}
      {isRoomFull && (
        <div className="waiting-animation" style={{ minHeight: 'calc(100vh - 64px)', justifyContent: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🚫</span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '1rem' }}>Room Sudah Penuh</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '360px', textAlign: 'center', marginBottom: '2rem' }}>
            Room ini sudah berisi 2 pemain. Anda tidak dapat bergabung sebagai pemain ketiga.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/vs-teman')}>
            🏠 Kembali
          </button>
        </div>
      )}

      {/* Room Not Found / Expired state */}
      {isRoomNotFound && !isRoomFull && (
        <div className="waiting-animation" style={{ minHeight: 'calc(100vh - 64px)', justifyContent: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '1rem' }}>Room Tidak Ditemukan</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '360px', textAlign: 'center', marginBottom: '2rem' }}>
            Room ID tidak valid, telah kedaluwarsa, atau pembuat room telah menutup permainan.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/vs-teman')}>
            🏠 Kembali
          </button>
        </div>
      )}

      {/* Realtime connecting state */}
      {!isRealtimeConnected && !isRoomFull && !isRoomNotFound && (
        <div className="waiting-animation" style={{ minHeight: 'calc(100vh - 64px)', justifyContent: 'center' }}>
          <div className="waiting-spinner" />
          <h2 style={{ fontSize: '1.4rem', marginTop: '1rem' }}>Menghubungkan...</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Menghubungkan ke server catur realtime Supabase.
          </p>
        </div>
      )}

      {/* Waiting state */}
      {isRealtimeConnected && !isRoomFull && !isRoomNotFound && status === 'waiting' && (
        <div className="waiting-animation" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="waiting-spinner" />
          <h2 style={{ fontSize: '1.4rem' }}>Menunggu lawan...</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Bagikan link berikut ke temanmu:
          </p>
          <div className="copy-field" style={{ width: '100%', maxWidth: '420px' }}>
            <input
              readOnly
              className="input"
              value={roomUrl}
              id="room-url-input"
              aria-label="Link room"
            />
            <button id="btn-copy-link" className="btn btn-primary" onClick={handleCopyLink}>
              {copied ? '✓ Disalin' : '📋 Salin'}
            </button>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            ID Room: <strong style={{ fontFamily: 'Outfit, monospace', letterSpacing: '0.1em', color: 'var(--color-accent-primary)' }}>{roomId}</strong>
          </p>

          {isHost && (
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                maxWidth: '420px',
                padding: '1.25rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Warna Kamu: <strong style={{ color: 'var(--color-text-primary)' }}>{myColor === 'w' ? '♔ Putih' : '♚ Hitam'}</strong>
              </p>
              <button
                id="btn-swap-color"
                className="btn btn-secondary"
                onClick={() => {
                  setMyColor((prev) => {
                    const next = prev === 'w' ? 'b' : 'w';
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem(`chess_color_${roomId}`, next);
                    }
                    return next;
                  });
                }}
                style={{
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontWeight: 600,
                }}
              >
                🔄 Tukar Warna
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game active */}
      {isRealtimeConnected && !isRoomFull && !isRoomNotFound && status !== 'waiting' && (
        <div className="game-layout">
          <div className="board-wrapper">
            {/* Opponent */}
            <div className={`player-info ${!isMyTurn && status === 'playing' && !opponentDisconnected ? 'active' : ''}`}>
              <div className={`player-avatar ${opponentColor ?? 'w'}`}>
                {opponentColor === 'w' ? '♔' : '♚'}
              </div>
              <span className="player-name">Lawan {opponentDisconnected && '(Terputus)'}</span>
              {timerEnabled && opponentColor && (
                <span className={`timer ${!isMyTurn && status === 'playing' && !opponentDisconnected ? 'active' : ''} ${
                  (opponentColor === 'w' ? whiteTime : blackTime) < 30 ? 'critical' : ''
                }`}>
                  {formatTime(opponentColor === 'w' ? whiteTime : blackTime)}
                </span>
              )}
            </div>

            {/* Status */}
            <div className={`status-bar ${opponentDisconnected ? 'disconnected' : isInCheck && status === 'playing' ? 'check' : ''}`}>
              {opponentDisconnected && '⚠️ Lawan terputus! Menunggu koneksi kembali...'}
              {!opponentDisconnected && status === 'playing' && isInCheck && '⚠️ Skak!'}
              {!opponentDisconnected && status === 'playing' && !isInCheck && isMyTurn && '♟ Giliranmu'}
              {!opponentDisconnected && status === 'playing' && !isInCheck && !isMyTurn && '⏳ Menunggu langkah lawan...'}
              {status !== 'playing' && '✓ Permainan selesai'}
            </div>

            {/* Board — react-chessboard v5: all props inside options={{}} */}
            <div style={{ width: '100%', maxWidth: 'min(560px, calc(100vw - 2rem))' }}>
              <Chessboard
                options={{
                  id: 'vs-teman-board',
                  position: fen,
                  boardOrientation,
                  onPieceDrop: handlePieceDrop,
                  onPieceDrag: handlePieceDrag,
                  onSquareClick: handleSquareClick,
                  squareStyles,
                  boardStyle: {
                    borderRadius: '10px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  },
                  darkSquareStyle: { backgroundColor: '#a57c52' },
                  lightSquareStyle: { backgroundColor: '#e8d5b0' },
                  animationDurationInMs: 200,
                  allowDragging: !!isMyTurn && !opponentDisconnected,
                }}
              />
            </div>

            {/* My info */}
            <div className={`player-info ${isMyTurn && !opponentDisconnected ? 'active' : ''}`}>
              <div className={`player-avatar ${myColor ?? 'w'}`}>
                {myColor === 'w' ? '♔' : '♚'}
              </div>
              <span className="player-name">Kamu</span>
              {timerEnabled && myColor && (
                <span className={`timer ${isMyTurn && !opponentDisconnected ? 'active' : ''} ${
                  (myColor === 'w' ? whiteTime : blackTime) < 30 ? 'critical' : ''
                }`}>
                  {formatTime(myColor === 'w' ? whiteTime : blackTime)}
                </span>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Room info */}
            <div className="card">
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.5rem' }}>
                Room
              </p>
              <div className="copy-field">
                <input readOnly className="input" value={roomUrl} id="room-url-sidebar" />
                <button id="btn-copy-link-sidebar" className="btn btn-secondary" onClick={handleCopyLink} style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Move history */}
            <div className="card">
              <MoveHistory moves={moveHistory as any} />
            </div>

            {/* Controls */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {status === 'playing' && (
                <button id="btn-resign-teman" className="btn btn-danger w-full" onClick={handleResign} disabled={opponentDisconnected}>
                  🏳 Menyerah
                </button>
              )}
              {status !== 'playing' && !showGameOverModal && (
                <button
                  id="btn-show-results"
                  className="btn btn-primary w-full"
                  onClick={() => setShowGameOverModal(true)}
                >
                  🏆 Lihat Hasil Game
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Modals */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        color={myColor ?? 'w'}
        onSelect={handlePromotionSelect}
      />

      <GameOverModal
        status={status}
        winner={winner}
        playerColor={myColor ?? undefined}
        onPlayAgain={() => router.push('/vs-teman')}
        onGoHome={() => router.push('/')}
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        ratingChange={ratingChange}
      />
    </>
  );
}
