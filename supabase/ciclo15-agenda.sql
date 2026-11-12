-- WeUp! · 0.4 · Modelo de agenda
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)

-- Três datas que não se confundem numa tarefa:
--   data          = o dia em que a pessoa PLANEJA fazer (já existia)
--   prazo         = até quando PRECISA estar pronta (novo, opcional)
--   concluida_em  = quando foi feita (já existia)
alter table public.tasks add column if not exists prazo date;

-- Compromissos viram blocos de horário: início (hora), fim (hora_fim) e, opcional, a tarefa que vai ser feita ali.
-- Horários são "do relógio local": 08:00 é 08:00 em qualquer aparelho, sem conversão de fuso.
-- Se o fim for menor que o início, o bloco atravessa a meia-noite (ex.: plantão das 19:00 às 07:00).
alter table public.events add column if not exists hora_fim time;
alter table public.events add column if not exists task_id uuid references public.tasks (id) on delete set null;

do $$ begin
  alter table public.events add constraint events_fim_precisa_inicio
    check (hora_fim is null or (hora is not null and hora_fim <> hora));
exception when duplicate_object then null;
end $$;

create index if not exists events_task_idx on public.events (task_id);

-- A regra dos compromissos ganha uma condição: só dá para ligar um bloco a uma tarefa da própria pessoa.
-- (A função tarefa_e_minha foi criada no ciclo13-revisoes.sql.)
drop policy if exists "compromissos do proprio usuario" on public.events;
create policy "compromissos do proprio usuario" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (task_id is null or public.tarefa_e_minha(task_id)));
