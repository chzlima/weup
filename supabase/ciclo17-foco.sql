-- WeUp! · 0.4 · Foco com pausa, retomada e duração livre
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.

-- Duração livre: de 5 a 120 minutos (antes: só 15, 25 ou 50).
alter table public.focus_sessions drop constraint if exists focus_sessions_minutos_check;
alter table public.focus_sessions add constraint focus_sessions_minutos_check check (minutos between 5 and 120);

-- Pausa: quando a sessão foi pausada (vazio = rodando) e quanto tempo já ficou pausada, somando as pausas.
-- Fica no banco para a sessão continuar certa depois de fechar e abrir o app.
alter table public.focus_sessions add column if not exists pausada_em timestamptz;
alter table public.focus_sessions add column if not exists pausa_segundos integer not null default 0 check (pausa_segundos >= 0);

-- Ao começar, o banco marca o início e zera a pausa (o app não escolhe esses valores).
create or replace function public.foco_inicio_agora() returns trigger
language plpgsql as $$
begin
  new.inicio := now();
  new.concluida_em := null;
  new.pausada_em := null;
  new.pausa_segundos := 0;
  return new;
end $$;

-- Pausar e continuar passam por funções do banco: a pessoa não pode alterar a sessão direto.
create or replace function public.pausar_foco(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from focus_sessions where id = p_id and user_id = auth.uid() and concluida_em is null) then
    raise exception 'Sessão de foco não encontrada.';
  end if;
  update focus_sessions set pausada_em = now()
  where id = p_id and user_id = auth.uid() and pausada_em is null;
end $$;

create or replace function public.retomar_foco(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from focus_sessions where id = p_id and user_id = auth.uid() and concluida_em is null) then
    raise exception 'Sessão de foco não encontrada.';
  end if;
  update focus_sessions
  set pausa_segundos = pausa_segundos + ceil(extract(epoch from now() - pausada_em))::int,
      pausada_em = null
  where id = p_id and user_id = auth.uid() and pausada_em is not null;
end $$;

revoke execute on function public.pausar_foco(uuid) from public, anon;
revoke execute on function public.retomar_foco(uuid) from public, anon;
grant execute on function public.pausar_foco(uuid) to authenticated;
grant execute on function public.retomar_foco(uuid) to authenticated;

-- Concluir: o tempo pausado não conta, sessão pausada não conclui,
-- e só sessões de 15 minutos ou mais valem XP (as curtas ficam registradas, sem XP).
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
  if s.pausada_em is not null then
    raise exception 'A sessão está pausada.';
  end if;
  if now() < s.inicio + make_interval(mins => s.minutos, secs => s.pausa_segundos::double precision) - interval '30 seconds' then
    raise exception 'A sessão ainda não terminou.';
  end if;

  update focus_sessions set concluida_em = now() where id = p_id;

  if s.minutos < 15 then
    return 0;
  end if;

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
