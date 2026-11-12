-- WeUp! · Pet Rework · Ciclo 4: o laço com o pet
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- O laço conta DIAS, não quantidade (assim não dá para "farmar"):
--   +1 por dia com pelo menos uma ação real (tarefa, hábito, foco…, tudo o que passou pelo livro-razão de XP)
--   +1 se nesse dia houve 3 ou mais ações
--   +1 se nesse dia você interagiu com o pet (só conta uma vez por dia)
-- Nunca diminui por descansar. Só deixa de contar uma ação que foi desfeita (tarefa desmarcada).
-- O laço não dá XP nem acelera a evolução: ele desbloqueia interações (e, nos próximos ciclos, visuais).

-- Interação com o pet no dia (fica no registro do dia; sem tabela nova).
alter table public.daily_checkins add column if not exists cuidou_do_pet boolean not null default false;

-- Nível do laço para uma quantidade de pontos (igual a src/pets/laco.ts).
create or replace function public.nivel_do_laco(p_pontos integer) returns integer
language sql immutable as $$
  select count(*)::integer
  from unnest(array[0, 7, 20, 40, 70, 110, 160, 220, 300, 400]) as minimo
  where coalesce(p_pontos, 0) >= minimo
$$;

-- Pontos e nível do laço da pessoa logada. Lê só os dados dela (as regras de segurança valem aqui dentro).
create or replace function public.laco_do_pet() returns table (pontos integer, nivel integer)
language sql stable security invoker set search_path = public as $$
  with acoes as (
    select dia, count(*) as n
    from xp_transactions
    where user_id = auth.uid() and estornado_em is null
    group by dia
  ),
  cuidados as (
    select count(*)::integer as dias from daily_checkins where user_id = auth.uid() and cuidou_do_pet
  ),
  soma as (
    select (select count(*) from acoes)::integer
         + (select count(*) from acoes where n >= 3)::integer
         + (select dias from cuidados) as p
  )
  select p, public.nivel_do_laco(p) from soma
$$;

revoke execute on function public.laco_do_pet() from public, anon;
grant execute on function public.laco_do_pet() to authenticated;
