# Buddy Script

A simple social-media app built for the **Appifylab Full-Stack Engineer** selection task.
The three provided design pages (**Login**, **Register**, **Feed**) are converted into a working
full-stack application: a **Next.js** frontend, a **NestJS** API, **PostgreSQL** via **Prisma**,
JWT cookie auth, and **Cloudflare R2** for post images.

> **Demo accounts** (after seeding) — password `Password123` for all:
> `alice@buddy.dev` · `bob@buddy.dev` · `carol@buddy.dev`

---

## Features

| Requirement | Status |
| --- | --- |
| Secure auth (register: first name, last name, email, password; login) | ✅ JWT in httpOnly cookie, bcrypt |
| Feed is a protected route | ✅ `proxy.ts` guard + server + API guards |
| Public posts visible to all; **private** posts visible only to author | ✅ enforced in the feed query and single-post fetch |
| Create posts with **text + image** | ✅ image uploaded to R2 via presigned URL |
| Newest-first feed | ✅ keyset (cursor) pagination + infinite scroll |
| Like / unlike posts with correct state | ✅ optimistic UI, idempotent toggle |
| Comments + replies, each with like/unlike | ✅ self-referential comments (1 level of replies) |
| Show **who liked** a post / comment / reply | ✅ avatars + paginated "who liked" list |

Decorative elements from the mockup that the task says can be ignored (friend requests, chat,
stories, "you might like", dark mode, notifications, share, the save/edit/hide dropdown) are kept
static or omitted, per _"you may ignore most of the design elements — focus only on the main
functionality of the feed."_

---

## Tech stack

- **Frontend** — Next.js 16 (App Router, React 19, TypeScript), TanStack Query for data fetching /
  optimistic updates. The provided `bootstrap/common/main/responsive` CSS is reused verbatim; the
  HTML is ported to JSX with the original class names (design system not rebuilt).
- **Backend** — NestJS 11 (TypeScript), Passport-JWT, class-validator, Helmet, rate limiting.
- **Database** — PostgreSQL + Prisma ORM.
- **Auth** — JWT signed server-side, delivered in an `httpOnly` `SameSite` cookie; bcrypt hashing.
- **Images** — Cloudflare R2 (S3-compatible) via presigned PUT uploads.

---

## Architecture & key decisions

- **Two apps, one repo.** `web/` (Next.js) and `api/` (NestJS) are independent apps (each with its
  own `package.json`) so they deploy separately and cleanly. A thin root `package.json` runs both.
- **Same-origin cookie via proxy.** `web/next.config.ts` rewrites `/api/*` to the NestJS server, so
  the browser only ever talks to the web origin. The auth cookie is first-party (`SameSite=Lax`) —
  no CORS dance, no `SameSite=None`. (CORS + `SameSite=None;Secure` is the documented fallback for a
  split-domain deployment.)
- **Replies = self-referential `Comment.parentId`.** One table, one like path, one create path —
  covers comments and replies. The API rejects replies-to-replies to keep the model 1 level deep.
- **Likes = two typed tables** (`PostLike`, `CommentLike`) rather than one polymorphic table, so
  every like has a real foreign key + `ON DELETE CASCADE` and a composite-unique that makes the
  toggle idempotent (no double-likes). `CommentLike` covers both comments and replies.
- **Denormalized counters.** `Post.likeCount / commentCount` and `Comment.likeCount` are maintained
  inside the same transaction as the like/comment insert/delete, so the feed never runs `COUNT(*)`.
- **Keyset (cursor) pagination** on `(createdAt desc, id desc)` for the feed, comments, replies and
  who-liked lists — constant-time deep paging at scale. Indexes back every hot path (see
  `api/prisma/schema.prisma`).

### Repo layout

```
buddy-script/
├─ package.json            # root dev runner (concurrently)
├─ docker-compose.yml      # local Postgres
├─ .env.example            # documents every env var
├─ web/                    # Next.js (App Router)
│  ├─ app/                 # (auth)/login, (auth)/register, feed, layout, page
│  ├─ components/          # auth, layout (Header), feed (composer, card, comments…)
│  ├─ lib/                 # api client, server api, types, format, useLike
│  ├─ proxy.ts             # guards /feed (Next 16 renamed middleware → proxy)
│  └─ public/assets/       # the provided CSS / images / fonts (copied verbatim)
└─ api/                    # NestJS
   ├─ prisma/schema.prisma # data model + indexes
   ├─ prisma/seed.ts       # demo users + posts
   └─ src/                 # prisma, auth, posts, comments, likes, uploads
```

---

## Quick start (local)

**Prerequisites:** Node 20+, Docker (for Postgres). npm.

```bash
# 1. Install dependencies for both apps + the root runner
npm run install:all
npm install                 # root (concurrently)

# 2. Start Postgres
npm run db:up               # docker compose up -d

# 3. Configure env (defaults already work for local dev)
cp .env.example api/.env            # DATABASE_URL points at the docker Postgres
cp .env.example web/.env.local      # only API_URL is read here
#   ...then edit api/.env: set a JWT_SECRET, and R2_* if you want image uploads.

# 4. Create the schema + seed demo data
npm run db:migrate          # prisma migrate dev
npm run db:seed             # 3 demo users + posts (password: Password123)

# 5. Run both apps
npm run dev                 # api on :4000, web on :3000
```

Open **http://localhost:3000**, log in with `alice@buddy.dev` / `Password123`.

> `.env.example` is a single file with an **API** block (copy to `api/.env`) and a **WEB** block
> (copy to `web/.env.local`). Text-only posts work without R2; image posts require the `R2_*` vars.

---

## API reference

All routes are under `/api`. Every route except register/login/logout requires the auth cookie.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create account, set cookie |
| POST | `/auth/login` | Log in, set cookie |
| POST | `/auth/logout` | Clear cookie |
| GET | `/auth/me` | Current user |
| GET | `/posts?cursor&limit` | Feed (public + own private), newest-first, cursor paginated |
| POST | `/posts` | Create post (`content` and/or `imageUrl`, `visibility`) |
| GET | `/posts/:id` | Single post (404 if private and not author) |
| PATCH | `/posts/:id` | Update own post (content / visibility) |
| DELETE | `/posts/:id` | Delete own post |
| GET | `/posts/:id/likers?cursor` | Who liked a post |
| POST | `/posts/:id/like` | Toggle post like → `{ liked, likeCount }` |
| GET | `/posts/:id/comments?cursor` | Top-level comments |
| POST | `/posts/:id/comments` | Comment (`parentId` set → reply) |
| GET | `/comments/:id/replies?cursor` | Replies of a comment |
| GET | `/comments/:id/likers?cursor` | Who liked a comment/reply |
| POST | `/comments/:id/like` | Toggle comment/reply like |
| POST | `/uploads/presign` | Presigned R2 PUT URL for a post image |

---

## Security

- Passwords hashed with **bcrypt** (cost 12); the hash is never selected into any response.
- **JWT** in an `httpOnly`, `Secure` (prod), `SameSite` cookie — not readable by JS (XSS-safe token).
- Login returns a generic `Invalid credentials` for both unknown-email and wrong-password, and runs
  a bcrypt compare on the unknown-email path too (anti-enumeration / timing).
- **Input validation** via `class-validator` DTOs + a global `ValidationPipe` (`whitelist`,
  `forbidNonWhitelisted`).
- **SQL injection** — Prisma parameterizes all queries. **XSS** — React escapes all user content.
- **Rate limiting** (`@nestjs/throttler`) globally, with a stricter limit on `/auth/*`.
- **Helmet** security headers. **Authorization** — ownership checked server-side for update/delete;
  private posts filtered in the feed query and re-checked on direct fetch.
- **CSRF** — mitigated by `SameSite` + JSON-only requests (add a double-submit token for a
  split-domain deployment).

---

## Performance / scale

- Keyset cursor pagination everywhere (no `OFFSET`, no full-table `COUNT`).
- Composite indexes for each hot path — feed `(visibility, createdAt, id)`, comments
  `(postId, parentId, createdAt)`, likes composite-unique + `(target, createdAt)`.
- Denormalized like/comment counters read O(1) with each row.
- `likedByMe` for a feed page is resolved with a single batched query (no N+1).
- On serverless Postgres (e.g. Neon) use the **pooled** connection string.

---

## Testing

```bash
cd api && npm test          # unit tests (pagination helpers)
```

The API was verified end-to-end (auth + cookie, validation, feed pagination, post CRUD, like
idempotency, comments/replies with depth guard, who-liked, and private-post isolation).

---

## Deployment

Recommended split:

- **web** → Vercel. Set `API_URL` to the deployed API URL. The `rewrites` proxy keeps cookies
  first-party. (Alternatively serve both behind one domain.)
- **api** → Render / Railway / Fly (long-running Node service). Build `npm run build`, start
  `npm run start:prod`. Run `npm run prisma:deploy` on release.
- **db** → Neon / Railway / Supabase Postgres (use the pooled URL).
- **images** → a Cloudflare R2 bucket with public access; set the `R2_*` env vars.

Set `COOKIE_SECURE=true` in production. For a split-domain deploy (web and api on different
domains), set `COOKIE_SAMESITE=none` and confirm `WEB_ORIGIN` for CORS.

---

## Deliverables

- ✅ GitHub repository (this repo)
- ✅ Documentation (this README + inline comments + the plan)
- ⬜ Video walkthrough (YouTube, unlisted) — _add link here_
- ⬜ Live deployment — _add link here_

## Intentional deviations from the mockup (spec-driven)

- Added **first name + last name** inputs to the registration form (required; absent in the mockup).
- Added a **Public/Private** selector to the post composer (required; absent in the mockup).
- Implemented a single **like/unlike** instead of multi-emoji reactions (spec says like/unlike).
- The Bootstrap JS bundle is not shipped; interactive bits use React state instead.
