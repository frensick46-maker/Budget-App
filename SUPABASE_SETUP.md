# Supabase Setup

## 1) Create project + enable email auth
- Create a Supabase project.
- In Authentication → Providers, enable Email/Password.

## 2) Create table + policies
Run this SQL in the Supabase SQL editor:

```sql
create table public.budget_state (
  user_id uuid primary key references auth.users on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.budget_state enable row level security;

create policy "Users can read their budget state"
  on public.budget_state
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their budget state"
  on public.budget_state
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their budget state"
  on public.budget_state
  for update
  using (auth.uid() = user_id);
```

## 3) Add environment variables
Create `.env` in the project root (or fill in the existing one) with:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4) Start the app
`npm run dev`
