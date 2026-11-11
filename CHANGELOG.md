# Changelog do WeUp!

O que mudou em cada versão. A mais nova fica no topo.
A versão que está rodando aparece no fim da tela **Perfil** (número + commit).

## Não lançado (a caminho da 0.2.0)

### Adicionado
- Aviso **"Atualização disponível"** quando sai uma versão nova: a pessoa escolhe a hora de atualizar ("Atualizar" ou "Depois"). O app procura versão nova sempre que volta para a tela e a cada hora.
- Versão do app e commit publicado no fim da tela Perfil.

### Mudado
- O service worker deixou de se atualizar sozinho em silêncio: agora espera o "Atualizar" ou o app ser fechado.

### Segurança
- Teste de isolamento entre contas (`supabase/teste-isolamento.sql`): a conta A tenta ler, alterar, apagar e criar dados da conta B nas 9 tabelas e nas funções do banco. Rodado em produção em 11/11/2026: todas as verificações "ok". Rodar de novo sempre que uma tabela ou regra de segurança mudar.

## 0.1.0 — V1 (11/11/2026)

Primeira versão completa, publicada em https://weup-rose.vercel.app:
cadastro e login, tarefas, projetos, hábitos, agenda, XP com Experience Ledger, pet com 3 estágios,
timer de foco, Modo Recomeçar, app instalável (PWA), esqueci minha senha, privacidade (LGPD) e e-mails próprios.
Detalhes de cada ciclo no `PROJETO.md`.
