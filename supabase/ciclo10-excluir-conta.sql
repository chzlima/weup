-- WeUp! · Excluir a própria conta (LGPD)
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema.
--
-- O app não tem permissão para apagar usuários. Esta função faz isso, mas SÓ para a própria pessoa
-- logada (auth.uid()). Todas as tabelas do WeUp! apontam para auth.users com "on delete cascade",
-- então apagar o usuário apaga junto: tarefas, projetos, hábitos e registros, compromissos,
-- XP, pet, sessões de foco e recomeços.

create or replace function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public as $$
declare
  eu uuid := auth.uid();
begin
  if eu is null then
    raise exception 'Precisa estar logado.';
  end if;
  delete from auth.users where id = eu;
end $$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
