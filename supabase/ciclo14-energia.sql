-- WeUp! · Check-in de energia
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)

-- Um toque por dia, opcional: como está a energia hoje (baixa, normal ou alta).
-- Energia baixa faz a tela Hoje virar um "dia leve". Não vale XP.
-- Uma resposta por pessoa por dia; responder de novo troca a resposta.
create table if not exists public.daily_checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia        date not null,
  energia    text not null check (energia in ('baixa', 'normal', 'alta')),
  created_at timestamptz not null default now(),
  unique (user_id, dia)
);

alter table public.daily_checkins enable row level security;

drop policy if exists "checkins do proprio usuario" on public.daily_checkins;
create policy "checkins do proprio usuario" on public.daily_checkins
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.daily_checkins from anon, authenticated;
grant select, insert, update on public.daily_checkins to authenticated;
