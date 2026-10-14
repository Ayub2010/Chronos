create table if not exists public.chronos_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  days jsonb not null default '{}'::jsonb,
  cats jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.chronos_state enable row level security;

create policy "Users can select their own chronos_state"
  on public.chronos_state
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chronos_state"
  on public.chronos_state
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chronos_state"
  on public.chronos_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
