-- WeUp! · Pet Rework · Ciclo 5: caminhos de evolução
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- No estágio 4 (nível 15) o pet segue um de três caminhos, um por atributo do XP:
-- conhecimento, saúde ou organização. A pessoa escolhe (o app sugere o atributo em que ela mais evoluiu).
-- A escolha é feita uma vez só e vale também para a forma lendária (estágio 5).

alter table public.user_pets add column if not exists caminho text
  check (caminho is null or caminho in ('conhecimento', 'saude', 'organizacao'));

-- O app não grava o caminho direto (a permissão de alterar continua só para espécie e nome):
-- a escolha passa por esta função, que confere o estágio e se já não foi escolhido.
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
  return p_caminho;
end $$;

revoke execute on function public.escolher_caminho(text) from public, anon;
grant execute on function public.escolher_caminho(text) to authenticated;
