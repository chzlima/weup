-- WeUp! · 0.5 · Ciclo 1: motor de XP auditável
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)
--
-- O que muda:
--   1. As regras de XP (quanto vale cada ação e o limite por dia) saem do código da função e viram uma tabela,
--      xp_regras, que o app também lê para explicar "por que ganhei / por que não ganhei".
--      Os valores são os mesmos de antes (ciclo7): nada muda para quem usa.
--   2. Cada lançamento guarda a versão da regra que valeu (versao_regra), para auditoria.
--   3. Trava no banco contra XP duplicado: a mesma origem (tarefa, registro de hábito, projeto, sessão de foco)
--      só pode ter um ganho ativo. Concluir duas vezes por falha de rede não duplica.
--
-- Política (documentada aqui e no app):
--   • O XP conta no dia em que a ação é feita (horário de Brasília), mesmo que a tarefa fosse de outro dia.
--     Não existe XP retroativo.
--   • Desfazer (desmarcar tarefa ou hábito, reabrir projeto) estorna o ganho; refazer ganha de novo,
--     sempre dentro do limite do dia. Excluir uma tarefa já feita não tira o XP.
--   • Editar, abrir ou duplicar tarefas não dá XP.

-- ============ 1. Regras ============
create table if not exists public.xp_regras (
  tipo          text primary key,
  nome          text not null,
  xp            integer not null check (xp >= 0),
  limite_dia    integer not null check (limite_dia >= 0),
  versao        smallint not null default 1,
  atualizada_em timestamptz not null default now()
);

insert into public.xp_regras (tipo, nome, xp, limite_dia) values
  ('tarefa_pequena',  'Tarefa pequena',    5,  10),
  ('tarefa_media',    'Tarefa média',      15, 6),
  ('tarefa_complexa', 'Tarefa complexa',   30, 3),
  ('etapa',           'Etapa de projeto',  25, 4),
  ('habito',          'Hábito',            10, 10),
  ('projeto',         'Projeto concluído', 60, 2),
  ('foco',            'Sessão de foco',    10, 8)
on conflict (tipo) do nothing;

alter table public.xp_regras enable row level security;
drop policy if exists "regras de xp sao publicas para quem entra" on public.xp_regras;
create policy "regras de xp sao publicas para quem entra" on public.xp_regras
  for select to authenticated using (true);
revoke all on public.xp_regras from anon, authenticated;
grant select on public.xp_regras to authenticated;

-- ============ 2. Versão da regra em cada lançamento ============
alter table public.xp_transactions add column if not exists versao_regra smallint; -- vazio = lançamento de antes deste ciclo

-- ============ 3. Trava contra duplicação ============
create unique index if not exists xp_origem_ativa_idx on public.xp_transactions (origem_id) where estornado_em is null;

-- ============ 4. conceder_xp lê as regras da tabela ============
create or replace function public.conceder_xp(
  p_user uuid, p_tipo text, p_origem uuid, p_descricao text, p_atributo text, p_dia date
) returns void
language plpgsql security definer set search_path = public as $$
declare
  r      xp_regras%rowtype;
  usados int;
begin
  select * into r from xp_regras where tipo = p_tipo;
  if not found then
    raise exception 'Tipo de XP desconhecido: %', p_tipo;
  end if;

  select count(*) into usados
  from xp_transactions
  where user_id = p_user and tipo = p_tipo and dia = p_dia and estornado_em is null and not limitado;

  -- Se a mesma origem já tem um ganho ativo, não faz nada (idempotente).
  insert into xp_transactions (user_id, tipo, origem_id, descricao, atributo, dia, xp, limitado, versao_regra)
  values (p_user, p_tipo, p_origem, p_descricao, p_atributo, p_dia,
          case when usados >= r.limite_dia then 0 else r.xp end, usados >= r.limite_dia, r.versao)
  on conflict (origem_id) where estornado_em is null do nothing;
end $$;

revoke execute on function public.conceder_xp(uuid, text, uuid, text, text, date) from public, anon, authenticated;
