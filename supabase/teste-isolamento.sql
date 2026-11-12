-- WeUp! · Teste de isolamento entre contas (versão 0.2)
--
-- Pergunta que este teste responde: "a conta A consegue ler, alterar, apagar ou criar dados da conta B?"
-- (critério de aceite do plano 0.2: "conta A não lê nem altera dados de B por chamadas diretas").
--
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- O resultado é uma tabela: toda linha deve terminar em "ok". Qualquer "FALHOU" é um furo de segurança.
--
-- É seguro rodar em produção e quantas vezes quiser:
--   • cria duas contas FALSAS (A e B) com dados em todas as tabelas;
--   • age como a conta A do mesmo jeito que o app (papel "authenticated" + o id da pessoa no token);
--   • tenta mexer nos dados de B e nas funções do banco;
--   • no fim DESFAZ TUDO (as contas falsas e os dados delas somem; nada real é alterado);
--   • as funções auxiliares ficam só nesta sessão (pg_temp) e desaparecem sozinhas.
-- O SQL Editor pode mostrar o aviso de "destructive operations" por causa dos UPDATE/DELETE dentro do
-- teste: eles só miram as contas falsas e são desfeitos no fim.

-- Executa um comando e diz se passou (e quantas linhas mexeu) ou se foi bloqueado (e por quê).
create or replace function pg_temp.tentar(cmd text) returns text
language plpgsql as $$
declare n bigint;
begin
  execute cmd;
  get diagnostics n = row_count;
  return 'passou (' || n || ' linhas)';
exception when others then
  return 'bloqueado [' || sqlstate || '] ' || left(sqlerrm, 70);
end $$;

-- Executa uma contagem e devolve o número (ou o erro).
create or replace function pg_temp.contar(cmd text) returns text
language plpgsql as $$
declare n bigint;
begin
  execute cmd into n;
  return n::text;
exception when others then
  return 'erro [' || sqlstate || '] ' || left(sqlerrm, 70);
end $$;

create or replace function pg_temp.testar_isolamento()
returns table (num int, teste text, esperado text, obtido text, resultado text)
language plpgsql as $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  pa uuid; pb uuid; ta uuid; tb uuid; ha uuid; hb uuid; fb uuid; sb uuid;
  t text;
  obt text;
  tabelas text[] := array['tasks', 'projects', 'habits', 'habit_logs', 'events',
                          'xp_transactions', 'user_pets', 'focus_sessions', 'restarts', 'app_errors', 'task_series', 'daily_checkins', 'weekly_reviews'];
  te text[] := '{}';
  es text[] := '{}';
  ob text[] := '{}';
  ok boolean[] := '{}';
begin
  -- Tudo dentro deste bloco é desfeito no fim (ver "DESFAZER_TESTE"). Os resultados ficam nas listas acima.
  begin
    -- 1) Duas contas falsas
    insert into auth.users (id, email, aud, role)
    values (a, 'isolamento-a@weup.test', 'authenticated', 'authenticated'),
           (b, 'isolamento-b@weup.test', 'authenticated', 'authenticated');

    -- 2) Dados nas duas contas, em todas as tabelas (feito como administrador)
    insert into public.projects (user_id, titulo) values (a, 'Projeto A') returning id into pa;
    insert into public.projects (user_id, titulo) values (b, 'Projeto B') returning id into pb;
    insert into public.tasks (user_id, titulo, project_id, data) values (a, 'Tarefa A', pa, public.hoje_br()) returning id into ta;
    insert into public.tasks (user_id, titulo, project_id, data) values (b, 'Tarefa B', pb, public.hoje_br()) returning id into tb;
    insert into public.tasks (user_id, titulo, concluida_em) values (a, 'Feita A', now()), (b, 'Feita B', now()); -- gera XP
    insert into public.habits (user_id, titulo) values (a, 'Hábito A') returning id into ha;
    insert into public.habits (user_id, titulo) values (b, 'Hábito B') returning id into hb;
    insert into public.habit_logs (user_id, habit_id, dia) values (a, ha, public.hoje_br()), (b, hb, public.hoje_br());
    insert into public.events (user_id, titulo, data) values (a, 'Evento A', public.hoje_br()), (b, 'Evento B', public.hoje_br());
    insert into public.user_pets (user_id, especie, nome) values (a, 'gota', 'Pet A'), (b, 'broto', 'Pet B');
    insert into public.focus_sessions (user_id, minutos) values (a, 25);
    insert into public.focus_sessions (user_id, minutos) values (b, 25) returning id into fb;
    insert into public.restarts (user_id, motivo) values (a, 'outro'), (b, 'outro');
    insert into public.task_series (user_id, titulo, tipo) values (a, 'Série A', 'diaria');
    insert into public.task_series (user_id, titulo, tipo) values (b, 'Série B', 'diaria') returning id into sb;
    insert into public.daily_checkins (user_id, dia, energia) values (a, public.hoje_br(), 'normal'), (b, public.hoje_br(), 'baixa');
    insert into public.weekly_reviews (user_id, semana, avancou)
      values (a, date_trunc('week', public.hoje_br())::date, 'A'), (b, date_trunc('week', public.hoje_br())::date, 'B');
    insert into public.app_errors (user_id, origem, mensagem, versao, commit) values (a, 'erro', 'Erro A', '0', 'teste'), (b, 'erro', 'Erro B', '0', 'teste');

    -- 3) A partir daqui, age como a conta A, igual ao app
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

    obt := coalesce((auth.uid() = a)::text, 'null');
    te := te || 'Sessão do teste age como a conta A'::text; es := es || 'true'::text; ob := ob || obt; ok := ok || (obt = 'true');

    -- 4) Em cada tabela: ver os próprios dados, e tentar ler / alterar / apagar / tomar dados de outras contas
    foreach t in array tabelas loop
      obt := pg_temp.contar(format('select count(*) from public.%I where user_id = %L', t, a));
      te := te || format('%s · A vê os próprios dados', t); es := es || '1 ou mais'::text; ob := ob || obt;
      ok := ok || (obt ~ '^[1-9][0-9]*$');

      obt := pg_temp.contar(format('select count(*) from public.%I where user_id <> %L', t, a));
      te := te || format('%s · A lê dados de outras contas (inclusive reais)', t); es := es || '0'::text; ob := ob || obt;
      ok := ok || (obt = '0');

      obt := pg_temp.tentar(format('update public.%I set user_id = user_id where user_id = %L', t, b));
      te := te || format('%s · A altera dados de B', t); es := es || 'bloqueado ou 0 linhas'::text; ob := ob || obt;
      ok := ok || (obt like 'bloqueado%' or obt = 'passou (0 linhas)');

      obt := pg_temp.tentar(format('delete from public.%I where user_id = %L', t, b));
      te := te || format('%s · A apaga dados de B', t); es := es || 'bloqueado ou 0 linhas'::text; ob := ob || obt;
      ok := ok || (obt like 'bloqueado%' or obt = 'passou (0 linhas)');

      obt := pg_temp.tentar(format('update public.%I set user_id = %L where user_id = %L', t, b, a));
      te := te || format('%s · A passa um dado seu para B', t); es := es || 'bloqueado'::text; ob := ob || obt;
      ok := ok || (obt like 'bloqueado%');
    end loop;

    -- 5) Criar dados em nome de B
    obt := pg_temp.tentar(format('insert into public.tasks (user_id, titulo) values (%L, %L)', b, 'x'));
    te := te || 'tasks · A cria tarefa em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.projects (user_id, titulo) values (%L, %L)', b, 'x'));
    te := te || 'projects · A cria projeto em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.habits (user_id, titulo) values (%L, %L)', b, 'x'));
    te := te || 'habits · A cria hábito em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.habit_logs (user_id, habit_id, dia) values (%L, %L, public.hoje_br() - 1)', b, hb));
    te := te || 'habit_logs · A marca dia em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.events (user_id, titulo, data) values (%L, %L, public.hoje_br())', b, 'x'));
    te := te || 'events · A cria compromisso em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.xp_transactions (user_id, tipo, origem_id, descricao, dia, xp) values (%L, %L, gen_random_uuid(), %L, public.hoje_br(), 999)', b, 'projeto', 'x'));
    te := te || 'xp_transactions · A grava XP em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.user_pets (user_id, especie, nome) values (%L, %L, %L)', b, 'gota', 'x'));
    te := te || 'user_pets · A cria pet em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.focus_sessions (user_id, minutos) values (%L, 25)', b));
    te := te || 'focus_sessions · A inicia foco em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.restarts (user_id, motivo) values (%L, %L)', b, 'outro'));
    te := te || 'restarts · A registra recomeço em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.app_errors (user_id, origem, mensagem, versao, commit) values (%L, %L, %L, %L, %L)', b, 'erro', 'x', '0', 'teste'));
    te := te || 'app_errors · A registra erro em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');

    obt := pg_temp.tentar(format('insert into public.task_series (user_id, titulo, tipo) values (%L, %L, %L)', b, 'x', 'diaria'));
    te := te || 'task_series · A cria repetição em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.daily_checkins (user_id, dia, energia) values (%L, public.hoje_br() - 1, %L)', b, 'alta'));
    te := te || 'daily_checkins · A responde o check-in em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.weekly_reviews (user_id, semana) values (%L, date_trunc(%L, public.hoje_br())::date - 7)', b, 'week'));
    te := te || 'weekly_reviews · A escreve revisão em nome de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    -- Pet: o estágio só muda pelo banco (ciclo19)
    obt := pg_temp.tentar(format('update public.user_pets set estagio = 5 where user_id = %L', a));
    te := te || 'user_pets · A sobe o próprio estágio direto'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('update public.user_pets set nome = %L where user_id = %L', 'Pet A2', a));
    te := te || 'user_pets · A renomeia o próprio pet'::text; es := es || 'passou (1 linhas)'::text; ob := ob || obt; ok := ok || (obt = 'passou (1 linhas)');
    obt := pg_temp.contar('select coalesce(public.sincronizar_pet(), 0)');
    te := te || 'sincronizar_pet · A sincroniza o próprio pet'::text; es := es || '1'::text; ob := ob || obt; ok := ok || (obt = '1');
    -- Laço (ciclo20): conta só os dias de A (A tem 1 dia com ação, sem cuidado registrado)
    obt := pg_temp.contar('select pontos from public.laco_do_pet()');
    te := te || 'laco_do_pet · A vê só o próprio laço'::text; es := es || '1'::text; ob := ob || obt; ok := ok || (obt = '1');

    -- 6) Usar coisas de B a partir dos próprios dados
    obt := pg_temp.tentar(format('insert into public.tasks (user_id, titulo, series_id, ocorrencia) values (%L, %L, %L, public.hoje_br() + 30)', a, 'x', sb));
    te := te || 'tasks · A cria tarefa na repetição de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.tasks (user_id, titulo, revisao_de, revisao_n) values (%L, %L, %L, 1)', a, 'x', tb));
    te := te || 'tasks · A cria revisão de uma tarefa de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.events (user_id, titulo, data, task_id) values (%L, %L, public.hoje_br(), %L)', a, 'x', tb));
    te := te || 'events · A liga um compromisso a uma tarefa de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.tasks (user_id, titulo, revisao_de, revisao_n) values (%L, %L, %L, 1)', a, 'x', ta));
    te := te || 'tasks · A cria revisão da própria tarefa'::text; es := es || 'passou (1 linhas)'::text; ob := ob || obt; ok := ok || (obt = 'passou (1 linhas)');
    obt := pg_temp.tentar(format('insert into public.tasks (user_id, titulo, revisao_de, revisao_n) values (%L, %L, %L, 1)', a, 'x', ta));
    te := te || 'tasks · A repete a mesma revisão (não duplica)'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.contar('select public.gerar_ocorrencias()');
    te := te || 'gerar_ocorrencias · cria só a tarefa da série de A'::text; es := es || '1'::text; ob := ob || obt; ok := ok || (obt = '1');
    obt := pg_temp.contar('select public.gerar_ocorrencias()');
    te := te || 'gerar_ocorrencias · chamar de novo não duplica'::text; es := es || '0'::text; ob := ob || obt; ok := ok || (obt = '0');
    obt := pg_temp.tentar(format('insert into public.habit_logs (user_id, habit_id, dia) values (%L, %L, public.hoje_br() - 1)', a, hb));
    te := te || 'habit_logs · A marca o hábito de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.tasks (user_id, titulo, project_id) values (%L, %L, %L)', a, 'x', pb));
    te := te || 'tasks · A cria etapa no projeto de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('insert into public.focus_sessions (user_id, minutos, task_id) values (%L, 25, %L)', a, tb));
    te := te || 'focus_sessions · A foca numa tarefa de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');

    -- 7) Funções do banco
    obt := pg_temp.tentar(format('select public.pausar_foco(%L)', fb));
    te := te || 'pausar_foco · A pausa a sessão de foco de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('select public.retomar_foco(%L)', fb));
    te := te || 'retomar_foco · A continua a sessão de foco de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('select public.concluir_foco(%L)', fb));
    te := te || 'concluir_foco · A conclui a sessão de foco de B'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar(format('select public.conceder_xp(%L, %L, gen_random_uuid(), %L, null, public.hoje_br())', a, 'projeto', 'x'));
    te := te || 'conceder_xp · A se dá XP direto'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.tentar('select public.estornar_xp(gen_random_uuid())');
    te := te || 'estornar_xp · A estorna XP direto'::text; es := es || 'bloqueado'::text; ob := ob || obt; ok := ok || (obt like 'bloqueado%');
    obt := pg_temp.contar(format('select count(*) from public.xp_resumo where user_id <> %L', a));
    te := te || 'xp_resumo · A vê o total de XP de outras contas'::text; es := es || '0'::text; ob := ob || obt; ok := ok || (obt = '0');

    -- 8) Excluir conta: A só pode apagar a si mesma
    obt := pg_temp.tentar('select public.excluir_minha_conta()');
    perform set_config('role', 'none', true); -- volta a ser administrador para conferir o efeito
    obt := (select count(*) from auth.users where id = a)::text || ' conta A / '
        || (select count(*) from auth.users where id = b)::text || ' conta B / '
        || (select count(*) from public.tasks where user_id = b)::text || ' tarefas de B';
    te := te || 'excluir_minha_conta · A apaga só a própria conta'::text; es := es || '0 conta A / 1 conta B / 2 tarefas de B'::text;
    ob := ob || obt; ok := ok || (obt = '0 conta A / 1 conta B / 2 tarefas de B');

    -- 9) Desfaz tudo o que foi feito neste bloco
    raise exception 'DESFAZER_TESTE';
  exception when others then
    if sqlerrm <> 'DESFAZER_TESTE' then
      raise; -- erro inesperado no próprio teste: mostra o erro em vez de um resultado incompleto
    end if;
  end;

  return query
    select g.i, te[g.i], es[g.i], ob[g.i], case when ok[g.i] then 'ok' else 'FALHOU' end
    from generate_subscripts(te, 1) as g(i)
    order by g.i;
end $$;

select * from pg_temp.testar_isolamento();
