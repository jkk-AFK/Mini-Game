# Development Guide

## Prerequisites

- Node.js 20+
- npm 9+
- Docker (optional, for local MongoDB/Redis)

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run dev:backend   # starts Express API on port 4000
npm run dev:frontend  # starts Vite dev server on port 5173
```

Use `npm run dev` to launch both concurrently.

## Quality Toolkit

- `npm run lint` — ESLint + Prettier 校验前后端代码
- `npm run test:backend` / `npm run test:frontend` — Vitest 单元测试
- `npm run format` — Prettier 一键格式化

## Testing

- Backend: `npm run test:backend`
- Frontend: `npm run test:frontend`

CI 通过 `.github/workflows/ci.yml` 自动执行 lint 与测试。

## Environment

Copy `apps/backend/.env.example` to `.env` and adjust secrets as needed. Default Docker Compose file spins up MongoDB and Redis services.

### OAuth 配置

设置以下变量以启用第三方登录（对应 `.env` 示例）：

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`
- `API_BASE_URL`：后端可被外部访问的基础 URL，用于 OAuth 回调

前端如果与后端不在同域，需要在 `.env` 内配置 `VITE_BACKEND_ORIGIN`，以便 OAuth 回调向窗口发送凭证。

### Telemetry

- 将 `ENABLE_TELEMETRY=true` 后，后端会初始化 OpenTelemetry Node SDK。
- 如需导出到 OTLP Collector，请设置 `OTEL_EXPORTER_OTLP_ENDPOINT`。
- Prometheus 指标暴露在 `/metrics`。

## Deployment

- `docker compose up --build` builds and starts MongoDB, Redis, backend, and frontend containers.
- For production, push Docker images to your registry and deploy to Kubernetes or another orchestrator.

Refer to `docs/architecture.md` for system design and `docs/atomized_tasks.md` for task breakdown.
