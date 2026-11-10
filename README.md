<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Quest

Personal growth PWA — log **deeds** across five pillars, stats, and AI weekly resumes.

**Production:** [https://quest-v0.vercel.app](https://quest-v0.vercel.app)

Supabase project ref: `qssepwnlviiazracsujq`

## Run locally

**Prerequisites:** Node.js 20+

1. `npm install`
2. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_*`, `GEMINI_API_KEY`, `NEXT_PUBLIC_SITE_URL`
3. Apply schema: run `supabase/schema.sql` in the Supabase SQL editor (or use migrations locally)
4. `npm run dev`

## Supabase migrations (CI)

On every push to **`main`**, GitHub Actions runs [`.github/workflows/supabase-migrations.yml`](.github/workflows/supabase-migrations.yml) and applies files under `supabase/migrations/` via `supabase db push --db-url` (CLI **2.67.1**, with `--include-all` when the remote has no migration history yet).

### Required GitHub secret (Actions)

| Secret | Required | Value |
|--------|----------|--------|
| **`SUPABASE_DB_URL`** | Yes | Postgres connection URI for the **production** database (URL-encode the password if it contains special characters). |

**Format example** — session pooler (port **5432**) or direct DB host (replace `[PASSWORD]` from Supabase → Project Settings → Database):

```text
postgresql://postgres.qssepwnlviiazracsujq:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

Direct DB (alternative):

```text
postgresql://postgres:[PASSWORD]@db.qssepwnlviiazracsujq.supabase.co:5432/postgres
```

Do **not** commit this URL. No access token is required when using the full database URL.

Optional: URL-encode special characters in the password (`@`, `#`, etc.).

### Idempotency & baseline

- The CLI tracks applied versions in `supabase_migrations.schema_migrations` and skips migrations already recorded.
- SQL in this repo uses safe patterns (e.g. `ADD COLUMN IF NOT EXISTS`) so a migration can succeed even if someone applied the same change manually before history existed.
- **First-time / legacy DB:** If production was created only from `supabase/schema.sql` and already matches the repo, run the workflow manually (**Actions → Supabase production migrations → Run workflow**) with **baseline repair** checked once. That marks repo migrations as applied **without** running SQL. Only use this when the live schema already includes those changes.
- **Manual run:** `workflow_dispatch` also supports **dry run** (lists pending migrations, no SQL).

Failures exit non-zero; check the Actions log for the exact Postgres error.
