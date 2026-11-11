-- WeUp! · Ciclo 8 · Modo Recomeçar
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop policy if exists", que só recriam as regras de segurança; nenhum dado é apagado.)

-- Cada vez que a pessoa retomou o ritmo pelo Modo Recomeçar (fez a primeira ação pequena).
-- Aparece sempre como conquista ("Recomeços"), nunca como métrica de fracasso.
create table if not exists public.restarts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  motivo     text not null check (motivo in ('cansaco', 'excesso', 'motivacao', 'outro')),
  created_at timestamptz not null default now()
);

create index if not exists restarts_user_idx on public.restarts (user_id);

alter table public.restarts enable row level security;

drop policy if exists "recomecos do proprio usuario" on public.restarts;
create policy "recomecos do proprio usuario" on public.restarts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert on public.restarts to authenticated;
