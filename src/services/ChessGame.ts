import type { ChessPiece, Position, GameState } from '../types/chess';
import { PieceType, Player } from '../types/chess';
import { GameStatsService } from './GameStats';

export class ChessGame {
  private gameState: GameState;
  private statsService: GameStatsService;
  private moveHistory: GameState[];

  constructor() {
    this.gameState = {
      board: this.initializeBoard(),
      currentPlayer: Player.RED,
      selectedPiece: null,
      validMoves: [],
      gameOver: false,
      winner: null,
      isInCheck: false,
      checkingPiece: undefined
    };
    this.statsService = new GameStatsService();
    this.moveHistory = [];
  }

  private initializeBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(10).fill(null).map(() => Array(9).fill(null));

    // 红方（下方）
    this.setupRedPieces(board);
    // 黑方（上方）
    this.setupBlackPieces(board);

    return board;
  }

  private setupRedPieces(board: (ChessPiece | null)[][]): void {
    const player = Player.RED;
    
    // 车
    board[9][0] = { type: PieceType.CHARIOT, player, position: { x: 0, y: 9 }, id: 'red-chariot-1' };
    board[9][8] = { type: PieceType.CHARIOT, player, position: { x: 8, y: 9 }, id: 'red-chariot-2' };
    
    // 马
    board[9][1] = { type: PieceType.HORSE, player, position: { x: 1, y: 9 }, id: 'red-horse-1' };
    board[9][7] = { type: PieceType.HORSE, player, position: { x: 7, y: 9 }, id: 'red-horse-2' };
    
    // 象
    board[9][2] = { type: PieceType.ELEPHANT, player, position: { x: 2, y: 9 }, id: 'red-elephant-1' };
    board[9][6] = { type: PieceType.ELEPHANT, player, position: { x: 6, y: 9 }, id: 'red-elephant-2' };
    
    // 士
    board[9][3] = { type: PieceType.ADVISOR, player, position: { x: 3, y: 9 }, id: 'red-advisor-1' };
    board[9][5] = { type: PieceType.ADVISOR, player, position: { x: 5, y: 9 }, id: 'red-advisor-2' };
    
    // 将
    board[9][4] = { type: PieceType.KING, player, position: { x: 4, y: 9 }, id: 'red-king' };
    
    // 炮
    board[7][1] = { type: PieceType.CANNON, player, position: { x: 1, y: 7 }, id: 'red-cannon-1' };
    board[7][7] = { type: PieceType.CANNON, player, position: { x: 7, y: 7 }, id: 'red-cannon-2' };
    
    // 兵
    for (let i = 0; i < 5; i++) {
      board[6][i * 2] = { type: PieceType.PAWN, player, position: { x: i * 2, y: 6 }, id: `red-pawn-${i + 1}` };
    }
  }

  private setupBlackPieces(board: (ChessPiece | null)[][]): void {
    const player = Player.BLACK;
    
    // 车
    board[0][0] = { type: PieceType.CHARIOT, player, position: { x: 0, y: 0 }, id: 'black-chariot-1' };
    board[0][8] = { type: PieceType.CHARIOT, player, position: { x: 8, y: 0 }, id: 'black-chariot-2' };
    
    // 马
    board[0][1] = { type: PieceType.HORSE, player, position: { x: 1, y: 0 }, id: 'black-horse-1' };
    board[0][7] = { type: PieceType.HORSE, player, position: { x: 7, y: 0 }, id: 'black-horse-2' };
    
    // 象
    board[0][2] = { type: PieceType.ELEPHANT, player, position: { x: 2, y: 0 }, id: 'black-elephant-1' };
    board[0][6] = { type: PieceType.ELEPHANT, player, position: { x: 6, y: 0 }, id: 'black-elephant-2' };
    
    // 士
    board[0][3] = { type: PieceType.ADVISOR, player, position: { x: 3, y: 0 }, id: 'black-advisor-1' };
    board[0][5] = { type: PieceType.ADVISOR, player, position: { x: 5, y: 0 }, id: 'black-advisor-2' };
    
    // 将
    board[0][4] = { type: PieceType.KING, player, position: { x: 4, y: 0 }, id: 'black-king' };
    
    // 炮
    board[2][1] = { type: PieceType.CANNON, player, position: { x: 1, y: 2 }, id: 'black-cannon-1' };
    board[2][7] = { type: PieceType.CANNON, player, position: { x: 7, y: 2 }, id: 'black-cannon-2' };
    
    // 卒
    for (let i = 0; i < 5; i++) {
      board[3][i * 2] = { type: PieceType.PAWN, player, position: { x: i * 2, y: 3 }, id: `black-pawn-${i + 1}` };
    }
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  selectPiece(position: Position): boolean {
    const piece = this.gameState.board[position.y][position.x];
    
    if (!piece || piece.player !== this.gameState.currentPlayer) {
      return false;
    }

    this.gameState.selectedPiece = piece;
    this.gameState.validMoves = this.getValidMoves(piece);
    
    return true;
  }

  movePiece(to: Position): boolean {
    if (!this.gameState.selectedPiece) return false;
    
    const validMove = this.gameState.validMoves.find(
      move => move.x === to.x && move.y === to.y
    );
    
    if (!validMove) return false;

    // 保存当前状态到历史记录
    this.moveHistory.push(this.deepCloneGameState());

    const from = this.gameState.selectedPiece.position;
    const targetPiece = this.gameState.board[to.y][to.x];

    // 记录移动
    this.statsService.recordMove(
      this.gameState.selectedPiece.type,
      from,
      to,
      this.gameState.selectedPiece.player,
      targetPiece?.type
    );

    // 执行移动
    this.gameState.board[to.y][to.x] = this.gameState.selectedPiece;
    this.gameState.board[from.y][from.x] = null;
    
    this.gameState.selectedPiece.position = to;
    
    // 切换玩家
    this.gameState.currentPlayer = this.gameState.currentPlayer === Player.RED ? Player.BLACK : Player.RED;
    this.gameState.selectedPiece = null;
    this.gameState.validMoves = [];

    // 检查将军
    this.checkCheck();
    
    // 检查游戏结束
    this.checkGameOver();

    if (this.gameState.gameOver) {
      this.statsService.endGame();
    }

    return true;
  }

  private getValidMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    
    switch (piece.type) {
      case PieceType.KING:
        return this.getKingMoves(piece);
      case PieceType.ADVISOR:
        return this.getAdvisorMoves(piece);
      case PieceType.ELEPHANT:
        return this.getElephantMoves(piece);
      case PieceType.HORSE:
        return this.getHorseMoves(piece);
      case PieceType.CHARIOT:
        return this.getChariotMoves(piece);
      case PieceType.CANNON:
        return this.getCannonMoves(piece);
      case PieceType.PAWN:
        return this.getPawnMoves(piece);
    }
    
    return moves;
  }

  private getKingMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    const palaceBounds = piece.player === Player.RED 
      ? { minX: 3, maxX: 5, minY: 7, maxY: 9 }
      : { minX: 3, maxX: 5, minY: 0, maxY: 2 };

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= palaceBounds.minX && newX <= palaceBounds.maxX &&
          newY >= palaceBounds.minY && newY <= palaceBounds.maxY) {
        if (this.isValidMove(piece, newX, newY)) {
          moves.push({ x: newX, y: newY });
        }
      }
    }
    
    return moves;
  }

  private getAdvisorMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    const palaceBounds = piece.player === Player.RED 
      ? { minX: 3, maxX: 5, minY: 7, maxY: 9 }
      : { minX: 3, maxX: 5, minY: 0, maxY: 2 };

    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= palaceBounds.minX && newX <= palaceBounds.maxX &&
          newY >= palaceBounds.minY && newY <= palaceBounds.maxY) {
        if (this.isValidMove(piece, newX, newY)) {
          moves.push({ x: newX, y: newY });
        }
      }
    }
    
    return moves;
  }

  private getElephantMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    const directions = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      // 象不能过河
      if (piece.player === Player.RED && newY < 5) continue;
      if (piece.player === Player.BLACK && newY > 4) continue;
      
      // 检查象眼
      const blockX = x + dx / 2;
      const blockY = y + dy / 2;
      
      // 检查边界
      if (blockX < 0 || blockX >= 9 || blockY < 0 || blockY >= 10) continue;
      if (newX < 0 || newX >= 9 || newY < 0 || newY >= 10) continue;
      
      if (this.gameState.board[blockY][blockX] === null && 
          this.isValidMove(piece, newX, newY)) {
        moves.push({ x: newX, y: newY });
      }
    }
    
    return moves;
  }

  private getHorseMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    const directions = [
      [1, 2], [2, 1], [2, -1], [1, -2],
      [-1, -2], [-2, -1], [-2, 1], [-1, 2]
    ];
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      // 检查马腿
      const legX = x + (Math.abs(dx) === 2 ? dx / 2 : 0);
      const legY = y + (Math.abs(dy) === 2 ? dy / 2 : 0);
      
      // 检查边界
      if (legX < 0 || legX >= 9 || legY < 0 || legY >= 10) continue;
      if (newX < 0 || newX >= 9 || newY < 0 || newY >= 10) continue;
      
      if (this.gameState.board[legY][legX] === null && 
          this.isValidMove(piece, newX, newY)) {
        moves.push({ x: newX, y: newY });
      }
    }
    
    return moves;
  }

  private getChariotMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    
    // 水平移动
    for (let newX = 0; newX < 9; newX++) {
      if (newX !== x) {
        if (this.isPathClear(x, y, newX, y) && this.isValidMove(piece, newX, y)) {
          moves.push({ x: newX, y });
        }
      }
    }
    
    // 垂直移动
    for (let newY = 0; newY < 10; newY++) {
      if (newY !== y) {
        if (this.isPathClear(x, y, x, newY) && this.isValidMove(piece, x, newY)) {
          moves.push({ x, y: newY });
        }
      }
    }
    
    return moves;
  }

  private getCannonMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    
    // 水平移动
    for (let newX = 0; newX < 9; newX++) {
      if (newX !== x) {
        if (this.isValidCannonMove(x, y, newX, y)) {
          moves.push({ x: newX, y });
        }
      }
    }
    
    // 垂直移动
    for (let newY = 0; newY < 10; newY++) {
      if (newY !== y) {
        if (this.isValidCannonMove(x, y, x, newY)) {
          moves.push({ x, y: newY });
        }
      }
    }
    
    return moves;
  }

  private getPawnMoves(piece: ChessPiece): Position[] {
    const moves: Position[] = [];
    const { x, y } = piece.position;
    
    const direction = piece.player === Player.RED ? -1 : 1;
    
    // 向前移动
    const newY = y + direction;
    if (newY >= 0 && newY < 10 && this.isValidMove(piece, x, newY)) {
      moves.push({ x, y: newY });
    }
    
    // 过河后可以左右移动
    const crossedRiver = piece.player === Player.RED ? y <= 4 : y >= 5;
    if (crossedRiver) {
      if (x > 0 && this.isValidMove(piece, x - 1, y)) {
        moves.push({ x: x - 1, y });
      }
      if (x < 8 && this.isValidMove(piece, x + 1, y)) {
        moves.push({ x: x + 1, y });
      }
    }
    
    return moves;
  }

  private isValidMove(piece: ChessPiece, newX: number, newY: number): boolean {
    if (newX < 0 || newX >= 9 || newY < 0 || newY >= 10) return false;
    
    const targetPiece = this.gameState.board[newY][newX];
    return !targetPiece || targetPiece.player !== piece.player;
  }

  private isPathClear(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (fromX === toX) {
      const minY = Math.min(fromY, toY);
      const maxY = Math.max(fromY, toY);
      for (let y = minY + 1; y < maxY; y++) {
        if (this.gameState.board[y][fromX] !== null) return false;
      }
    } else if (fromY === toY) {
      const minX = Math.min(fromX, toX);
      const maxX = Math.max(fromX, toX);
      for (let x = minX + 1; x < maxX; x++) {
        if (this.gameState.board[fromY][x] !== null) return false;
      }
    }
    return true;
  }

  private isValidCannonMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const targetPiece = this.gameState.board[toY][toX];
    
    if (fromX === toX) {
      const minY = Math.min(fromY, toY);
      const maxY = Math.max(fromY, toY);
      let piecesBetween = 0;
      
      for (let y = minY + 1; y < maxY; y++) {
        if (this.gameState.board[y][fromX] !== null) piecesBetween++;
      }
      
      if (targetPiece === null) {
        return piecesBetween === 0;
      } else {
        return piecesBetween === 1;
      }
    } else if (fromY === toY) {
      const minX = Math.min(fromX, toX);
      const maxX = Math.max(fromX, toX);
      let piecesBetween = 0;
      
      for (let x = minX + 1; x < maxX; x++) {
        if (this.gameState.board[fromY][x] !== null) piecesBetween++;
      }
      
      if (targetPiece === null) {
        return piecesBetween === 0;
      } else {
        return piecesBetween === 1;
      }
    }
    
    return false;
  }

  private checkCheck(): void {
    const currentPlayer = this.gameState.currentPlayer;
    const king = this.findKing(currentPlayer);
    
    if (!king) return;

    this.gameState.isInCheck = false;
    this.gameState.checkingPiece = undefined;

    // 检查对方所有棋子是否能攻击到将/帅
    const opponent = currentPlayer === Player.RED ? Player.BLACK : Player.RED;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.gameState.board[y][x];
        if (piece && piece.player === opponent) {
          const moves = this.getValidMoves(piece);
          if (moves.some(move => move.x === king.position.x && move.y === king.position.y)) {
            this.gameState.isInCheck = true;
            this.gameState.checkingPiece = { x, y };
            break;
          }
        }
      }
    }
  }

  private findKing(player: Player): ChessPiece | null {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.gameState.board[y][x];
        if (piece && piece.type === PieceType.KING && piece.player === player) {
          return piece;
        }
      }
    }
    return null;
  }

  private checkGameOver(): void {
    let redKingFound = false;
    let blackKingFound = false;
    
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.gameState.board[y][x];
        if (piece?.type === PieceType.KING) {
          if (piece.player === Player.RED) redKingFound = true;
          else blackKingFound = true;
        }
      }
    }
    
    if (!redKingFound) {
      this.gameState.gameOver = true;
      this.gameState.winner = Player.BLACK;
    } else if (!blackKingFound) {
      this.gameState.gameOver = true;
      this.gameState.winner = Player.RED;
    }
  }

  resetGame(): void {
    this.gameState = {
      board: this.initializeBoard(),
      currentPlayer: Player.RED,
      selectedPiece: null,
      validMoves: [],
      gameOver: false,
      winner: null,
      isInCheck: false,
      checkingPiece: undefined
    };
    this.moveHistory = [];
    this.statsService.reset();
  }

  undoMove(): boolean {
    if (this.moveHistory.length === 0) return false;

    // 恢复上一个状态
    this.gameState = this.moveHistory.pop()!;
    
    // 撤销统计服务中的最后一步
    this.statsService.undoLastMove();
    
    return true;
  }

  canUndo(): boolean {
    return this.moveHistory.length > 0;
  }

  private deepCloneGameState(): GameState {
    return {
      board: this.gameState.board.map(row => 
        row.map(piece => piece ? { ...piece } : null)
      ),
      currentPlayer: this.gameState.currentPlayer,
      selectedPiece: this.gameState.selectedPiece ? { ...this.gameState.selectedPiece } : null,
      validMoves: [...this.gameState.validMoves],
      gameOver: this.gameState.gameOver,
      winner: this.gameState.winner,
      isInCheck: this.gameState.isInCheck,
      checkingPiece: this.gameState.checkingPiece
    };
  }

  getStats() {
    return this.statsService.getStats();
  }

  getMoveHistory() {
    return this.statsService.getMoveHistory();
  }

  getCurrentDuration() {
    return this.statsService.getCurrentDuration();
  }
}