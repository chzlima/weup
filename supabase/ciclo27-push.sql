-- WeUp! · 0.4.1 · Lembretes com o app fechado (notificações push)
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)
--
-- Como funciona:
--   1. No Perfil, a pessoa liga os avisos: o aparelho gera uma inscrição de push, guardada em push_subscriptions.
--   2. A cada minuto, o agendamento (pg_cron) chama a função "enviar-lembretes" (supabase/functions).
--   3. A função pega os lembretes que acabaram de chegar (lembretes_devidos), anota em push_enviados
--      para não mandar duas vezes e envia para os aparelhos da pessoa.
-- O texto do aviso é o mesmo da tela Hoje (src/lib/lembretes.ts), e a "chave" também: o aparelho junta os dois.

-- ---------- Inscrições (uma por aparelho) ----------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique check (endpoint like 'https://%'),
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "inscricoes do proprio usuario" on public.push_subscriptions;
create policy "inscricoes do proprio usuario" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ---------- O que já foi enviado (só o servidor mexe) ----------
create table if not exists public.push_enviados (
  chave      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  enviado_em timestamptz not null default now()
);

alter table public.push_enviados enable row level security; -- sem regra: o app não lê nem grava
revoke all on public.push_enviados from anon, authenticated;

-- ---------- Lembretes que acabaram de chegar (até 15 min atrás), no horário de Brasília ----------
-- Mesma conta de lembretesDoDia (src/lib/lembretes.ts): mesma chave, mesmo texto.
create or replace function public.lembretes_devidos()
returns table (user_id uuid, chave text, titulo text, detalhe text)
language sql stable security definer set search_path = public as $$
  with agora as (select (now() at time zone 'America/Sao_Paulo') as t)
  select e.user_id,
         'c:' || e.id || ':' || e.data || ':' || to_char(e.hora, 'HH24:MI') || ':' || e.lembrete_min,
         e.titulo,
         case when e.lembrete_min = 0 then 'Agora · ' || to_char(e.hora, 'HH24:MI')
              else 'Às ' || to_char(e.hora, 'HH24:MI') || ' · compromisso' end
  from events e, agora
  where e.lembrete_min is not null and e.hora is not null
    and e.data + e.hora - make_interval(mins => e.lembrete_min) between agora.t - interval '15 minutes' and agora.t
  union all
  select t.user_id,
         't:' || t.id || ':' || t.data || ':' || to_char(t.lembrete, 'HH24:MI'),
         t.titulo,
         'Tarefa de hoje · ' || to_char(t.lembrete, 'HH24:MI')
  from tasks t, agora
  where t.lembrete is not null and t.data is not null and t.concluida_em is null
    and t.data + t.lembrete between agora.t - interval '15 minutes' and agora.t
$$;

revoke execute on function public.lembretes_devidos() from public, anon, authenticated;
grant execute on function public.lembretes_devidos() to service_role;

-- ---------- Agendamento: a cada minuto chama a função de envio ----------
-- A função não recebe dados de ninguém: ela só confere o que está na hora e manda. Chamar a mais não duplica
-- (push_enviados). Por isso ela fica aberta (sem chave), e nenhum segredo precisa ficar guardado aqui.
create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.unschedule('weup-enviar-lembretes') where exists (select 1 from cron.job where jobname = 'weup-enviar-lembretes');
select cron.schedule(
  'weup-enviar-lembretes',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://dnixjqeziggarvcfwnyb.supabase.co/functions/v1/enviar-lembretes',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);

-- ---------- Chaves das notificações (VAPID), geradas pelo próprio servidor ----------
-- Na primeira vez que roda, a função enviar-lembretes cria o par de chaves e guarda aqui.
-- Ninguém precisa copiar nem colar a chave privada: ela nunca sai do servidor (o app não lê esta tabela).
-- O app pega só a pública, por chave_publica_push().
create table if not exists public.push_chaves (
  id      smallint primary key default 1 check (id = 1),
  publica text not null,
  privada text not null,
  criada_em timestamptz not null default now()
);

alter table public.push_chaves enable row level security; -- sem regra: só o servidor
revoke all on public.push_chaves from anon, authenticated;

create or replace function public.chave_publica_push() returns text
language sql stable security definer set search_path = public as $$
  select publica from push_chaves where id = 1
$$;

revoke execute on function public.chave_publica_push() from public, anon;
grant execute on function public.chave_publica_push() to authenticated;
