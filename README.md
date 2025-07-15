# 中国象棋游戏

一个使用 Vue 3 + TypeScript + Vite 开发的中国象棋游戏。

## 在线体验

[点击这里在线体验](https://vibe-showcase.github.io/chess-kimi-k4)

## 功能特点

- 完整的象棋规则实现
- 直观的用户界面
- 支持将军和胜负判定
- 响应式设计

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署到 GitHub Pages

### 自动部署（推荐）

每次推送到 `main` 分支时，GitHub Actions 会自动部署到 GitHub Pages。

### 手动部署

```bash
# 安装 gh-pages
npm install -g gh-pages

# 部署到 GitHub Pages
npm run deploy
```

## 项目结构

```
src/
├── components/     # Vue 组件
├── services/      # 游戏逻辑
├── types/          # TypeScript 类型定义
└── assets/         # 静态资源
```
