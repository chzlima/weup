-- WeUp! · Pet Rework · Ciclo 6: diário de memórias
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- O diário guarda os marcos da jornada, cada um uma vez só e com a data real:
-- pet escolhido, primeiras vezes, marcos de XP, níveis, evoluções, primeira revisão,
-- primeiro recomeço, níveis de laço e o caminho escolhido.
-- Só o banco cria memórias (a partir dos dados de verdade); o app só lê. É privado: ninguém mais vê.

create table if not exists public.pet_memories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chave      text not null check (char_length(chave) between 1 and 60),
  tipo       text not null check (tipo in ('pet', 'primeira', 'xp', 'nivel', 'evolucao', 'revisao', 'recomeco', 'laco', 'caminho')),
  dia        date not null,
  valor      integer,
  extra      text check (char_length(extra) <= 60),
  created_at timestamptz not null default now(),
  unique (user_id, chave)
);

alter table public.pet_memories enable row level security;

drop policy if exists "memorias do proprio usuario" on public.pet_memories;
create policy "memorias do proprio usuario" on public.pet_memories
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.pet_memories from anon, authenticated;
grant select on public.pet_memories to authenticated;

-- XP total para chegar a um nível (mesma curva de nivel_do_xp e de src/lib/xp.ts).
create or replace function public.xp_ate_nivel(p_nivel integer) returns integer
language sql immutable as $$
  select coalesce(sum(round((30 * power(n, 1.5) / 5)::numeric)::integer * 5), 0)::integer
  from generate_series(1, p_nivel - 1) as n
$$;

-- Cria as memórias que faltam para a pessoa logada, olhando o histórico. Devolve quantas criou.
-- Pode ser chamada quantas vezes for: uma memória nunca é criada duas vezes.
create or replace function public.registrar_memorias() returns integer
language plpgsql security definer set search_path = public as $$
declare
  eu uuid := auth.uid();
  n  integer := 0;
  k  integer;
begin
  if eu is null then
    return 0;
  end if;

  -- Vocês se conheceram
  insert into pet_memories (user_id, chave, tipo, dia)
  select eu, 'pet', 'pet', (created_at at time zone 'America/Sao_Paulo')::date from user_pets where user_id = eu
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- Primeiras vezes (pelo livro-razão: vale mesmo se a tarefa foi apagada depois)
  insert into pet_memories (user_id, chave, tipo, dia, extra)
  select eu, 'primeira_' || grupo, 'primeira', min(dia), grupo
  from (
    select dia,
           case when tipo in ('tarefa_pequena', 'tarefa_media', 'tarefa_complexa', 'etapa') then 'tarefa' else tipo end as grupo
    from xp_transactions
    where user_id = eu and estornado_em is null
  ) x
  where grupo in ('tarefa', 'habito', 'foco', 'projeto')
  group by grupo
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- Marcos de XP, níveis e evoluções: o primeiro dia em que o XP acumulado chegou lá
  with dias as (
    select dia, sum(xp) as xp from xp_transactions where user_id = eu and estornado_em is null group by dia
  ),
  acum as (select dia, sum(xp) over (order by dia) as total from dias),
  marcos as (
    select 'xp_' || m as chave, 'xp' as tipo, m as valor, m as alvo from unnest(array[1000, 5000, 10000, 25000]) as m
    union all
    select 'nivel_' || v, 'nivel', v, xp_ate_nivel(v) from unnest(array[5, 10, 15, 20, 25]) as v
    union all
    select 'evolucao_' || e, 'evolucao', e, xp_ate_nivel(v)
    from unnest(array[2, 3, 4, 5], array[5, 10, 15, 25]) as t(e, v)
  )
  insert into pet_memories (user_id, chave, tipo, dia, valor)
  select eu, m.chave, m.tipo, (select min(a.dia) from acum a where a.total >= m.alvo), m.valor
  from marcos m
  where exists (select 1 from acum a where a.total >= m.alvo)
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- Primeira revisão da semana com alguma resposta
  insert into pet_memories (user_id, chave, tipo, dia)
  select eu, 'revisao_1', 'revisao', min((created_at at time zone 'America/Sao_Paulo')::date)
  from weekly_reviews
  where user_id = eu and coalesce(avancou, travou, muda, prioridades) is not null
  having count(*) > 0
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- Primeiro recomeço (coragem)
  insert into pet_memories (user_id, chave, tipo, dia)
  select eu, 'recomeco_1', 'recomeco', min((created_at at time zone 'America/Sao_Paulo')::date)
  from restarts
  where user_id = eu
  having count(*) > 0
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- Níveis de laço (mesma conta de laco_do_pet, dia a dia)
  with acoes as (
    select dia, count(*) as q from xp_transactions where user_id = eu and estornado_em is null group by dia
  ),
  cuidados as (select dia from daily_checkins where user_id = eu and cuidou_do_pet),
  pontos as (
    select coalesce(a.dia, c.dia) as dia,
           (case when a.dia is not null then 1 else 0 end)
         + (case when a.q >= 3 then 1 else 0 end)
         + (case when c.dia is not null then 1 else 0 end) as p
    from acoes a full join cuidados c on a.dia = c.dia
  ),
  acum as (select dia, sum(p) over (order by dia) as total from pontos),
  niveis as (
    select minimo, (ordem + 1)::integer as nivel
    from unnest(array[7, 20, 40, 70, 110, 160, 220, 300, 400]) with ordinality as t(minimo, ordem)
  )
  insert into pet_memories (user_id, chave, tipo, dia, valor)
  select eu, 'laco_' || nv.nivel, 'laco', (select min(a.dia) from acum a where a.total >= nv.minimo), nv.nivel
  from niveis nv
  where exists (select 1 from acum a where a.total >= nv.minimo)
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- Caminho escolhido (a data exata é gravada na hora da escolha; aqui só cobre quem escolheu antes deste ciclo)
  insert into pet_memories (user_id, chave, tipo, dia, extra)
  select eu, 'caminho', 'caminho', hoje_br(), caminho from user_pets where user_id = eu and caminho is not null
  on conflict (user_id, chave) do nothing;
  get diagnostics k = row_count; n := n + k;

  return n;
end $$;

revoke execute on function public.registrar_memorias() from public, anon;
grant execute on function public.registrar_memorias() to authenticated;

-- A escolha do caminho passa a virar memória na hora, com a data certa.
create or replace function public.escolher_caminho(p_caminho text) returns text
language plpgsql security definer set search_path = public as $$
declare
  p user_pets%rowtype;
begin
  if p_caminho not in ('conhecimento', 'saude', 'organizacao') then
    raise exception 'Caminho desconhecido.';
  end if;
  select * into p from user_pets where user_id = auth.uid() for update;
  if not found then
    raise exception 'Escolha um companheiro primeiro.';
  end if;
  if p.estagio < 4 then
    raise exception 'O caminho se abre no estágio 4.';
  end if;
  if p.caminho is not null then
    return p.caminho; -- já escolhido: não muda
  end if;
  update user_pets set caminho = p_caminho where user_id = auth.uid();
  insert into pet_memories (user_id, chave, tipo, dia, extra)
  values (auth.uid(), 'caminho', 'caminho', hoje_br(), p_caminho)
  on conflict (user_id, chave) do nothing;
  return p_caminho;
end $$;
