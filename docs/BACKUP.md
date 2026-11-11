# Backup do WeUp!

O plano gratuito do Supabase não guarda backups. Por isso o próprio repositório faz um, sozinho.

## Como funciona

Todo **domingo às 03:00** (horário de Brasília) o GitHub:

1. copia o banco inteiro (as contas e tudo o que as pessoas criaram);
2. **tranca o arquivo com uma senha** (criptografia AES-256);
3. **prova que o backup serve**: abre o arquivo, restaura num banco vazio de teste e confere se cada tabela voltou
   com a mesma quantidade de linhas;
4. guarda o arquivo trancado por **90 dias** (ficam sempre umas 13 cópias).

Se qualquer passo falhar, o GitHub manda e-mail para o dono do repositório.

Para ver ou baixar: GitHub → aba **Actions** → **Backup semanal** → clique numa execução → no fim da página, *Artifacts*.
Para rodar à mão (antes de um SQL arriscado, por exemplo): mesma tela → **Run workflow**.

## Configurar (uma vez só)

O backup precisa de dois segredos. No GitHub: repositório → **Settings → Secrets and variables → Actions →
New repository secret**.

| Nome | O que colocar |
|---|---|
| `SUPABASE_DB_URL` | Supabase → botão **Connect** (topo) → **Session pooler** → copie o endereço e troque `[YOUR-PASSWORD]` pela senha do banco. Precisa ser o *Session pooler*: o endereço "Direct" não funciona a partir do GitHub. |
| `BACKUP_PASSPHRASE` | Uma senha longa inventada por você (4 ou 5 palavras aleatórias servem). |

- **Não lembra a senha do banco?** Supabase → Project Settings → Database → *Reset database password*. O app não usa
  essa senha, então trocar não derruba nada.
- **Guarde a `BACKUP_PASSPHRASE` fora do GitHub** (gerenciador de senhas ou papel). O GitHub não mostra o segredo
  depois de salvo. **Sem ela, nenhum backup abre.**
- Segredos nunca vão para o código, para o chat ou para o `PROJETO.md`.

## Cuidados

- Tabela nova no app → acrescentar em `scripts/backup/tabelas.sh` (senão o teste não confere essa tabela).
- O GitHub **desliga agendamentos de repositórios parados há 60 dias**. Se o projeto ficar sem commits por esse tempo,
  reative em Actions → Backup semanal → *Enable workflow*.
- O arquivo contém dados pessoais (e-mails e o que as pessoas escreveram). Ele só existe criptografado; depois de abrir
  um para restaurar, apague a versão aberta.

## Restaurar de verdade

Use quando dados foram perdidos ou estragados. **Primeiro pare e avalie**: restaurar por cima apaga o que foi criado
depois do backup.

Precisa das ferramentas do Postgres 17 (`pg_restore`, `psql`) e do `gpg` no computador.

1. Baixe o arquivo `weup-AAAA-MM-DD.dump.gpg` da execução desejada (Actions → Backup semanal → Artifacts).
2. Abra o arquivo (ele pede a `BACKUP_PASSPHRASE`):
   ```
   gpg --decrypt --output weup.dump weup-AAAA-MM-DD.dump.gpg
   ```
3. Escolha o caso:

   **a) Recuperar uma tabela ou alguns dados** (o mais comum). Restaure o backup num banco separado e copie de lá só o
   que faltou. Dá para usar um projeto Supabase novo e vazio como banco separado:
   ```
   pg_restore --no-owner --schema=public --dbname="ENDEREÇO_DO_BANCO_SEPARADO" weup.dump
   ```

   **b) Perdeu o projeto inteiro.** Crie um projeto Supabase novo, rode os arquivos de `supabase/` em ordem
   (ciclo3 … ciclo11) para recriar tabelas e regras, e depois carregue só os dados, primeiro as contas:
   ```
   export PGOPTIONS="-c session_replication_role=replica"
   pg_restore --data-only --schema=auth --table=users --table=identities --dbname="ENDEREÇO_NOVO" weup.dump
   pg_restore --data-only --schema=public --dbname="ENDEREÇO_NOVO" weup.dump
   ```
   A primeira linha desliga os gatilhos durante a carga; sem ela o XP seria concedido de novo para cada tarefa
   restaurada. Depois troque o endereço e a chave do projeto em `src/lib/config.ts` e refaça a configuração do painel
   descrita no `PROJETO.md`.

4. Apague o `weup.dump` aberto.

**O que é testado toda semana:** abrir o arquivo e restaurar tudo num banco vazio, com conferência de quantidades.
**O que nunca foi ensaiado:** o caso (b), num projeto Supabase novo de verdade. Vale fazer esse ensaio uma vez antes
de o app ter muitos usuários.
