# Stage 2 · Architect

## 1. 技术选型概览

| 层级           | 方案                              | 说明 |
| -------------- | --------------------------------- | ---- |
| 前端           | React 18 + Vite + TypeScript      | 组件化开发、快速构建、良好生态 |
| UI 框架        | Tailwind CSS + Headless UI        | 快速搭建响应式界面，支持暗色模式 |
| 游戏框架       | 自研组件化封装，Canvas & WebGL    | 轻量可自定义，结合 `pixi.js` 扩展留口 |
| 状态管理       | Redux Toolkit + RTK Query         | 统一管理会话状态、成绩缓存、API 调用 |
| 实时通信       | Socket.IO (WebSocket fallback)    | 支持房间匹配、游戏状态同步 |
| 国际化         | i18next                           | 多语言支持 |
| 前端构建       | Vite、ESLint、Prettier、Vitest    | 静态检查与单元测试 |
| 后端           | Node.js 20 + Express 4 + TypeScript | REST API、WebSocket 中间件 |
| 身份认证       | JWT (Email/Password) + OAuth 2.0 (Google/Facebook) | 使用 Passport.js 统一适配 |
| 数据库         | MongoDB + Mongoose                | 文档型，方便存储游戏成绩 |
| 缓存与队列     | Redis                              | 比赛匹配、排行榜缓存、速率限制 |
| 日志 & 监控    | Pino + OpenTelemetry + Prometheus 导出  | 支持可观测性扩展 |
| 部署基线       | Docker Compose（开发），Kubernetes（生产） | 分层部署 |

## 2. 系统分层设计

```
┌───────────────────────────────┐
│           前端 SPA            │
│ ┌───────────┬──────────────┐ │
│ │ UI Shell  │ 游戏运行容器 │ │
│ │           │（React + Canvas）│ │
│ └───────────┴──────────────┘ │
│ API Client / WebSocket Client │
└──────────────┬────────────────┘
               │ HTTPS / WSS
┌──────────────▼────────────────┐
│         API Gateway (Express) │
│  REST 控制器、GraphQL（留口）   │
│  Auth 中间件、速率限制等        │
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│ 应用服务层                     │
│ - User Service                │
│ - Game Session Service        │
│ - Matchmaking Service         │
│ - Scoreboard Service          │
│ - Admin Management Service    │
└──────────────┬────────────────┘
               │
┌──────────────▼───────────────┐
│ 基础设施层                    │
│ - MongoDB (用户、成绩、会话)   │
│ - Redis (会话、排行榜缓存)     │
│ - 对象存储（游戏资源）          │
│ - 外部 OAuth Provider         │
└───────────────────────────────┘
```

## 3. 模块职责

### 3.1 前端模块

- `app-shell`: 路由、布局、导航、国际化、主题管理。
- `auth`: 登录、注册、第三方 OAuth、JWT 刷新逻辑。
- `games-hub`: 游戏列表、搜索过滤、排行榜展示。
- `lobby`: Socket.IO 大厅客户端；匹配请求、对战房间状态、聊天室。
- `game-runtime`: 负责 Canvas 渲染、输入控制、游戏状态机，与实时服务通讯。
- `admin-console`: 管理员面板（用户管理、统计、举报处理）。
- `shared`: 基础组件库、hooks、状态 store、API client、WebSocket hooks。

游戏子模块（位于 `frontend/src/games`）：
1. `mario`: 横版平台游戏；TileMap 渲染、碰撞检测、敌人 AI。
2. `tetris`: 俄罗斯方块；方块生成、旋转、消行、速度提升。
3. `snake`: 贪吃蛇；网格状态、碰撞检测、食物刷新。
4. `tic-tac-toe`: 井字棋；单人（AI）、多人模式。

每个游戏暴露统一接口：

```ts
interface GameDefinition {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  singlePlayer: GameRuntimeFactory;
  multiPlayer?: MultiplayerRuntimeFactory;
  controls: ControlDefinition[];
}
```

### 3.2 后端模块

- `api/auth`: 注册、登录、第三方 OAuth 回调、Token 管理。
- `api/users`: 用户资料、偏好、封禁。
- `api/games`: 游戏元数据、历史记录、设置。
- `api/scores`: 分数提交、排行榜查询。
- `api/admin`: 审核、统计、内容管理。
- `ws/matchmaking`: 房间匹配、队列分配。
- `ws/gameplay`: 同步帧数据、状态广播。
- `services`: 业务逻辑分层（UserService、ScoreService、MatchService 等）。
- `models`: Mongoose schema。
- `middlewares`: Auth、错误处理、速率限制、审计日志。

### 3.3 DevOps & 安全

- Docker Compose 提供 `frontend`, `backend`, `mongo`, `redis`。
- 环境变量管理 `.env` + `dotenv-flow`。
- 安全措施：Helmet、CORS 白名单、输入验证 (Zod)、JWT 黑名单机制、多因素认证扩展接口、作弊检测钩子。
- CI/CD：GitHub Actions 运行 lint/test/build，推送可选 Docker 镜像。
- 观测：OpenTelemetry SDK 导出 trace/span，Prometheus 指标 `/metrics`，Pino 日志送至集中式存储。

## 4. 数据模型（MongoDB）

```ts
User {
  _id: ObjectId
  username: string (unique)
  email: string (unique)
  passwordHash: string
  providers: { type: 'email' | 'google' | 'facebook', providerId: string }[]
  roles: string[] // ['user', 'admin']
  locale: string
  createdAt: Date
  updatedAt: Date
  bannedUntil?: Date
}

Game {
  _id: ObjectId
  key: string // 'mario', 'tetris', ...
  name: string
  genre: string
  metadata: Record<string, any>
  createdAt: Date
}

ScoreRecord {
  _id: ObjectId
  userId: ObjectId
  gameKey: string
  score: number
  level?: number
  durationMs: number
  mode: 'single' | 'multi'
  matchId?: ObjectId
  createdAt: Date
}

MatchSession {
  _id: ObjectId
  gameKey: string
  status: 'waiting' | 'active' | 'finished'
  players: { userId: ObjectId; team: number }[]
  snapshot?: string // 压缩后的关键帧
  createdAt: Date
  updatedAt: Date
}

AuditLog {
  _id: ObjectId
  actorId: ObjectId
  action: string
  target?: ObjectId
  payload: Record<string, any>
  createdAt: Date
}
```

索引：

- `User.email/username` 唯一索引。
- `ScoreRecord`：`userId` + `gameKey` 复合索引，`score` 降序。
- `MatchSession`：`gameKey` + `status`。
- `AuditLog`：`createdAt`，支持按时间窗口查询。

## 5. API 设计（REST + WebSocket）

### 5.1 REST 主要端点

| Method | Path | 描述 | 认证 |
| ------ | ---- | ---- | ---- |
| POST | `/api/v1/auth/register` | 邮箱注册 | - |
| POST | `/api/v1/auth/login` | 登录 | - |
| POST | `/api/v1/auth/refresh` | 刷新 JWT | Refresh Token |
| POST | `/api/v1/auth/logout` | 注销并吊销 Refresh Token | Access Token + Refresh Token |
| GET  | `/api/v1/auth/google` | Google OAuth 引导 | - |
| GET  | `/api/v1/auth/google/callback` | Google OAuth 回调 | - |
| GET  | `/api/v1/auth/facebook` | Facebook OAuth 引导 | - |
| GET  | `/api/v1/auth/facebook/callback` | Facebook OAuth 回调 | - |
| GET  | `/api/v1/users/me` | 当前用户资料 | Access Token |
| PATCH| `/api/v1/users/me` | 更新资料/偏好 | Access Token |
| GET  | `/api/v1/games` | 列出游戏 | 可选 |
| GET  | `/api/v1/games/:key/history` | 查询历史成绩 | Access Token |
| POST | `/api/v1/scores/submit` | 上报成绩 | Access Token |
| GET  | `/api/v1/scores/history` | 查询当前用户成绩历史，支持分页筛选 | Access Token |
| GET  | `/api/v1/scores/leaderboard` | 排行榜 | 可选 |
| GET  | `/api/v1/admin/users` | 管理用户 | Admin |
| POST | `/api/v1/admin/actions/ban` | 封禁/解禁用户 | Admin |
| GET  | `/api/v1/admin/metrics` | 平台统计 | Admin |
| GET  | `/metrics` | Prometheus 指标 | 可选 |

### 5.2 WebSocket Channel

命名空间：

- `/ws/lobby`：用户上线、匹配排队、聊天室。
  - `match_request` / `cancel_match`
  - `match_found`（广播匹配结果，仅客户端本地过滤当前玩家）
  - `match_error` / `queue_cancelled`
- `/ws/game/:gameKey`：具体游戏房间，事件包括：
  - `join_room` / `room_update`
  - `start_game`
  - `input_event`（广播玩家操作）
  - `state_snapshot`（服务器回传 authoritative 状态）
  - `game_over`（统计结果）
  - `chat_message`（玩家文本聊天）

TicTacToe 作为多人 MVP，服务器维护 3x3 棋盘状态：

```ts
type TicTacToeState = {
  board: Array<Array<'X' | 'O' | null>>;
  current: 'X' | 'O';
  winner?: 'X' | 'O' | 'draw';
};
```

服务端根据 `input_event` 写入棋步，校验合法性，广播最新 `state_snapshot`，胜负后触发 `game_over`。后续可扩展至其它游戏共享同一事件格式。

服务端需支持回放与重新连接：保留最近 N 帧状态，断线重连后同步。

## 6. 模块交互与流程

### 6.1 用户登录流程

1. 前端提交凭证至 `/auth/login`。
2. 后端验证凭证、生成 Access + Refresh Token。
3. 前端持久化 Refresh Token（HttpOnly Cookie），Access Token 存储在内存（Redux）。
4. 请求时附带 Access Token，过期后自动调用 `/auth/refresh`。
5. 登出时注销 Refresh Token 并清理 Redis 黑名单。

### 6.2 匹配对战流程

1. 前端在大厅发出 `match_request`，包含游戏类型、模式。
2. Matchmaking Service 将玩家加入队列，通过 Redis 排队。
3. 匹配成功后生成 `matchId`，通知所有玩家加入 `/ws/game/:matchId`。
4. 游戏开始时，服务器维护 authoritative 状态，周期性广播快照；客户端发送输入事件。
5. 比赛结束提交成绩，由 ScoreService 记录并触发排行榜更新。

### 6.3 管理员操作

1. 管理员登录后台，通过受限路由访问。
2. 可执行用户封禁、查看违规举报、审查统计数据。
3. 管理操作写入 `AuditLog`，供审计。

### 6.4 国际化流程

1. `AppLayout` 在初始化时挂载 `I18nextProvider`，加载打包内的 `en`、`zh-CN` 资源。
2. 用户通过导航栏 `LocaleSwitcher` 切换语言，触发 Redux `preferences/setLocale`。
3. Store 更新后调用 `/api/v1/users/me` PATCH 同步 `locale`。
4. `react-i18next` 自动重渲页面文本，游戏控制条等组件读取翻译字符串。

### 6.5 刷新令牌生命周期

1. 注册/登录成功后，`issueTokens` 写入 `RefreshToken` 集合（哈希 + 过期时间）。
2. 客户端保存 refresh token 于 HttpOnly Cookie，本地内存仅留 access token。
3. `/auth/refresh` 先验证 token 哈希，再吊销旧 token 并发新 token（token rotation）。
4. `/auth/logout` 将当前 refresh token 置为已吊销，防止继续使用。

### 6.6 成绩与排行榜

1. 游戏结束 → 前端调用 `/scores/submit` 写入结果。
2. 个人档案请求 `/scores/history?gameKey=...&page=1&pageSize=10`。
3. 返回数据结构：
   ```json
   {
     "items": [{ "_id": "...", "gameKey": "tetris", "score": 1234, "mode": "single", "createdAt": "..." }],
     "total": 42
   }
   ```
4. 排行榜维持 `/scores/leaderboard` 顶部十名；后续可加分页或全局榜。

### 6.7 大厅与房间增强

1. `MatchmakingService` 匹配成功后向 `Lobby` namespace 广播 `match_found`（含 `matchId`）。
2. 客户端跳转至 `/games/:gameKey?matchId=...`，在游戏页调用 `useGameRoomSocket`。
3. 房间 namespace 负责：
   - 分配玩家角色（TicTacToe：`X`/`O`）。
   - 广播 `state_snapshot` 与 `chat_message`。
   - 处理断线重连：基于 `MatchSession` 记录最近状态。
4. 结束后写入成绩并 `room_update`，客户端提示返回大厅。

## 7. 架构质量门控

- **性能**：前端懒加载游戏模块；后端启用 HTTP 缓存、压缩、Redis 缓存排行榜；WebSocket 高频事件启用差量同步。
- **可维护**：单体仓库（monorepo）结构 `apps/frontend`, `apps/backend`, `packages/game-engine`, `packages/shared`.
- **安全**：OAuth 回调校验，密码哈希使用 Argon2，速率限制 & 滑动窗口，CSRF 防护（Cookie + Double Submit）。
- **扩展性**：游戏模块遵循统一接口，可按需新增；Socket 事件管理器采用中间件模式。
- **可靠性**：Vitest + Playwright 测试；CI 覆盖 lint/test/build；Docker 环境用于一致性验证。

---

> 本文档输出 Stage 2（Architect）结果，为后续任务拆解与实现提供基础。
