-- Safe migration: adds per-pillar duration objectives without touching existing rows.
alter table public.profiles
  add column if not exists duration_objective_per_pillar jsonb not null default '{}';
