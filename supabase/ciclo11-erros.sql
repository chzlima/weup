-- WeUp! · 0.2 · Registro de erros do app
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam as regras; nenhum dado é apagado.)

-- Quando o app quebra no aparelho de alguém, ele guarda aqui o que aconteceu, para dar para consertar.
-- Só detalhes técnicos: a mensagem do erro, em que parte do código foi, a versão do app e o navegador.
-- Nada do que a pessoa escreveu (tarefas, hábitos etc.) vem para cá.
-- Para ver os erros: Supabase → Table Editor → app_errors (ordenar por created_at).
create table if not exists public.app_errors (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  origem     text not null check (origem in ('erro', 'promessa', 'tela')),  -- erro solto, promessa rejeitada ou tela que quebrou
  mensagem   text not null check (char_length(mensagem) between 1 and 500),
  detalhe    text check (char_length(detalhe) <= 4000),                      -- pilha do erro (onde no código)
  versao     text not null check (char_length(versao) <= 20),
  commit     text not null check (char_length(commit) <= 40),
  navegador  text check (char_length(navegador) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists app_errors_user_idx on public.app_errors (user_id, created_at desc);
create index if not exists app_errors_data_idx on public.app_errors (created_at desc);

alter table public.app_errors enable row level security;

-- Cada pessoa só enxerga e só cria os próprios registros. Ninguém altera nem apaga pelo app.
drop policy if exists "erros do proprio usuario" on public.app_errors;
create policy "erros do proprio usuario" on public.app_errors
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.app_errors from anon, authenticated;
grant select, insert on public.app_errors to authenticated;

-- Freio: no máximo 30 registros por conta a cada 24 horas (um erro em laço não enche o banco).
create or replace function public.limitar_erros() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from app_errors
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 30 then
    return null;  -- descarta em silêncio
  end if;
  new.created_at := now();
  return new;
end $$;

drop trigger if exists limitar_erros on public.app_errors;
create trigger limitar_erros before insert on public.app_errors
  for each row execute function public.limitar_erros();
