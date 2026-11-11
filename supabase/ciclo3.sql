-- WeUp! · Ciclo 3 · Tarefas e projetos
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema.

-- PROJETOS: um objetivo maior, dividido em etapas (as etapas são tarefas com project_id).
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo       text not null check (char_length(titulo) between 1 and 120),
  concluido_em timestamptz,
  created_at   timestamptz not null default now()
);

-- TAREFAS: podem existir sozinhas ou pertencer a um projeto (aí viram "etapas").
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  titulo       text not null check (char_length(titulo) between 1 and 200),
  dificuldade  text not null default 'pequena' check (dificuldade in ('pequena', 'media', 'complexa')),
  categoria    text not null default 'estudo' check (categoria in ('estudo', 'treino', 'rotina')),
  data         date,          -- dia planejado (vazio = sem data)
  concluida_em timestamptz,   -- vazio = ainda não feita
  created_at   timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id);
create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists tasks_project_idx on public.tasks (project_id);

-- SEGURANÇA (RLS): cada pessoa só vê e mexe nos próprios dados.
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "projetos do proprio usuario" on public.projects;
create policy "projetos do proprio usuario" on public.projects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "tarefas do proprio usuario" on public.tasks;
create policy "tarefas do proprio usuario" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      project_id is null
      or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
    )
  );

grant select, insert, update, delete on public.projects, public.tasks to authenticated;
