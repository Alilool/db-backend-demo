# Local Postgres Lab

A small Next.js app for learning how frontend actions become PostgreSQL rows
through Prisma ORM. It uses local PostgreSQL only—no hosted database or cloud
account.

## What you can try

- `GET /api/tasks` reads saved tasks.
- `POST /api/tasks` inserts a task.
- `PATCH /api/tasks/:id` toggles its completed state.
- `DELETE /api/tasks/:id` removes it.
- Every database operation uses the generated, type-safe Prisma Client.

## 1. Start PostgreSQL

### Option A: Docker

If Docker Desktop is installed:

```powershell
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432`, with:

- Database: `backend_demo`
- User: `postgres`
- Password: `postgres`

### Option B: Your native PostgreSQL installation

Create a database named `backend_demo` with pgAdmin or:

```sql
CREATE DATABASE backend_demo;
```

Then adjust the username, password, port, or database name in your connection
string in the next step.

## 2. Configure the app

In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

The example contains:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backend_demo
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/backend_demo
```

Do not commit `.env.local`; it contains your database password.
For hosted serverless PostgreSQL, use its pooled URL as `DATABASE_URL` and its
direct URL as `DIRECT_URL` so Prisma migrations do not run through the pooler.

## 3. Prepare the database and run Next.js

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The status pill will turn
green after the app connects.

## Create the login user

Add these values to `.env.local` temporarily:

```text
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=use-a-strong-password-here
ADMIN_NAME=Your Name
```

Then create or update the user:

```powershell
npm run auth:create-user
```

The command hashes the password with bcrypt using 12 rounds before saving it.
Only the hash is stored in PostgreSQL. Remove `ADMIN_PASSWORD` from
`.env.local` after the command succeeds.

Auth.js also requires a random `AUTH_SECRET` of at least 32 characters. Generate
one with Node.js, put the result in `.env.local`, and add the same variable to
Vercel's environment settings:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

## Code map

- `app/database-playground.tsx` — React UI and `fetch` calls.
- `app/api/tasks/route.ts` — Prisma list and create handlers.
- `app/api/tasks/[id]/route.ts` — Prisma update and delete handlers.
- `app/login/page.tsx` — custom credentials login page.
- `auth.ts` — Auth.js configuration and bcrypt password verification.
- `db/index.ts` — shared Prisma Client with the PostgreSQL adapter.
- `prisma/schema.prisma` — the type-safe database model.
- `scripts/create-admin.ts` — one-time bcrypt user creation and password reset.
- `prisma.config.ts` — Prisma CLI configuration.
- `compose.yml` — optional local PostgreSQL container.

## Inspect the saved data

Open Prisma Studio:

```powershell
npm run db:studio
```

You can also use pgAdmin's Query Tool or `psql`:

```sql
SELECT * FROM demo_tasks ORDER BY created_at DESC;
```

Try refreshing or restarting Next.js after adding rows. They remain because the
state lives in PostgreSQL, not React memory.
