# Changelog do WeUp!

O que mudou em cada versão. A mais nova fica no topo.
A versão que está rodando aparece no fim da tela **Perfil** (número + commit).

## 0.2.0 — Stability & Trust (11/11/2026)

Versão de segurança e estabilidade: nada muda no jeito de usar o app, mas agora ele avisa quando há atualização,
tem backup, testes, registro de erros e isolamento entre contas comprovado.

### Adicionado
- Aviso **"Atualização disponível"** quando sai uma versão nova: a pessoa escolhe a hora de atualizar ("Atualizar" ou "Depois"). O app procura versão nova sempre que volta para a tela e a cada hora.
- Versão do app e commit publicado no fim da tela Perfil.
- Testes automáticos das regras do app (`npm test`): níveis, evolução do pet, datas, hábitos, agenda e mensagens de erro. Um deles confere que o XP mostrado no app é o mesmo que o banco concede.
- O GitHub passa a conferir todo PR sozinho: testes, compilação e dependências com falha de segurança conhecida.
- Checklist de lançamento e de rollback em `docs/RELEASE.md`.
- Registro de erros: quando o app falha com a pessoa logada, os detalhes técnicos vão para a tabela `app_errors` (sem serviço de terceiros, sem conteúdo digitado; e-mails e chaves são removidos). Aparece em "Baixar meus dados" e está descrito na Privacidade. Precisa rodar `supabase/ciclo11-erros.sql`.
- Tela "Algo não saiu como esperado" com botão Recarregar no lugar da tela em branco quando uma tela quebra.

- Backup semanal automático do banco (domingo, 03:00): criptografado, com teste de restauração a cada execução e guardado por 90 dias. Como configurar e restaurar: `docs/BACKUP.md`. A Privacidade passou a citar o backup.
- Aviso **"Atualizamos a política de privacidade"** na tela Hoje, uma vez por aparelho, para quem já tinha conta quando o texto mudou.

### Mudado
- O service worker deixou de se atualizar sozinho em silêncio: agora espera o "Atualizar" ou o app ser fechado.

### Corrigido
- Botão **Atualizar** do aviso de versão nova não fazia nada quando a versão tinha sido achada ao voltar para o app (a versão nova assumia, mas a tela não recarregava). Agora o app recarrega por conta própria, com uma garantia de 4 segundos.

### Segurança
- Teste de isolamento entre contas (`supabase/teste-isolamento.sql`): a conta A tenta ler, alterar, apagar e criar dados da conta B nas 9 tabelas e nas funções do banco. Rodado em produção em 11/11/2026: todas as verificações "ok". Rodar de novo sempre que uma tabela ou regra de segurança mudar.

## 0.1.0 — V1 (11/11/2026)

Primeira versão completa, publicada em https://weup-rose.vercel.app:
cadastro e login, tarefas, projetos, hábitos, agenda, XP com Experience Ledger, pet com 3 estágios,
timer de foco, Modo Recomeçar, app instalável (PWA), esqueci minha senha, privacidade (LGPD) e e-mails próprios.
Detalhes de cada ciclo no `PROJETO.md`.
