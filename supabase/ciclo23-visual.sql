-- WeUp! · Pet Rework · Ciclo 7: visual do pet (chapéu, acessório e efeito)
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- Cada item se desbloqueia por uma memória do diário (ex.: "Laço 2", "Nível 10", "Primeiro hábito").
-- Não existe loja nem moeda, e nada dá vantagem de produtividade.
-- Sem tabela nova: o que está desbloqueado é calculado a partir de pet_memories.

alter table public.user_pets add column if not exists chapeu text;
alter table public.user_pets add column if not exists acessorio text;
alter table public.user_pets add column if not exists efeito text;

-- Catálogo: espaço de cada item e a memória que o desbloqueia (igual a src/pets/visual.ts).
create or replace function public.item_do_pet(p_item text) returns table (espaco text, memoria text)
language sql immutable as $$
  select c.espaco, c.memoria from (values
    ('boina', 'chapeu', 'pet'),
    ('coroa_folhas', 'chapeu', 'laco_2'),
    ('capelo', 'chapeu', 'nivel_10'),
    ('coroa', 'chapeu', 'evolucao_4'),
    ('estetoscopio', 'acessorio', 'primeira_tarefa'),
    ('flor', 'acessorio', 'primeira_habito'),
    ('laco_fita', 'acessorio', 'laco_3'),
    ('medalha', 'acessorio', 'xp_1000'),
    ('brilhos', 'efeito', 'nivel_5'),
    ('vagalumes', 'efeito', 'revisao_1'),
    ('estrelas', 'efeito', 'recomeco_1'),
    ('coracoes', 'efeito', 'laco_4')
  ) as c(item, espaco, memoria)
  where c.item = p_item
$$;

-- O app só pode vestir o pet com itens já desbloqueados, cada um no seu espaço.
create or replace function public.conferir_visual_do_pet() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  espaco_item text;
  memoria_item text;
  coluna text;
  item text;
begin
  foreach coluna in array array['chapeu', 'acessorio', 'efeito'] loop
    item := case coluna when 'chapeu' then new.chapeu when 'acessorio' then new.acessorio else new.efeito end;
    continue when item is null;
    espaco_item := null; -- item desconhecido não pode herdar o resultado do espaço anterior
    memoria_item := null;
    select espaco, memoria into espaco_item, memoria_item from item_do_pet(item);
    if espaco_item is null or espaco_item <> coluna then
      raise exception 'Esse item não serve aí.';
    end if;
    if not exists (select 1 from pet_memories where user_id = new.user_id and chave = memoria_item) then
      raise exception 'Esse item ainda não foi desbloqueado.';
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists conferir_visual_do_pet on public.user_pets;
create trigger conferir_visual_do_pet before update of chapeu, acessorio, efeito on public.user_pets
  for each row execute function public.conferir_visual_do_pet();

grant update (chapeu, acessorio, efeito) on public.user_pets to authenticated;
