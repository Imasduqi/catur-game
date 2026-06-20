export type PieceColor = 'w' | 'b';
export type GameMode = 'vs-komputer' | 'vs-teman';
export type Difficulty = 'mudah' | 'sedang' | 'sulit';
export type GameStatus = 'waiting' | 'playing' | 'checkmate' | 'draw' | 'resigned' | 'stalemate';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export interface Player {
  color: PieceColor;
  name: string;
  timeRemaining?: number; // in seconds
}

export interface GameState {
  fen: string;
  turn: PieceColor;
  status: GameStatus;
  winner?: PieceColor | 'draw';
  lastMove?: { from: string; to: string };
  moveCount: number;
}

export interface RoomConfig {
  roomId: string;
  playerColor: PieceColor;
  timerSeconds?: number; // undefined = no timer
  opponentColor: PieceColor;
}

export interface RealtimeMove {
  from: string;
  to: string;
  promotion?: PromotionPiece;
  fen: string;
  moveCount: number;
  whiteTimeRemaining?: number;
  blackTimeRemaining?: number;
  turnStartedAt?: number;
}

export interface StockfishConfig {
  difficulty: Difficulty;
  playerColor: PieceColor;
}

// Depth settings per difficulty
export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  mudah: 2,
  sedang: 6,
  sulit: 18,
};

// Skill level per difficulty (UCI option)
export const DIFFICULTY_SKILL: Record<Difficulty, number> = {
  mudah: 0,
  sedang: 6,
  sulit: 20,
};
