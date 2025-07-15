// 中国象棋类型定义

export const PieceType = {
  KING: 'k',
  ADVISOR: 'a',
  ELEPHANT: 'e',
  HORSE: 'h',
  CHARIOT: 'r',
  CANNON: 'c',
  PAWN: 'p'
} as const;

export type PieceType = typeof PieceType[keyof typeof PieceType];

export const Player = {
  RED: 'red',
  BLACK: 'black'
} as const;

export type Player = typeof Player[keyof typeof Player];

export interface Position {
  x: number;
  y: number;
}

export interface ChessPiece {
  type: PieceType;
  player: Player;
  position: Position;
  id: string;
}

export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  captured?: ChessPiece;
}

export interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: Player;
  selectedPiece: ChessPiece | null;
  validMoves: Position[];
  gameOver: boolean;
  winner: Player | null;
  isInCheck: boolean;
  checkingPiece?: Position;
}