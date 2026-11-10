-- Per-deed duration: canonical seconds + user-facing unit (legacy duration column = rounded minutes).
alter table public.deeds
  add column if not exists duration_seconds integer,
  add column if not exists duration_unit text;

-- Backfill from legacy minutes-only storage.
update public.deeds
set
  duration_seconds = duration * 60,
  duration_unit = coalesce(duration_unit, 'minutes')
where duration is not null
  and duration > 0
  and duration_seconds is null;
