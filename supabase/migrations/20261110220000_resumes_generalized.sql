-- Generalized resumes: day / week / month × global or pillar scope.
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_type text not null check (period_type in ('day', 'week', 'month')),
  period_start text not null,
  scope text not null,
  narrative text not null,
  audio_base64 text,
  finalized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, period_type, period_start, scope)
);

create index if not exists resumes_user_period_idx on public.resumes (user_id, period_type, period_start);

alter table public.resumes enable row level security;

drop policy if exists "resumes_v2_select_own" on public.resumes;
drop policy if exists "resumes_v2_insert_own" on public.resumes;
drop policy if exists "resumes_v2_update_own" on public.resumes;

create policy "resumes_v2_select_own" on public.resumes for select using (auth.uid() = user_id);
create policy "resumes_v2_insert_own" on public.resumes for insert with check (auth.uid() = user_id);
create policy "resumes_v2_update_own" on public.resumes for update using (auth.uid() = user_id);

-- Backfill weekly summaries (period_start keeps legacy week_id; app also reads weekly_resumes).
insert into public.resumes (user_id, period_type, period_start, scope, narrative, audio_base64, finalized_at, created_at)
select user_id, 'week', week_id, 'global', narrative, audio_base64, created_at, created_at
from public.weekly_resumes
on conflict (user_id, period_type, period_start, scope) do nothing;
