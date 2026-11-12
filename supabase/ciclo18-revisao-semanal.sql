-- WeUp! · 0.4 · Revisão semanal
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)

-- Uma revisão por pessoa por semana (a semana é marcada pela segunda-feira em que começa).
-- Os números da semana (tarefas, hábitos, foco) não são guardados aqui: são calculados na hora a partir dos dados.
-- Aqui ficam só as respostas, todas opcionais.
create table if not exists public.weekly_reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  semana      date not null check (extract(isodow from semana) = 1),
  avancou     text check (char_length(avancou) <= 1000),
  travou      text check (char_length(travou) <= 1000),
  muda        text check (char_length(muda) <= 1000),
  prioridades text check (char_length(prioridades) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, semana)
);

alter table public.weekly_reviews enable row level security;

drop policy if exists "revisoes do proprio usuario" on public.weekly_reviews;
create policy "revisoes do proprio usuario" on public.weekly_reviews
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.weekly_reviews from anon, authenticated;
grant select, insert, update on public.weekly_reviews to authenticated;
