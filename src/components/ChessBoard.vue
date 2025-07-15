<template>
  <div class="chess-container">
    <div class="game-info">
      <h2>中国象棋</h2>
      <div class="current-player">
        当前玩家: <span :class="currentPlayerClass">{{ currentPlayerText }}</span>
      </div>
      <div v-if="gameState.isInCheck" class="check-warning">
        <span :class="currentPlayerClass">{{ currentPlayerText }}</span> 被将军！
      </div>
      <div v-if="gameOver" class="game-over">
        <h3>游戏结束!</h3>
        <p>{{ winnerText }}</p>
        <button @click="resetGame" class="reset-btn">重新开始</button>
      </div>
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

        <!-- 楚河汉界 - 重新定位 -->
        <div class="river-container">
          <div class="river-text">楚河汉界</div>
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
            v-for="move in gameState.validMoves" 
            :key="`${move.x}-${move.y}`"
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

    <button v-if="!gameOver" class="reset-btn" @click="resetGame">重新开始</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ChessGame } from '../services/ChessGame';
import { Player } from '../types/chess';
import type { Position } from '../types/chess';

const game = ref(new ChessGame());
const gameState = ref(game.value.getGameState());

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
}

function resetGame() {
  game.value.resetGame();
  updateGameState();
}

onMounted(() => {
  updateGameState();
});
</script>

<style scoped>
.chess-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.game-info {
  text-align: center;
  margin-bottom: 20px;
}

.game-info h2 {
  color: #8B4513;
  margin-bottom: 10px;
}

.current-player {
  font-size: 18px;
  margin-bottom: 10px;
}

.red-player {
  color: #DC143C;
  font-weight: bold;
}

.black-player {
  color: #000;
  font-weight: bold;
}

.game-over {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.reset-btn {
  background: #8B4513;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.reset-btn:hover {
  background: #A0522D;
}

.check-warning {
  color: #DC143C;
  font-weight: bold;
  font-size: 18px;
  margin: 10px 0;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.board-container {
  display: flex;
  justify-content: center;
}

.chess-board {
  position: relative;
  width: 540px;
  height: 600px;
  border: 3px solid #8B4513;
  background: #DEB887;
  margin: 20px;
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: transparent;
}

.river-text {
  font-size: 24px;
  color: #8B4513;
  font-weight: bold;
  letter-spacing: 8px;
  writing-mode: vertical-rl;
  text-orientation: upright;
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

.click-area {
  position: absolute;
  width: 60px;
  height: 60px;
  cursor: pointer;
  opacity: 0;
  border: none;
  background: transparent;
}
</style>