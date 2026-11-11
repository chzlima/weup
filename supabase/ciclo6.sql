-- WeUp! · Ciclo 6 · Pet ativo com 3 estágios
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. (O aviso de "destructive operations" aparece por causa
-- dos "drop ... if exists", que só recriam regras e gatilhos; nenhum dado é apagado.)

-- O companheiro ativo de cada pessoa (um por usuário na V1).
-- As espécies ficam no código do app (broto, faisca, gota); a coleção completa chega na Etapa 2.
create table if not exists public.user_pets (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  especie    text not null check (especie in ('broto', 'faisca', 'gota')),
  nome       text not null check (char_length(nome) between 1 and 30),
  estagio    smallint not null default 1 check (estagio between 1 and 3),
  created_at timestamptz not null default now()
);

alter table public.user_pets enable row level security;

drop policy if exists "pet do proprio usuario" on public.user_pets;
create policy "pet do proprio usuario" on public.user_pets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.user_pets to authenticated;

-- Princípio "o pet nunca regride": o estágio só pode subir, mesmo que o app peça para descer.
create or replace function public.pet_nunca_regride() returns trigger
language plpgsql as $$
begin
  new.estagio := greatest(old.estagio, new.estagio);
  return new;
end $$;

drop trigger if exists pet_nunca_regride on public.user_pets;
create trigger pet_nunca_regride before update on public.user_pets
  for each row execute function public.pet_nunca_regride();
