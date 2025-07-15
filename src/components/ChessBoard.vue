<template>
  <div class="chess-container">
    <div class="main-content">
      <div class="game-header">
        <h1>中国象棋</h1>
      </div>
      
      <div class="board-container">
        <div class="chess-board">
          <!-- 棋盘网格线 - 修正绘制 -->
          <svg class="board-lines" width="540" height="600">
            <!-- 水平线 - 完整10条 -->
            <line v-for="i in 10" :key="`h-${i}`" 
                  :x1="30" :y1="(i-1) * 60 + 30" 
                  :x2="510" :y2="(i-1) * 60 + 30" 
                  stroke="#8B4513" stroke-width="2"/>
            
            <!-- 垂直线 - 跳过楚河汉界行 -->
            <line v-for="i in 9" :key="`v-${i}`" 
                  :x1="(i-1) * 60 + 30" :y1="30" 
                  :x2="(i-1) * 60 + 30" :y2="270" 
                  stroke="#8B4513" stroke-width="2"/>
            <line v-for="i in 9" :key="`v-river-${i}`" 
                  :x1="(i-1) * 60 + 30" :y1="330" 
                  :x2="(i-1) * 60 + 30" :y2="570" 
                  stroke="#8B4513" stroke-width="2"/>
            
            <!-- 九宫格斜线 - 上方将帅区域（3-5列，0-2行） -->
            <line x1="210" y1="30" x2="330" y2="150" stroke="#8B4513" stroke-width="2"/>
            <line x1="330" y1="30" x2="210" y2="150" stroke="#8B4513" stroke-width="2"/>
            
            <!-- 九宫格斜线 - 下方将帅区域（3-5列，7-9行） -->
            <line x1="210" y1="450" x2="330" y2="570" stroke="#8B4513" stroke-width="2"/>
            <line x1="330" y1="450" x2="210" y2="570" stroke="#8B4513" stroke-width="2"/>
          </svg>

          <!-- 楚河汉界 - 优化显示 -->
          <div class="river-container">
            <div class="river-text river-left">楚河</div>
            <div class="river-text river-right">汉界</div>
          </div>

          <!-- 棋子 - 重新定位到交叉点 -->
          <div class="pieces-layer">
            <div 
              v-for="piece in allPieces" 
              :key="piece.id"
              class="chess-piece"
              :class="piece.player"
              :style="{ 
                left: piece.position.x * 60 + 30 - 25 + 'px', 
                top: piece.position.y * 60 + 30 - 25 + 'px'
              }"
              :data-selected="isSelected(piece.position.x, piece.position.y)"
              @click="handlePieceClick(piece.position.x, piece.position.y)"
            >
              {{ getPieceSymbol(piece.type, piece.player) }}
            </div>
          </div>

          <!-- 可选移动标记 -->
          <div class="valid-moves-layer">
            <div 
              v-for="move in gameState.validMoves" :key="`${move.x}-${move.y}`"
              class="valid-move-dot"
              :style="{ 
                left: move.x * 60 + 30 - 10 + 'px', 
                top: move.y * 60 + 30 - 10 + 'px'
              }"
              @click="handleMoveClick(move.x, move.y)"
            ></div>
          </div>

          <!-- 点击区域 - 覆盖整个棋盘 -->
          <div class="click-areas">
            <div 
              v-for="y in 10" 
              :key="y"
              class="click-row"
            >
              <div 
                v-for="x in 9" 
                :key="x"
                class="click-area"
                :style="{ 
                  left: (x-1) * 60 + 30 - 30 + 'px', 
                  top: (y-1) * 60 + 30 - 30 + 'px' 
                }"
                @click="handleCellClick(x-1, y-1)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧控制面板 -->
    <div class="control-panel">
      <!-- 当前玩家信息 -->
      <div class="current-player" :class="currentPlayerClass">
        <div class="player-info">
          当前玩家: {{ currentPlayerText }}
        </div>
        <div class="action-buttons">
          <button @click="resetGame" class="action-btn reset-btn">重新开始</button>
          <button @click="undoMove" class="action-btn undo-btn" :disabled="!canUndo">悔棋</button>
        </div>
      </div>
      
      <div v-if="gameState.isInCheck" class="check-warning">
        将军！
      </div>
      
      <div v-if="gameOver" class="game-over">
        <h3>游戏结束</h3>
        <p>{{ winnerText }}</p>
      </div>
      
      <!-- 游戏统计面板 -->
      <div class="stats-panel">
        <h3>游戏统计</h3>
        <div class="stat-item">
          <span>总步数:</span>
          <span>{{ gameStats.totalMoves }}</span>
        </div>
        <div class="stat-item">
          <span>红方步数:</span>
          <span>{{ gameStats.redMoves }}</span>
        </div>
        <div class="stat-item">
          <span>黑方步数:</span>
          <span>{{ gameStats.blackMoves }}</span>
        </div>
        <div class="stat-item">
          <span>红方吃子:</span>
          <span>{{ gameStats.captures.red }}</span>
        </div>
        <div class="stat-item">
          <span>黑方吃子:</span>
          <span>{{ gameStats.captures.black }}</span>
        </div>
        <div class="stat-item">
          <span>游戏时长:</span>
          <span>{{ formatDuration(gameStats.gameDuration || currentDuration) }}</span>
        </div>
      </div>
      
      <!-- 移动日志 -->
      <div class="move-log">
        <h3>最近移动</h3>
        <div class="log-entries">
          <div v-for="(move, index) in recentMoves" :key="index" class="log-entry">
            <span class="move-number">{{ move.moveNumber }}.</span>
            <span class="move-piece">
              {{ formatMove(move) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ChessGame } from '../services/ChessGame';
import { Player } from '../types/chess';
import type { Position } from '../types/chess';
import type { MoveRecord } from '../services/GameStats';

const game = ref(new ChessGame());
const gameState = ref(game.value.getGameState());
const gameStats = ref(game.value.getStats());
const currentDuration = ref(game.value.getCurrentDuration());
const recentMoves = ref<MoveRecord[]>([]);

const board = computed(() => gameState.value.board);
const currentPlayer = computed(() => gameState.value.currentPlayer);
const gameOver = computed(() => gameState.value.gameOver);
const winner = computed(() => gameState.value.winner);


const currentPlayerText = computed(() => 
  currentPlayer.value === Player.RED ? '红方' : '黑方'
);

const currentPlayerClass = computed(() => 
  currentPlayer.value === Player.RED ? 'red-player' : 'black-player'
);

const winnerText = computed(() => {
  if (!winner.value) return '';
  return winner.value === Player.RED ? '红方获胜！' : '黑方获胜！';
});

const allPieces = computed(() => {
  const pieces = [];
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = board.value[y][x];
      if (piece) {
        pieces.push(piece);
      }
    }
  }
  return pieces;
});

function getPieceSymbol(type: string, player: Player): string {
  const symbols: Record<Player, Record<string, string>> = {
    [Player.RED]: {
      'k': '帅',
      'a': '仕',
      'e': '相',
      'h': '马',
      'r': '车',
      'c': '炮',
      'p': '兵'
    },
    [Player.BLACK]: {
      'k': '将',
      'a': '士',
      'e': '象',
      'h': '马',
      'r': '车',
      'c': '炮',
      'p': '卒'
    }
  };
  
  return symbols[player][type] || '';
}

function isSelected(x: number, y: number): boolean {
  return gameState.value.selectedPiece?.position.x === x && 
         gameState.value.selectedPiece?.position.y === y;
}

function isValidMove(x: number, y: number): boolean {
  return gameState.value.validMoves.some(move => move.x === x && move.y === y);
}

function handleCellClick(x: number, y: number) {
  if (gameOver.value) return;
  
  const position: Position = { x, y };
  
  if (gameState.value.selectedPiece) {
    if (isValidMove(x, y)) {
      game.value.movePiece(position);
      updateGameState();
    } else {
      // 尝试选择新棋子
      if (game.value.selectPiece(position)) {
        updateGameState();
      } else {
        // 取消选择
        game.value.selectPiece({ x: -1, y: -1 });
        updateGameState();
      }
    }
  } else {
    // 选择棋子
    if (game.value.selectPiece(position)) {
      updateGameState();
    }
  }
}

function handlePieceClick(x: number, y: number) {
  handleCellClick(x, y);
}

function handleMoveClick(x: number, y: number) {
  handleCellClick(x, y);
}

function updateGameState() {
  gameState.value = game.value.getGameState();
  updateStats();
}

function updateStats() {
  gameStats.value = game.value.getStats();
  currentDuration.value = game.value.getCurrentDuration();
  recentMoves.value = game.value.getMoveHistory().slice(-5);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatMove(move: MoveRecord): string {
  const pieceMap: Record<string, string> = {
    'k': '将',
    'a': '士',
    'e': '象',
    'h': '马',
    'r': '车',
    'c': '炮',
    'p': '兵'
  };
  
  const pieceType = move.pieceType;
  const pieceName = pieceMap[pieceType] || pieceType;
  const playerName = move.player === 'red' ? '红' : '黑';
  
  return `${playerName}${pieceName} ${move.from.x},${move.from.y}→${move.to.x},${move.to.y}`;
}

function resetGame() {
  game.value.resetGame();
  updateGameState();
}

function undoMove() {
  if (game.value.canUndo()) {
    game.value.undoMove();
    updateGameState();
  }
}

const canUndo = computed(() => game.value.canUndo());

onMounted(() => {
  updateGameState();
  
  // 定时更新游戏时长
  setInterval(() => {
    if (!gameOver.value) {
      currentDuration.value = game.value.getCurrentDuration();
    }
  }, 1000);
});
</script>

<style scoped>
.chess-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
  gap: 30px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 540px;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
}

.game-header h1 {
  color: #8B4513;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  margin: 0;
}

.board-container {
  display: flex;
  justify-content: center;
}

.chess-board {
  position: relative;
  width: 540px;
  height: 600px;
  border: 4px solid #8B4513;
  background: #DEB887;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.board-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.river-container {
  position: absolute;
  top: calc(50% - 30px);
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  padding: 0 20px;
}

.river-text {
  font-size: 24px;
  color: #8B4513;
  font-weight: bold;
  letter-spacing: 3px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

.river-left {
  margin-left: 50px;
}

.river-right {
  margin-right: 50px;
}

.pieces-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.chess-piece {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  border: 2px solid #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  user-select: none;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.chess-piece:hover {
  transform: scale(1.1);
}

.chess-piece[data-selected="true"] {
  box-shadow: 0 0 0 3px #90EE90, 0 2px 4px rgba(0,0,0,0.3);
}

.chess-piece.red {
  background: #DC143C;
  color: white;
  border-color: #8B0000;
}

.chess-piece.black {
  background: #000;
  color: white;
  border-color: #333;
}

.valid-moves-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.valid-move-dot {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #FFA500;
  border-radius: 50%;
  opacity: 0.8;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.valid-move-dot:hover {
  transform: scale(1.2);
  opacity: 1;
}

.click-areas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 右侧控制面板 */
.control-panel {
  width: 300px;
  height: 600px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  justify-content: flex-start;
}

.current-player {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 15px;
}

.player-info {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
}

.current-player.red-player .player-info {
  color: #DC143C;
}

.current-player.black-player .player-info {
  color: #000;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
}

.check-warning {
  color: #FF4500;
  font-weight: bold;
  animation: pulse 1s infinite;
  text-align: center;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.game-over {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 15px;
}

.stats-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stats-panel h3 {
  color: #374151;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  border-bottom: 2px solid #8B4513;
  padding-bottom: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  padding: 5px 0;
}

.stat-item span:first-child {
  color: #6b7280;
}

.stat-item span:last-child {
  color: #111827;
  font-weight: bold;
}

.move-log {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  flex: 1;
  overflow-y: auto;
  min-height: 250px;
}

.move-log h3 {
  color: #374151;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  border-bottom: 2px solid #8B4513;
  padding-bottom: 8px;
}

.log-entries {
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
}

.log-entry {
  padding: 5px 8px;
  color: #4b5563;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry .move-number {
  color: #6b7280;
  margin-right: 8px;
  font-weight: bold;
}

.log-entry .move-piece {
  color: #111827;
}



.action-btn {
  background: #8B4513;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-width: 80px;
}

.action-btn:hover:not(:disabled) {
  background: #A0522D;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.action-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.7;
}

.undo-btn {
  background: #059669;
}

.undo-btn:hover:not(:disabled) {
  background: #047857;
}

.click-area {
  position: absolute;
  width: 60px;
  height: 60px;
  cursor: pointer;
  opacity: 0;
  border: none;
  background: transparent;
}

@media (max-width: 1024px) {
  .chess-container {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .control-panel {
    width: 100%;
    max-width: 540px;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stats-panel,
  .move-log {
    flex: 1;
    min-width: 250px;
  }
  
  .action-buttons {
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }
}
</style>