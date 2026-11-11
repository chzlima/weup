-- WeUp! · Ciclo 7 · Timer de foco
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam regras e gatilhos; nenhum dado é apagado.)
--
-- Como o XP do foco é protegido: o horário de início é marcado PELO BANCO, e a sessão só pode ser
-- concluída (e dar XP) depois que o tempo escolhido passou de verdade. Não dá para "fingir" 25 minutos.

-- ============ 1. Sessões de foco ============

create table if not exists public.focus_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  minutos      smallint not null check (minutos in (15, 25, 50)),
  task_id      uuid references public.tasks (id) on delete set null,  -- no que a pessoa focou (opcional)
  inicio       timestamptz not null default now(),
  concluida_em timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists focus_user_idx on public.focus_sessions (user_id, inicio);

alter table public.focus_sessions enable row level security;

drop policy if exists "ver as proprias sessoes" on public.focus_sessions;
create policy "ver as proprias sessoes" on public.focus_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "iniciar sessao" on public.focus_sessions;
create policy "iniciar sessao" on public.focus_sessions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid())))
  );

-- Desistir = apagar a sessão em andamento (sem punição). Sessões concluídas ficam.
drop policy if exists "desistir da sessao" on public.focus_sessions;
create policy "desistir da sessao" on public.focus_sessions
  for delete to authenticated
  using (user_id = (select auth.uid()) and concluida_em is null);

revoke update on public.focus_sessions from anon, authenticated;
grant select, insert, delete on public.focus_sessions to authenticated;

-- O início é sempre "agora" (do relógio do banco), e ninguém cria sessão já concluída.
create or replace function public.foco_inicio_agora() returns trigger
language plpgsql as $$
begin
  new.inicio := now();
  new.concluida_em := null;
  return new;
end $$;

drop trigger if exists foco_inicio_agora on public.focus_sessions;
create trigger foco_inicio_agora before insert on public.focus_sessions
  for each row execute function public.foco_inicio_agora();

-- ============ 2. XP do foco ============

-- Novo tipo de XP: 'foco' (10 XP, até 8 sessões por dia).
alter table public.xp_transactions drop constraint if exists xp_transactions_tipo_check;
alter table public.xp_transactions add constraint xp_transactions_tipo_check
  check (tipo in ('tarefa_pequena', 'tarefa_media', 'tarefa_complexa', 'etapa', 'habito', 'projeto', 'foco'));

create or replace function public.conceder_xp(
  p_user uuid, p_tipo text, p_origem uuid, p_descricao text, p_atributo text, p_dia date
) returns void
language plpgsql security definer set search_path = public as $$
declare
  valor  int := case p_tipo when 'tarefa_pequena' then 5 when 'tarefa_media' then 15 when 'tarefa_complexa' then 30
                            when 'etapa' then 25 when 'habito' then 10 when 'projeto' then 60 when 'foco' then 10 end;
  limite int := case p_tipo when 'tarefa_pequena' then 10 when 'tarefa_media' then 6 when 'tarefa_complexa' then 3
                            when 'etapa' then 4 when 'habito' then 10 when 'projeto' then 2 when 'foco' then 8 end;
  usados int;
begin
  select count(*) into usados
  from xp_transactions
  where user_id = p_user and tipo = p_tipo and dia = p_dia and estornado_em is null and not limitado;

  insert into xp_transactions (user_id, tipo, origem_id, descricao, atributo, dia, xp, limitado)
  values (p_user, p_tipo, p_origem, p_descricao, p_atributo, p_dia,
          case when usados >= limite then 0 else valor end, usados >= limite);
end $$;

revoke execute on function public.conceder_xp(uuid, text, uuid, text, text, date) from public, anon, authenticated;

-- Concluir a sessão: só funciona se o tempo escolhido já passou (com 30 s de folga para diferenças de relógio).
-- Devolve o XP ganho (0 se passou do limite diário ou se já estava concluída).
create or replace function public.concluir_foco(p_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare
  s  focus_sessions%rowtype;
  v_titulo    text;
  v_categoria text;
  ganho int;
begin
  select * into s from focus_sessions where id = p_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Sessão de foco não encontrada.';
  end if;
  if s.concluida_em is not null then
    return 0;
  end if;
  if now() < s.inicio + make_interval(mins => s.minutos) - interval '30 seconds' then
    raise exception 'A sessão ainda não terminou.';
  end if;

  update focus_sessions set concluida_em = now() where id = p_id;

  select titulo, categoria into v_titulo, v_categoria from tasks where id = s.task_id;
  perform conceder_xp(
    s.user_id, 'foco', s.id,
    coalesce('Foco: ' || v_titulo, 'Sessão de foco') || ' (' || s.minutos || ' min)',
    coalesce(atributo_da_categoria(v_categoria), 'conhecimento'),
    hoje_br());

  select xp into ganho from xp_transactions where origem_id = p_id order by created_at desc limit 1;
  return coalesce(ganho, 0);
end $$;

revoke execute on function public.concluir_foco(uuid) from public, anon;
grant execute on function public.concluir_foco(uuid) to authenticated;
