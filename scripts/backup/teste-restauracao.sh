#!/usr/bin/env bash
# Prova que o backup serve: abre o arquivo criptografado, restaura num banco vazio de teste
# e confere se cada tabela voltou com a mesma quantidade de linhas que tinha na hora do backup.
# Um backup que nunca foi restaurado não é um backup.
#   BANCO_DE_TESTE     endereço de um Postgres vazio (no GitHub, um banco temporário)
#   BACKUP_PASSPHRASE  a mesma senha usada para trancar o arquivo
set -euo pipefail
cd "$(dirname "$0")"
source ./tabelas.sh

: "${BANCO_DE_TESTE:?Falta BANCO_DE_TESTE}"
: "${BACKUP_PASSPHRASE:?Falta BACKUP_PASSPHRASE}"

SAIDA="${SAIDA:-../../backup}"
TRANCADO="$(ls "$SAIDA"/weup-*.dump.gpg | tail -1)"
ABERTO="$(mktemp)"
trap 'rm -f "$ABERTO"' EXIT

gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" \
    --decrypt --output "$ABERTO" "$TRANCADO"

# O banco de teste é um Postgres comum: cria os papéis que o Supabase usa, para as regras de segurança restaurarem.
for papel in anon authenticated service_role supabase_auth_admin supabase_admin dashboard_user; do
  psql "$BANCO_DE_TESTE" --no-psqlrc -q -c "do \$\$ begin create role $papel; exception when duplicate_object then null; end \$\$"
done

# Alguns detalhes próprios do Supabase não existem num Postgres comum e geram avisos; o que decide é a contagem abaixo.
pg_restore --no-owner --dbname="$BANCO_DE_TESTE" "$ABERTO" 2> "$SAIDA/avisos-restauracao.txt" || true
echo "Avisos na restauração: $(grep -c 'error:' "$SAIDA/avisos-restauracao.txt" || true)"

contar "$BANCO_DE_TESTE" > "$SAIDA/restaurado.txt"

if diff "$SAIDA/contagem.txt" "$SAIDA/restaurado.txt"; then
  echo "RESTAURAÇÃO OK: todas as tabelas voltaram com a mesma quantidade de linhas."
else
  echo "RESTAURAÇÃO FALHOU: as quantidades acima não batem (< no backup, > restaurado)."
  cat "$SAIDA/avisos-restauracao.txt"
  exit 1
fi
