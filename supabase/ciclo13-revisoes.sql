-- WeUp! · Revisão espaçada
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)

-- Ao concluir uma tarefa de estudo, o app oferece "revisar depois": cria até 3 tarefas de revisão
-- (amanhã, em 7 e em 30 dias). Cada revisão é uma tarefa comum e lembra de qual tarefa veio.
-- Se a tarefa original for apagada, as revisões continuam (só perdem a ligação).
alter table public.tasks add column if not exists revisao_de uuid references public.tasks (id) on delete set null;
alter table public.tasks add column if not exists revisao_n smallint check (revisao_n between 1 and 3);

-- Trava contra duplicação: uma tarefa só tem uma revisão 1, uma revisão 2 e uma revisão 3.
create unique index if not exists tasks_revisao_idx on public.tasks (revisao_de, revisao_n);

-- A tarefa é da pessoa logada? Usada pela regra abaixo. Precisa ser "security definer": uma regra da tabela
-- tasks não pode consultar a própria tasks com as regras ligadas (o banco acusaria repetição infinita).
create or replace function public.tarefa_e_minha(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tasks where id = p_id and user_id = (select auth.uid()))
$$;

revoke execute on function public.tarefa_e_minha(uuid) from public, anon;
grant execute on function public.tarefa_e_minha(uuid) to authenticated;

-- A regra das tarefas ganha mais uma condição: só dá para criar revisão de uma tarefa da própria pessoa.
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
  );
