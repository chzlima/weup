-- WeUp! · 0.4 · Lembretes (primeira parte: avisos dentro do app)
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- Compromisso com horário: "avisar X minutos antes" (0 = na hora).
-- Tarefa com dia: "lembrar às HH:MM" nesse dia.
-- Nesta parte o aviso aparece com o app aberto (na tela Hoje e, se a pessoa permitir, como aviso do sistema).
-- As notificações com o app fechado vêm na segunda parte.
-- Sem tabela nova: são colunas em events e tasks, já cobertas por isolamento, backup e "Baixar meus dados".

alter table public.events add column if not exists lembrete_min smallint;
do $$ begin
  alter table public.events add constraint events_lembrete_min_valido check (lembrete_min between 0 and 1440);
exception when duplicate_object then null; end $$;

alter table public.tasks add column if not exists lembrete time;
