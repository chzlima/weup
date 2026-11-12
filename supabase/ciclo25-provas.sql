-- WeUp! · 0.4 · Modo prova
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)
--
-- A pessoa cadastra a prova (nome e data) e os assuntos. O app distribui uma tarefa de estudo por assunto
-- até a véspera, mais uma revisão geral na véspera, e mostra a contagem regressiva na tela Hoje.
-- As tarefas são tarefas comuns (XP normal, sem bônus) e lembram de qual prova vieram (tasks.exam_id).

create table if not exists public.exams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo     text not null check (char_length(titulo) between 1 and 120),
  data       date not null,
  created_at timestamptz not null default now()
);

create index if not exists exams_user_data_idx on public.exams (user_id, data);

alter table public.exams enable row level security;

drop policy if exists "provas do proprio usuario" on public.exams;
create policy "provas do proprio usuario" on public.exams
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.exams from anon, authenticated;
grant select, insert, update, delete on public.exams to authenticated;

-- Tarefa de estudo de uma prova. Apagar a prova não apaga as tarefas (só perde a ligação):
-- o app apaga antes as que ainda estão abertas, e as concluídas ficam com o XP.
alter table public.tasks add column if not exists exam_id uuid references public.exams (id) on delete set null;
create index if not exists tasks_exam_idx on public.tasks (exam_id);

-- A regra das tarefas ganha mais uma condição: só dá para ligar a tarefa a uma prova da própria pessoa.
-- (Mesma regra do ciclo13-revisoes.sql, com a condição do exam_id no fim.)
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
    and (
      series_id is null
      or exists (select 1 from public.task_series s where s.id = series_id and s.user_id = (select auth.uid()))
    )
    and (revisao_de is null or public.tarefa_e_minha(revisao_de))
    and (
      exam_id is null
      or exists (select 1 from public.exams e where e.id = exam_id and e.user_id = (select auth.uid()))
    )
  );
