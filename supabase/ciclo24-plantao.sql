-- WeUp! · 0.4 · Semana de plantão
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema. Nenhum dado é apagado.
--
-- A pessoa marca dias de plantão ou estágio (hoje ou adiante). Nesses dias a tela Hoje mostra só
-- tarefas pequenas (até 3) e não espera os hábitos. Não vale XP: é um ajuste do dia, como a energia.
-- Sem tabela nova: fica no registro do dia (daily_checkins), que já está no isolamento,
-- no backup e em "Baixar meus dados".

alter table public.daily_checkins add column if not exists plantao boolean not null default false;
