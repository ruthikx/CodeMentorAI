# CodeMentor AI

CodeMentor AI is an AI-powered code review and learning platform. It lets developers paste code, stream review findings, accept or reject suggested fixes, generate corrected code, review GitHub repositories or uploaded project zips, and track review history and learning metrics.

## Features

- Live AI review stream for pasted source code.
- Monaco-based web editor with language detection.
- Issue cards with severity, category, line ranges, explanations, and suggested fixes.
- Accept/reject workflow and final-code generation from accepted fixes.
- Review chat for follow-up questions about a review.
- GitHub PR review queue backed by Redis.
- Public GitHub repository review and uploaded `.zip` project review.
- Downloadable patches, corrected files, and corrected zip artifacts for repo reviews.
- Dashboard, history, badges, category trends, and tier-aware daily review limits.
- Provider failover across Groq and Gemini.

## Tech Stack

- Monorepo: pnpm workspaces + Turborepo
- Frontend: Next.js 14, React 18, Tailwind CSS, NextAuth, React Query, Monaco Editor
- Backend: Express, Socket.IO, Server-Sent Events, Bull, Redis
- Database: PostgreSQL, Prisma
- AI: Groq `llama-3.3-70b-versatile`, Gemini `gemini-2.5-flash` by default
- Tests: Jest, ts-jest, Supertest

## Repository Layout

```text
.
|-- apps
|   |-- api                 # Express API, auth middleware, review routes, queues
|   `-- web                 # Next.js app, auth pages, dashboard, review UI
|-- packages
|   |-- ai                  # AI providers, prompts, parsers, fallback logic
|   |-- db                  # Prisma schema and migrations
|   |-- types               # Shared TypeScript contracts
|   `-- ui                  # Shared UI package placeholder
|-- docker-compose.yml      # Local PostgreSQL and Redis
|-- pnpm-workspace.yaml
`-- turbo.json
```

## Prerequisites

- Node.js 18+
- pnpm 9.12.3+
- Docker and Docker Compose
- At least one AI provider key: `GROQ_API_KEY` or `GEMINI_API_KEY`

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start local services:

   ```bash
   docker compose up -d
   ```

   This starts PostgreSQL on `localhost:5432` and Redis on `localhost:6379`.

3. Configure environment files.

   `packages/db/.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codementor_ai"
   ```

   `apps/api/.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codementor_ai"
   REDIS_URL="redis://127.0.0.1:6379"
   PORT=8000

   JWT_SECRET="replace-with-a-long-random-secret"
   JWT_AUDIENCE="codementor-ai"
   JWT_ISSUER="codementor-ai"

   GROQ_API_KEY=""
   GEMINI_API_KEY=""
   GEMINI_MODEL="gemini-2.5-flash"

   GITHUB_ACCESS_TOKEN=""
   GITHUB_WEBHOOK_SECRET=""
   ```

   `apps/web/.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codementor_ai"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="replace-with-a-long-random-secret"

   NEXT_PUBLIC_API_URL="http://localhost:8000"

   JWT_SECRET="same-value-as-apps-api"
   JWT_AUDIENCE="codementor-ai"
   JWT_ISSUER="codementor-ai"

   GITHUB_CLIENT_ID=""
   GITHUB_CLIENT_SECRET=""
   GITHUB_TOKEN_ENCRYPTION_KEY="replace-with-a-long-random-secret"
   ```

   `JWT_SECRET`, `JWT_AUDIENCE`, and `JWT_ISSUER` must match between the web and API apps. The web app uses them to sign API bearer tokens after NextAuth login, and the API uses them to verify requests.

   Leave `JWT_PUBLIC_KEY` unset for the default local setup. If it is set, the API expects RS256 tokens from an external signer instead of the HS256 tokens created by the web app.

4. Run Prisma migrations:

   ```bash
   pnpm db:migrate
   ```

5. Start the apps:

   ```bash
   pnpm dev
   ```

   Frontend: `http://localhost:3000`

   API: `http://localhost:8000`

## Authentication

The app uses NextAuth in the web app and bearer tokens in the API.

- Email/password signup is available through the web app and stores users in PostgreSQL.
- Credentials login checks the database user password hash.
- Optional test credentials can be configured with `AUTH_TEST_EMAIL` plus either `AUTH_TEST_PASSWORD` or `AUTH_TEST_PASSWORD_HASH`.
- GitHub login requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- GitHub OAuth requests `read:user user:email repo` so PR review can list repositories and fetch PR diffs.
- GitHub access tokens are encrypted with `GITHUB_TOKEN_ENCRYPTION_KEY`, falling back to `NEXTAUTH_SECRET`.

For local manual API calls, use a valid bearer token from the web session or set `NEXT_PUBLIC_API_TOKEN` for development-only testing.

## Environment Variables

Core variables:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | web, api, db | PostgreSQL connection string for Prisma. |
| `REDIS_URL` | api | Redis connection for rate limits and GitHub PR queue. Defaults to `redis://127.0.0.1:6379`. |
| `PORT` | api | API server port. Defaults to `8000`. |
| `NEXT_PUBLIC_API_URL` | web | Browser-facing API base URL. |
| `NEXT_PUBLIC_API_BASE_URL` | web | Backward-compatible fallback API base URL. |
| `NEXTAUTH_URL` | web | Public URL for NextAuth callbacks. |
| `NEXTAUTH_SECRET` | web | NextAuth secret. Also used as token encryption fallback. |
| `JWT_SECRET` | web, api | HS256 signing and verification secret for API bearer tokens. |
| `JWT_PUBLIC_KEY` | api | Optional RS256 verification key. If set, API verifies RS256 tokens. |
| `JWT_AUDIENCE` | web, api | Expected JWT audience. Must match. |
| `JWT_ISSUER` | web, api | Expected JWT issuer. Must match. |

AI variables:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Enables the Groq provider. |
| `GEMINI_API_KEY` | Enables the Gemini provider. |
| `GEMINI_MODEL` | Optional Gemini model override. Defaults to `gemini-2.5-flash`. |
| `AI_PROVIDER_TIMEOUT_MS` | Optional provider timeout used by fallback logic. Defaults to `8000`. |
| `AI_EVAL_TIMEOUT_MS` | Optional timeout for `packages/ai` eval runs. |

GitHub variables:

| Variable | Purpose |
| --- | --- |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID for web login. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret for web login. |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Secret used to encrypt OAuth access tokens in NextAuth JWTs. |
| `GITHUB_ACCESS_TOKEN` | Optional API fallback token for public repo review, PR comments, PR merges, and higher GitHub API rate limits. |
| `GITHUB_WEBHOOK_SECRET` | Secret used to verify `/api/github/webhook` signatures. |

Repository review limits:

| Variable | Default |
| --- | --- |
| `REPO_REVIEW_MAX_REPO_SIZE_KB` | `25000` |
| `REPO_REVIEW_MAX_TREE_FILES` | `2000` |
| `REPO_REVIEW_MAX_FILES` | `60` |
| `REPO_REVIEW_MAX_FILE_SIZE_BYTES` | `122880` |
| `REPO_REVIEW_MAX_DOWNLOAD_BYTES` | `768000` |
| `REPO_REVIEW_MAX_CONTEXT_CHARS` | `70000` |
| `REPO_REVIEW_AI_TIMEOUT_MS` | `20000` |

## Scripts

Run from the repository root unless noted otherwise.

| Script | Description |
| --- | --- |
| `pnpm dev` | Start all apps in development mode through Turborepo. |
| `pnpm build` | Build all apps and packages. |
| `pnpm lint` | Run lint/type lint tasks across the workspace. |
| `pnpm typecheck` | Run TypeScript checks. |
| `pnpm test` | Run all Jest test suites. |
| `pnpm db:migrate` | Run Prisma migrations from `packages/db`. |
| `pnpm --filter @codementor-ai/db generate` | Generate Prisma client. |
| `pnpm --filter @codementor-ai/ai eval` | Run provider evals. Makes real AI provider calls. |

Useful app-specific commands:

```bash
pnpm --filter @codementor-ai/web dev
pnpm --filter @codementor-ai/api dev
pnpm --filter @codementor-ai/api test
pnpm --filter @codementor-ai/ai test
```

## API Overview

Most API routes require `Authorization: Bearer <token>`.

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Health check for API, PostgreSQL, and Redis. |
| `GET /auth/health` | Lightweight auth router health check. |
| `POST /api/reviews` | Create a pasted-code review. |
| `GET /api/reviews/:id` | Fetch review status, issues, and submission. |
| `GET /api/reviews/:id/stream` | Stream review status and issue events over SSE. |
| `POST /api/reviews/:id/chat` | Stream chat responses about a review. |
| `POST /api/reviews/:id/final-code` | Generate corrected code from accepted issues. |
| `PATCH /api/reviews/:id/issues/:issueId` | Accept or reject a review issue. |
| `GET /api/submissions` | List current user's submissions. |
| `GET /api/submissions/:id` | Fetch one submission and its latest review. |
| `DELETE /api/submissions/:id` | Delete a submission. |
| `GET /api/dashboard/summary` | Review counts, category counts, severity counts, and streaks. |
| `GET /api/dashboard/trends` | Review timeline and top categories. |
| `GET /api/dashboard/badges` | Earned badges and badge progress. |
| `GET /api/github/repos` | List repositories for the connected GitHub token. |
| `POST /api/github/repos/:repoId/review` | Queue a GitHub PR review. |
| `POST /api/github/repo-review` | Review a public GitHub repository URL. |
| `POST /api/github/repo-review/upload` | Review an uploaded project zip. |
| `POST /api/github/webhook` | Verify and accept GitHub webhook calls. |

Review creation is asynchronous. The API returns a `reviewId`, then the frontend subscribes to `/api/reviews/:id/stream` for issue and completion events.

## Review Limits

Daily review rate limits are tier-based:

| Tier | Daily reviews |
| --- | --- |
| `free` | 10 |
| `pro` | 100 |
| `team` | Unlimited |

Pasted-code submissions are limited to 100 KB. Repository review also filters noisy folders, lockfiles, binary files, large files, and large repositories before sending curated source excerpts to the AI provider.

## Testing

Run the full suite:

```bash
pnpm test
```

Run focused suites:

```bash
pnpm --filter @codementor-ai/api test
pnpm --filter @codementor-ai/ai test
```

AI evals are separate from unit tests because they call real providers:

```bash
pnpm --filter @codementor-ai/ai eval
```

## Deployment

The deployment workflow is defined in `.github/workflows/deploy.yml` and runs on pushes to `main`.

It triggers:

- Vercel frontend deploy hook.
- Render backend deploy hook.
- Render Prisma migration deploy hook.
- Post-deploy smoke test against `RENDER_BACKEND_URL/api/health`.

Required GitHub Actions secrets:

| Secret | Purpose |
| --- | --- |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel frontend deploy hook. |
| `RENDER_DEPLOY_HOOK_URL` | Render backend deploy hook. |
| `RENDER_PRISMA_MIGRATE_HOOK_URL` | Render hook that runs Prisma migrations. |
| `RENDER_BACKEND_URL` | Public backend URL for the smoke test. |
| `GROQ_API_KEY` | Production Groq API key configured in the backend environment. |
| `VERCEL_TOKEN` | Documented for token-based Vercel deploys, though the current workflow uses deploy hooks. |

Production environments also need the runtime variables listed above, especially database, Redis, auth, JWT, AI provider, and GitHub OAuth settings.

## Notes

- Keep secrets out of source control. Local `.env` files are ignored.
- Public repo review can work without GitHub OAuth for public repositories, but `GITHUB_ACCESS_TOKEN` improves API rate limits.
- Private repository and PR workflows require a GitHub OAuth session or an API-level `GITHUB_ACCESS_TOKEN`.
- The API health route checks both PostgreSQL and Redis, so it is a useful first check after local setup or deploy.
