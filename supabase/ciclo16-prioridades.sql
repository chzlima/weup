-- WeUp! · 0.4 · Prioridades do dia
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.

-- O registro de cada dia (daily_checkins) passa a guardar também as até 3 prioridades escolhidas, em ordem.
-- São só referências às tarefas da própria pessoa; amanhã começa com a lista vazia.
alter table public.daily_checkins add column if not exists prioridades uuid[] not null default '{}';

do $$ begin
  alter table public.daily_checkins add constraint daily_checkins_ate_3_prioridades
    check (cardinality(prioridades) <= 3);
exception when duplicate_object then null;
end $$;

-- Dá para escolher prioridades sem responder o check-in de energia: a energia passa a ser opcional.
alter table public.daily_checkins alter column energia drop not null;
