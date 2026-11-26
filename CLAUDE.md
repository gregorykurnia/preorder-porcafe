# Porcafe Christmas bazaar preorders

A small preorder app for a Christmas bazaar. Customers order from the menu, pick a pickup day and slot, and pay by transfer or QRIS. Staff see and filter orders and mark them paid. A light build (owner, 2026-11-26): one plan, `docs/plan.md`, no design directions or autorun. Read it before working.

## Stack
Next.js (App Router) + TypeScript, Neon Postgres via Drizzle, Server Actions + Zod, Tailwind. Hosted on Vercel. This Next.js version differs from older ones: read `node_modules/next/dist/docs/` before writing Next.js code.

## Non-negotiables
- Secrets live in `.env.local` / `.env.test` (gitignored). Never print, commit or copy connection strings or the staff password into docs.
- Tests that write run against the Neon `test` branch, never `production`.
- Don't add features beyond `docs/plan.md` without asking. Ideas go to the owner first.

## Branches: work goes to `staging`, releases go to `main`
- `main` is production: Vercel deploys every push to `main`. It only moves in a **release**, when the owner says "release", "ship it", "go live" or "push to main". Never commit on `main`.
- `staging` is where finished work collects. Vercel ignores it (`vercel.json`). At the start of every session, check `git branch --show-current` is `staging`, then `git fetch origin` and `git pull --ff-only origin staging` once `origin` exists.

## Commit and push after every change (always automatic)
Commit and push to `staging` after every change, without asking, and say what changed. Until `origin` exists, commit locally.
1. Run `npm run typecheck`, `npx eslint <changed files>` and related unit tests (`npx vitest related <changed files> --run`). Run the e2e spec (`npm run test:e2e`) when the change adds or reworks a flow (ordering, staff filters, marking paid). Once per task, before its last commit, run `npm test` and `npm run build`. Never commit a change that breaks a check. Docs-only changes skip the checks.
2. Stage only your files with `git add <paths>`. Never stage `.env*`, `screenshots/`, `.vercel/`, `node_modules/`, `test-results/`, `playwright-report/`.
3. Commit to `staging` with a message saying what and why, ending with the `Co-Authored-By` line for the model.
4. `git push origin staging`.
5. Tell the owner the files, what changed, the commit hash, and which page to look at.

Never force-push or rewrite published history.

## Releasing to production (only when the owner asks)
1. `git fetch origin`, `git pull --ff-only origin staging`, show `git log --oneline origin/main..origin/staging` in plain words.
2. Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`. A failure stops the release.
3. A production migration needs the owner's yes first (`npm run db:migrate`), and runs before the code is released.
4. Push with exactly `git push origin staging:main`. If blocked, give the owner the command with `!` in front and say the allow rule is missing on this machine.
5. Check the Vercel production deployment succeeded and the live URL loads; tell the owner the URL and what changed.
- **"Release now":** light checks and the build only, then push; say the full checks are still owed. A migration or new save/load code takes a normal release.

## Previews
- `npm run dev`: http://localhost:3000.
- `npm run preview`: production build on port 3000, reachable from a phone on the same network.
- `npm run preview:share`: temporary public `trycloudflare.com` link while `preview` runs. Stop it when done.
- Stop every server you started when done; never kill servers by name.
