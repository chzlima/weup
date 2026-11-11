-- WeUp! · Ciclo 5 · XP e níveis (Experience Ledger)
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam regras e gatilhos; nenhum dado é apagado.)
--
-- Como funciona: o XP é calculado PELO BANCO, nunca pelo app. Quando uma tarefa é concluída, um hábito
-- é marcado ou um projeto é concluído, um gatilho registra o ganho na tabela xp_transactions.
-- O app só consegue LER essa tabela, então ninguém consegue se dar XP mexendo no app.
--
-- Dia do XP: horário de Brasília (o público inicial é brasileiro).

-- ============ 1. A tabela do registro (ledger) ============

create table if not exists public.xp_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  tipo         text not null check (tipo in ('tarefa_pequena', 'tarefa_media', 'tarefa_complexa', 'etapa', 'habito', 'projeto')),
  origem_id    uuid not null,          -- id da tarefa, do registro de hábito ou do projeto (sem chave estrangeira: o XP fica mesmo se a origem for excluída)
  descricao    text not null,          -- o título na hora do ganho
  atributo     text check (atributo in ('conhecimento', 'saude', 'organizacao')),
  dia          date not null,
  xp           integer not null check (xp >= 0),
  limitado     boolean not null default false,  -- true = passou do limite diário e valeu 0 XP
  estornado_em timestamptz,            -- preenchido quando a ação é desfeita (ex.: desmarcar a tarefa)
  created_at   timestamptz not null default now()
);

create index if not exists xp_user_dia_idx on public.xp_transactions (user_id, dia);
create index if not exists xp_origem_idx on public.xp_transactions (origem_id);

alter table public.xp_transactions enable row level security;

-- Só leitura, e só dos próprios dados. Ninguém escreve aqui pelo app.
drop policy if exists "ler o proprio xp" on public.xp_transactions;
create policy "ler o proprio xp" on public.xp_transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.xp_transactions from anon, authenticated;
grant select on public.xp_transactions to authenticated;

-- Totais por usuário (respeita as regras de segurança de quem consulta).
create or replace view public.xp_resumo with (security_invoker = true) as
select
  user_id,
  coalesce(sum(xp), 0)::int                                          as total,
  coalesce(sum(xp) filter (where atributo = 'conhecimento'), 0)::int as conhecimento,
  coalesce(sum(xp) filter (where atributo = 'saude'), 0)::int        as saude,
  coalesce(sum(xp) filter (where atributo = 'organizacao'), 0)::int  as organizacao
from public.xp_transactions
where estornado_em is null
group by user_id;

grant select on public.xp_resumo to authenticated;

-- ============ 2. Regras de XP ============

-- Dia de hoje no horário de Brasília.
create or replace function public.hoje_br() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- Categoria da tarefa → atributo (automático, decisão da V1.1).
create or replace function public.atributo_da_categoria(categoria text) returns text
language sql immutable as $$
  select case categoria when 'estudo' then 'conhecimento' when 'treino' then 'saude' when 'rotina' then 'organizacao' end
$$;

-- Registra um ganho de XP, respeitando o limite diário por tipo.
-- Valores e limites (por dia):  tipo             XP   limite/dia
--                               tarefa_pequena    5   10
--                               tarefa_media     15    6
--                               tarefa_complexa  30    3
--                               etapa            25    4
--                               habito           10   10
--                               projeto          60    2
create or replace function public.conceder_xp(
  p_user uuid, p_tipo text, p_origem uuid, p_descricao text, p_atributo text, p_dia date
) returns void
language plpgsql security definer set search_path = public as $$
declare
  valor  int := case p_tipo when 'tarefa_pequena' then 5 when 'tarefa_media' then 15 when 'tarefa_complexa' then 30
                            when 'etapa' then 25 when 'habito' then 10 when 'projeto' then 60 end;
  limite int := case p_tipo when 'tarefa_pequena' then 10 when 'tarefa_media' then 6 when 'tarefa_complexa' then 3
                            when 'etapa' then 4 when 'habito' then 10 when 'projeto' then 2 end;
  usados int;
begin
  select count(*) into usados
  from xp_transactions
  where user_id = p_user and tipo = p_tipo and dia = p_dia and estornado_em is null and not limitado;

  insert into xp_transactions (user_id, tipo, origem_id, descricao, atributo, dia, xp, limitado)
  values (p_user, p_tipo, p_origem, p_descricao, p_atributo, p_dia,
          case when usados >= limite then 0 else valor end, usados >= limite);
end $$;

-- Desfaz o ganho mais recente de uma origem (ex.: tarefa desmarcada).
create or replace function public.estornar_xp(p_origem uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update xp_transactions set estornado_em = now()
  where id = (
    select id from xp_transactions
    where origem_id = p_origem and estornado_em is null
    order by created_at desc limit 1
  );
end $$;

-- Ninguém chama essas funções direto pelo app; só os gatilhos abaixo.
revoke execute on function public.conceder_xp(uuid, text, uuid, text, text, date) from public, anon, authenticated;
revoke execute on function public.estornar_xp(uuid) from public, anon, authenticated;

-- ============ 3. Gatilhos ============

-- Tarefas: concluir → ganha; desmarcar → estorna. Excluir uma tarefa feita NÃO tira o XP.
create or replace function public.xp_ao_mudar_tarefa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' or old.concluida_em is null) and new.concluida_em is not null then
    perform conceder_xp(
      new.user_id,
      case when new.project_id is not null then 'etapa' else 'tarefa_' || new.dificuldade end,
      new.id, new.titulo, atributo_da_categoria(new.categoria), hoje_br());
  elsif tg_op = 'UPDATE' and old.concluida_em is not null and new.concluida_em is null then
    perform estornar_xp(new.id);
  end if;
  return null;
end $$;

drop trigger if exists xp_tarefa on public.tasks;
create trigger xp_tarefa after insert or update of concluida_em on public.tasks
  for each row execute function public.xp_ao_mudar_tarefa();

-- Hábitos: marcar o dia → ganha; desmarcar → estorna.
-- Excluir o hábito inteiro NÃO tira o XP que ele já rendeu.
create or replace function public.xp_ao_mudar_registro() returns trigger
language plpgsql security definer set search_path = public as $$
declare h record;
begin
  if tg_op = 'INSERT' then
    select titulo, categoria into h from habits where id = new.habit_id;
    perform conceder_xp(new.user_id, 'habito', new.id, h.titulo, atributo_da_categoria(h.categoria), new.dia);
  elsif tg_op = 'DELETE' then
    -- Só estorna se o hábito ainda existe (ou seja, a pessoa desmarcou o dia, não excluiu o hábito).
    if exists (select 1 from habits where id = old.habit_id) then
      perform estornar_xp(old.id);
    end if;
  end if;
  return null;
end $$;

drop trigger if exists xp_registro on public.habit_logs;
create trigger xp_registro after insert or delete on public.habit_logs
  for each row execute function public.xp_ao_mudar_registro();

-- Projetos: concluir → ganha; reabrir → estorna.
create or replace function public.xp_ao_mudar_projeto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.concluido_em is null and new.concluido_em is not null then
    perform conceder_xp(new.user_id, 'projeto', new.id, new.titulo, null, hoje_br());
  elsif old.concluido_em is not null and new.concluido_em is null then
    perform estornar_xp(new.id);
  end if;
  return null;
end $$;

drop trigger if exists xp_projeto on public.projects;
create trigger xp_projeto after update of concluido_em on public.projects
  for each row execute function public.xp_ao_mudar_projeto();

-- ============ 4. Anti-fraude simples ============

-- Só dá para registrar hábito de até 7 dias atrás (e no máximo amanhã, por causa de fuso).
drop policy if exists "registros do proprio usuario" on public.habit_logs;
create policy "registros do proprio usuario" on public.habit_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and dia between hoje_br() - 7 and hoje_br() + 1
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );

-- ============ 5. XP do que já foi feito antes deste ciclo ============
-- (só entra uma vez: pula o que já está no registro)

insert into public.xp_transactions (user_id, tipo, origem_id, descricao, atributo, dia, xp)
select t.user_id,
       case when t.project_id is not null then 'etapa' else 'tarefa_' || t.dificuldade end,
       t.id, t.titulo, public.atributo_da_categoria(t.categoria),
       (t.concluida_em at time zone 'America/Sao_Paulo')::date,
       case when t.project_id is not null then 25
            else case t.dificuldade when 'pequena' then 5 when 'media' then 15 else 30 end end
from public.tasks t
where t.concluida_em is not null
  and not exists (select 1 from public.xp_transactions x where x.origem_id = t.id);

insert into public.xp_transactions (user_id, tipo, origem_id, descricao, atributo, dia, xp)
select l.user_id, 'habito', l.id, h.titulo, public.atributo_da_categoria(h.categoria), l.dia, 10
from public.habit_logs l join public.habits h on h.id = l.habit_id
where not exists (select 1 from public.xp_transactions x where x.origem_id = l.id);

insert into public.xp_transactions (user_id, tipo, origem_id, descricao, atributo, dia, xp)
select p.user_id, 'projeto', p.id, p.titulo, null, (p.concluido_em at time zone 'America/Sao_Paulo')::date, 60
from public.projects p
where p.concluido_em is not null
  and not exists (select 1 from public.xp_transactions x where x.origem_id = p.id);
