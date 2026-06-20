import { Difficulty, DIFFICULTY_DEPTH, DIFFICULTY_SKILL } from '@/types/chess';

type StockfishMessageHandler = (bestMove: string) => void;

class StockfishEngine {
  private worker: Worker | null = null;
  private onBestMove: StockfishMessageHandler | null = null;
  private isReady = false;
  private pendingFen: string | null = null;
  private pendingDifficulty: Difficulty | null = null;

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Stockfish hanya dapat berjalan di browser'));
        return;
      }

      this.worker = new Worker('/stockfish.js');

      this.worker.onmessage = (e: MessageEvent) => {
        const message: string = typeof e.data === 'string' ? e.data : '';

        if (message === 'readyok') {
          this.isReady = true;
          resolve();
          if (this.pendingFen && this.pendingDifficulty) {
            this.findBestMove(this.pendingFen, this.pendingDifficulty);
            this.pendingFen = null;
            this.pendingDifficulty = null;
          }
        }

        if (message.startsWith('bestmove')) {
          const parts = message.split(' ');
          const move = parts[1];
          if (move && move !== '(none)' && this.onBestMove) {
            this.onBestMove(move);
          }
        }
      };

      this.worker.onerror = (err) => {
        reject(err);
      };

      this.send('uci');
      this.send('isready');
    });
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  setDifficulty(difficulty: Difficulty) {
    const skillLevel = DIFFICULTY_SKILL[difficulty];
    this.send(`setoption name Skill Level value ${skillLevel}`);
    if (difficulty === 'mudah') {
      this.send('setoption name UCI_LimitStrength value true');
      this.send('setoption name UCI_Elo value 1320');
    } else if (difficulty === 'sedang') {
      this.send('setoption name UCI_LimitStrength value true');
      this.send('setoption name UCI_Elo value 1500');
    } else {
      this.send('setoption name UCI_LimitStrength value false');
    }
  }

  findBestMove(fen: string, difficulty: Difficulty, onBestMove?: StockfishMessageHandler) {
    if (onBestMove) {
      this.onBestMove = onBestMove;
    }

    if (!this.isReady) {
      this.pendingFen = fen;
      this.pendingDifficulty = difficulty;
      return;
    }

    this.setDifficulty(difficulty);
    const depth = DIFFICULTY_DEPTH[difficulty];
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
  }

  startNewGame() {
    if (!this.isReady) return;
    this.send('ucinewgame');
    this.send('isready');
  }

  stop() {
    this.send('stop');
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
}

// Singleton per browser session
let engineInstance: StockfishEngine | null = null;

export function getStockfishEngine(): StockfishEngine {
  if (!engineInstance) {
    engineInstance = new StockfishEngine();
  }
  return engineInstance;
}

export function destroyStockfishEngine() {
  engineInstance?.terminate();
  engineInstance = null;
}
