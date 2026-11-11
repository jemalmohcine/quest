alter table public.profiles
  add column if not exists goal_pack_id text check (goal_pack_id in ('essential', 'balanced', 'momentum'));
