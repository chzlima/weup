#!/usr/bin/env bash
# Faz uma cópia de segurança do banco do WeUp! e a criptografa.
# Roda no GitHub (ver .github/workflows/backup.yml). Precisa de duas variáveis:
#   SUPABASE_DB_URL    endereço de conexão do banco (Session pooler)
#   BACKUP_PASSPHRASE  senha que tranca o arquivo de backup
# Saída, na pasta backup/:
#   weup-AAAA-MM-DD.dump.gpg   o backup criptografado (é isto que fica guardado)
#   contagem.txt               quantas linhas cada tabela tinha na hora do backup
set -euo pipefail
cd "$(dirname "$0")"
source ./tabelas.sh

: "${SUPABASE_DB_URL:?Falta o segredo SUPABASE_DB_URL (ver docs/BACKUP.md)}"
: "${BACKUP_PASSPHRASE:?Falta o segredo BACKUP_PASSPHRASE (ver docs/BACKUP.md)}"

SAIDA="${SAIDA:-../../backup}"
mkdir -p "$SAIDA"
ARQUIVO="$SAIDA/weup-$(date +%F).dump"

# Só os esquemas com dados do app: public (tudo o que as pessoas criam) e auth (as contas).
pg_dump "$SUPABASE_DB_URL" --format=custom --schema=public --schema=auth --no-owner --file="$ARQUIVO"

contar "$SUPABASE_DB_URL" > "$SAIDA/contagem.txt"

gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" \
    --symmetric --cipher-algo AES256 --output "$ARQUIVO.gpg" "$ARQUIVO"
rm "$ARQUIVO"   # a versão aberta não fica em lugar nenhum

echo "Backup criado: $(basename "$ARQUIVO.gpg") ($(du -h "$ARQUIVO.gpg" | cut -f1))"
cat "$SAIDA/contagem.txt"
