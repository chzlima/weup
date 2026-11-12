-- WeUp! · Pet Rework · Ciclo 1: fundação segura
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- O que muda:
--   1. O banco passa a saber o nível de cada pessoa (mesma curva do app).
--   2. O estágio do pet passa a ser decidido SÓ pelo banco, a partir do XP de verdade.
--      Antes o app gravava o estágio direto e dava para pular etapas.
--   3. O pet passa a ter 5 estágios: níveis 1, 5, 10 (como antes), 15 e 25.

-- 1. Curva de nível (igual a src/lib/xp.ts): XP para sair do nível n = 30 · n^1,5, arredondado de 5 em 5.
create or replace function public.nivel_do_xp(p_total integer) returns integer
language plpgsql immutable as $$
declare
  n     integer := 1;
  resto integer := greatest(coalesce(p_total, 0), 0);
  custo integer;
begin
  loop
    custo := round((30 * power(n, 1.5) / 5)::numeric)::integer * 5;
    exit when resto < custo;
    resto := resto - custo;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Estágio do pet para um nível (igual a NIVEL_DO_ESTAGIO em src/lib/pets.ts).
create or replace function public.estagio_do_nivel(p_nivel integer) returns smallint
language sql immutable as $$
  select case
    when p_nivel >= 25 then 5
    when p_nivel >= 15 then 4
    when p_nivel >= 10 then 3
    when p_nivel >= 5 then 2
    else 1
  end::smallint
$$;

-- 2. Cinco estágios.
alter table public.user_pets drop constraint if exists user_pets_estagio_check;
alter table public.user_pets add constraint user_pets_estagio_check check (estagio between 1 and 5);

-- 3. O app só pode escolher espécie e nome. O estágio fica com o banco.
revoke insert, update on public.user_pets from authenticated;
grant insert (especie, nome) on public.user_pets to authenticated;
grant update (especie, nome) on public.user_pets to authenticated;

-- Sobe o estágio do pet conforme o XP de verdade (nunca baixa). Devolve o estágio atual (ou nada, se ainda não há pet).
-- Pode ser chamada quantas vezes for: só muda algo quando há evolução a fazer.
create or replace function public.sincronizar_pet() returns smallint
language plpgsql security definer set search_path = public as $$
declare
  eu    uuid := auth.uid();
  total integer;
  alvo  smallint;
  atual smallint;
begin
  if eu is null then
    return null;
  end if;
  select coalesce(sum(xp), 0) into total from xp_transactions where user_id = eu and estornado_em is null;
  alvo := estagio_do_nivel(nivel_do_xp(total));
  update user_pets set estagio = greatest(estagio, alvo) where user_id = eu returning estagio into atual;
  return atual;
end $$;

revoke execute on function public.sincronizar_pet() from public, anon;
grant execute on function public.sincronizar_pet() to authenticated;
