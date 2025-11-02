# Arcade Platform

A modular web-based arcade platform featuring classic games with multiplayer support.

## Highlights

- Socket.IO 实时大厅与匹配队列，支持排队状态提示
- 经典游戏模块（Tetris/Snake/Mario/TicTacToe）共享 Canvas Runtime 接口，可扩展新游戏
- 邮箱 + Google/Facebook OAuth 登录，凭证通过窗口消息回传
- OpenTelemetry 可选启用，Prometheus 指标暴露于 `/metrics`
- GitHub Actions CI：自动执行 `lint` + `test`

## Workspaces

- `apps/backend`: Node.js + Express API and realtime services.
- `apps/frontend`: React SPA client.
- `packages/shared`: Shared TypeScript types and utilities.
- `packages/game-engine`: Canvas runtime abstraction for games.

## Getting Started

```bash
npm install
npm run dev
```

See `docs/` for architecture, task planning, and approval workflows.
