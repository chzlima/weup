-- WeUp! · Ciclo 4 · Hábitos e agenda
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop policy if exists", que só recriam as regras de segurança; nenhum dado é apagado.)

-- HÁBITOS: algo que se repete em certos dias da semana.
create table if not exists public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo     text not null check (char_length(titulo) between 1 and 120),
  categoria  text not null default 'rotina' check (categoria in ('estudo', 'treino', 'rotina')),
  -- dias da semana em que o hábito vale: 0 = domingo … 6 = sábado
  dias       smallint[] not null default '{0,1,2,3,4,5,6}'
             check (cardinality(dias) between 1 and 7 and dias <@ '{0,1,2,3,4,5,6}'::smallint[]),
  created_at timestamptz not null default now()
);

-- REGISTROS: cada dia em que o hábito foi feito (no máximo um por dia).
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  dia        date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, dia)
);

-- COMPROMISSOS: a agenda simples (provas, aulas, consultas…). Não geram XP.
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo     text not null check (char_length(titulo) between 1 and 120),
  data       date not null,
  hora       time,          -- vazio = o dia todo
  created_at timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits (user_id);
create index if not exists habit_logs_user_dia_idx on public.habit_logs (user_id, dia);
create index if not exists events_user_data_idx on public.events (user_id, data);

-- SEGURANÇA (RLS): cada pessoa só vê e mexe nos próprios dados.
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.events enable row level security;

drop policy if exists "habitos do proprio usuario" on public.habits;
create policy "habitos do proprio usuario" on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "registros do proprio usuario" on public.habit_logs;
create policy "registros do proprio usuario" on public.habit_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );

drop policy if exists "compromissos do proprio usuario" on public.events;
create policy "compromissos do proprio usuario" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.habits, public.habit_logs, public.events to authenticated;
