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