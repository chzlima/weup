-- WeUp! · 0.3 · Tarefas que se repetem
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)

-- Como funciona:
--   • task_series guarda a REGRA ("toda segunda e quarta", "todo dia 5").
--   • No dia em que a regra cai, o app pede ao banco para criar a tarefa daquele dia (gerar_ocorrencias).
--     Essa tarefa é uma tarefa comum: dá para editar, mudar de dia ou apagar só ela, sem mexer na série.
--   • Dias em que o app não foi aberto NÃO geram tarefa: ninguém volta de uma pausa com uma pilha de pendências.
--   • A mesma ocorrência nunca é criada duas vezes, nem com o app aberto em dois aparelhos.

create table if not exists public.task_series (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo      text not null check (char_length(titulo) between 1 and 200),
  dificuldade text not null default 'pequena' check (dificuldade in ('pequena', 'media', 'complexa')),
  categoria   text not null default 'estudo' check (categoria in ('estudo', 'treino', 'rotina')),
  tipo        text not null check (tipo in ('diaria', 'semanal', 'mensal')),
  -- semanal: dias da semana em que cai (0 = domingo … 6 = sábado)
  dias        smallint[] check (dias is null or (cardinality(dias) between 1 and 7 and dias <@ '{0,1,2,3,4,5,6}'::smallint[])),
  -- mensal: dia do mês (31 num mês de 30 dias cai no último dia do mês)
  dia_mes     smallint check (dia_mes is null or dia_mes between 1 and 31),
  inicio      date not null default public.hoje_br(),
  gerado_ate  date,          -- último dia em que o banco já conferiu esta série
  created_at  timestamptz not null default now(),
  check (tipo <> 'semanal' or dias is not null),
  check (tipo <> 'mensal' or dia_mes is not null)
);

create index if not exists task_series_user_idx on public.task_series (user_id);

alter table public.task_series enable row level security;

drop policy if exists "series do proprio usuario" on public.task_series;
create policy "series do proprio usuario" on public.task_series
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.task_series from anon;
grant select, insert, update, delete on public.task_series to authenticated;

-- Cada tarefa gerada lembra de qual série veio e de qual dia é.
-- Apagar a série não apaga as tarefas que já existem (elas só deixam de estar ligadas a ela).
alter table public.tasks add column if not exists series_id uuid references public.task_series (id) on delete set null;
alter table public.tasks add column if not exists ocorrencia date;

-- Trava contra duplicação: uma série só tem uma tarefa por dia.
create unique index if not exists tasks_serie_ocorrencia_idx on public.tasks (series_id, ocorrencia);
create index if not exists tasks_series_idx on public.tasks (series_id);

-- A regra das tarefas ganha uma condição: só dá para ligar uma tarefa a uma série da própria pessoa.
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
  );

-- A série cai neste dia?
create or replace function public.serie_cai_em(p_tipo text, p_dias smallint[], p_dia_mes smallint, p_dia date)
returns boolean language sql immutable set search_path = public as $$
  select case p_tipo
    when 'diaria'  then true
    when 'semanal' then extract(dow from p_dia)::smallint = any (p_dias)
    when 'mensal'  then extract(day from p_dia)::int
                        = least(p_dia_mes::int, extract(day from (date_trunc('month', p_dia) + interval '1 month - 1 day'))::int)
    else false
  end
$$;

-- Cria as tarefas de hoje das séries da pessoa logada. Devolve quantas criou.
-- Roda com as permissões de quem chama: as regras de segurança das tabelas continuam valendo.
create or replace function public.gerar_ocorrencias() returns integer
language plpgsql security invoker set search_path = public as $$
declare
  eu   uuid := auth.uid();
  hoje date := public.hoje_br();
  n    integer;
begin
  if eu is null then
    return 0;
  end if;

  with novas as (
    insert into tasks (user_id, titulo, dificuldade, categoria, data, series_id, ocorrencia)
    select s.user_id, s.titulo, s.dificuldade, s.categoria, hoje, s.id, hoje
    from task_series s
    where s.user_id = eu
      and s.inicio <= hoje
      and (s.gerado_ate is null or s.gerado_ate < hoje)
      and public.serie_cai_em(s.tipo, s.dias, s.dia_mes, hoje)
    on conflict (series_id, ocorrencia) do nothing
    returning 1
  )
  select count(*) into n from novas;

  -- Marca como conferido: se a pessoa apagar a tarefa de hoje, ela não volta.
  update task_series set gerado_ate = hoje
  where user_id = eu and (gerado_ate is null or gerado_ate < hoje);

  return n;
end $$;

revoke execute on function public.gerar_ocorrencias() from public, anon;
grant execute on function public.gerar_ocorrencias() to authenticated;
