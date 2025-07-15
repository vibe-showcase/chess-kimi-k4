import type { Player, Position } from '../types/chess';

export interface MoveRecord {
  pieceType: string;
  from: Position;
  to: Position;
  player: string;
  captured?: string;
  timestamp: number;
  moveNumber: number;
}

export interface GameStats {
  totalMoves: number;
  redMoves: number;
  blackMoves: number;
  captures: {
    red: number;
    black: number;
  };
  gameDuration: number;
  startTime: number;
  endTime?: number;
  moveHistory: MoveRecord[];
}

export class GameStatsService {
  private stats: GameStats = {
    totalMoves: 0,
    redMoves: 0,
    blackMoves: 0,
    captures: {
      red: 0,
      black: 0
    },
    gameDuration: 0,
    moveHistory: [],
    startTime: Date.now()
  };

  constructor() {
    this.reset();
  }

  reset() {
    this.stats = {
      totalMoves: 0,
      redMoves: 0,
      blackMoves: 0,
      captures: {
        red: 0,
        black: 0
      },
      gameDuration: 0,
      startTime: Date.now(),
      moveHistory: []
    };
  }

  recordMove(pieceType: string, from: Position, to: Position, player: Player, captured?: string) {
    this.stats.totalMoves++;
    
    if (player === 'red') {
      this.stats.redMoves++;
    } else {
      this.stats.blackMoves++;
    }

    if (captured) {
      if (player === 'red') {
        this.stats.captures.red++;
      } else {
        this.stats.captures.black++;
      }
    }

    const move: MoveRecord = {
      pieceType,
      from,
      to,
      player,
      captured,
      timestamp: Date.now(),
      moveNumber: this.stats.totalMoves
    };

    this.stats.moveHistory.push(move);
  }

  endGame() {
    this.stats.endTime = Date.now();
    this.stats.gameDuration = this.stats.endTime - this.stats.startTime;
  }

  undoLastMove(): void {
    if (this.stats.moveHistory.length === 0) return;

    const lastMove = this.stats.moveHistory.pop();
    if (!lastMove) return;

    // 撤销统计
    this.stats.totalMoves--;
    
    if (lastMove.player === 'red') {
      this.stats.redMoves--;
    } else {
      this.stats.blackMoves--;
    }

    // 如果有吃子，恢复被吃的棋子计数（应该是恢复对手的计数）
    if (lastMove.captured) {
      const opponent = lastMove.player === 'red' ? 'black' : 'red';
      if (opponent === 'red') {
        this.stats.captures.red--;
      } else {
        this.stats.captures.black--;
      }
    }
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getCurrentDuration(): number {
    return Date.now() - this.stats.startTime;
  }

  getMoveHistory(): MoveRecord[] {
    return [...this.stats.moveHistory];
  }

  getLastMove(): MoveRecord | undefined {
    return this.stats.moveHistory[this.stats.moveHistory.length - 1];
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }
}