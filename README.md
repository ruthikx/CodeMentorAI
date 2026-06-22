# CodeMentor AI

AI-powered code review platform for improving code quality through automated suggestions.

## Project Structure

```
codementor-ai/
├── apps/
│   ├── web/       # Next.js frontend application
│   └── api/       # Express backend API
└── packages/
    ├── ai/        # AI review provider integrations
    ├── db/        # Prisma database client and schema
    ├── types/     # Shared TypeScript types
    └── ui/        # Shared UI components
```

## Prerequisites

- [pnpm](https://pnpm.io) (v9.12.3+)
- [Docker](https://docker.com) and Docker Compose (Docker Desktop for Windows or WSL2)
- Node.js (v18+)

## Setup

1. **Start required services** (PostgreSQL, Redis):
   
   Ensure Docker Desktop is running, then:
   ```bash
   docker compose up -d
   ```
   
   Or if using legacy docker-compose:
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables** (already configured in `apps/api/.env` and `apps/web/.env` for local development)

   Repository review uses the existing AI provider variables (`GROQ_API_KEY`, `GEMINI_API_KEY`, optional `GEMINI_MODEL`). Public GitHub repos can be fetched without auth, but setting `GITHUB_ACCESS_TOKEN` on the API service raises GitHub API rate limits.

   Optional repo-review limits:
   - `REPO_REVIEW_MAX_REPO_SIZE_KB` (default `25000`)
   - `REPO_REVIEW_MAX_TREE_FILES` (default `2000`)
   - `REPO_REVIEW_MAX_FILES` (default `60`)
   - `REPO_REVIEW_MAX_FILE_SIZE_BYTES` (default `122880`)
   - `REPO_REVIEW_MAX_DOWNLOAD_BYTES` (default `768000`)
   - `REPO_REVIEW_MAX_CONTEXT_CHARS` (default `70000`)
   - `REPO_REVIEW_AI_TIMEOUT_MS` (default `20000`)

4. **Run database migrations**:
   ```bash
   pnpm db:migrate
   ```

## Development

Start both frontend and backend in parallel:
```bash
pnpm dev
```

Or run them separately:
```bash
# Frontend (http://localhost:3000)
pnpm --filter @codementor-ai/web dev

# Backend (http://localhost:8000)
pnpm --filter @codementor-ai/api dev
```

## Build

```bash
pnpm build
```

## Testing

```bash
pnpm test
```

## Linting

```bash
pnpm lint
```

## Type Checking

```bash
pnpm typecheck
```

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start all apps in development mode |
| `build` | Build all apps for production |
| `lint` | Run linting across all packages |
| `typecheck` | Run TypeScript type checking |
| `test` | Run all tests |
| `db:migrate` | Run Prisma database migrations |
