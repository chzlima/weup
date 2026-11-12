#!/usr/bin/env bash
# Tabelas conferidas no backup. Toda tabela nova do app precisa entrar aqui.
TABELAS="auth.users public.tasks public.projects public.habits public.habit_logs public.events
public.xp_transactions public.user_pets public.focus_sessions public.restarts public.app_errors public.task_series public.daily_checkins public.weekly_reviews public.pet_memories"

# contar <endereço do banco>: escreve "tabela quantidade" para cada tabela.
contar() {
  local t
  for t in $TABELAS; do
    echo "$t $(psql "$1" --no-psqlrc -At -v ON_ERROR_STOP=1 -c "select count(*) from $t")"
  done
}
