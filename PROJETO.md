# WeUp! — Evolua no seu ritmo

App de produtividade com elementos de RPG: tarefas e hábitos geram XP, e um companheiro (pet) evolui junto com o usuário.

- Blueprint completo (V1.1): https://claude.ai/artifact/RMGguSxouMxSKSYHptUS7k
- Público inicial: estudantes da área da saúde (a confirmar)
- Responsável pelo código: Carlos (com o Claude)
- Código: https://github.com/chzlima/weup (privado) · App no ar: https://weup-rose.vercel.app

## Stack

React + TypeScript · Vite · Tailwind CSS v4 · Supabase (banco + login) · Vercel (hospedagem) · PWA

## Como rodar no PC

Precisa do **Node.js (versão LTS)** instalado.

1. Abra o terminal nesta pasta (no Explorador de Arquivos: clique na barra de endereço, digite `cmd` e aperte Enter).
2. Só na primeira vez (ou quando o `package.json` mudar): `npm install`
3. Para abrir o app: `npm run dev`
4. Abra o endereço que aparecer (normalmente http://localhost:5173).
   - O endereço "Network" que também aparece abre o app no seu celular, se ele estiver no mesmo Wi-Fi.
5. Para parar: `Ctrl + C` no terminal.

## Regras de segurança

- A URL e a chave do Supabase ficam em `src/lib/config.ts` e são **públicas** (Project URL e publishable key).
- **Nunca** coloque no projeto a secret key / service_role nem a senha do banco.

## Princípios do produto

1. Sem punição por descansar (o pet não morre, nada se perde para sempre).
2. Evolução verdadeira: XP só por ações reais.
3. Gamificação opcional.
4. Privacidade: dados pessoais e profissionais separados.
5. Crescimento modular.
6. Menos é mais: uma função só entra quando a anterior é usada de verdade.

## Etapa 1 (V1) — progresso

- [x] Ciclo 1 — Estrutura, tema visual, 5 abas, conexão com o Supabase
- [x] Ciclo 2 — Cadastro e login (testado com conta real no app publicado)
- [x] Ciclo 3 — Tarefas e projetos (salvando no banco)
- [x] Ciclo 4 — Hábitos e agenda
- [x] Ciclo 5 — XP e níveis (Experience Ledger)
- [x] Ciclo 6 — Pet ativo com 3 estágios
- [x] Ciclo 7 — Timer de foco
- [x] Ciclo 8 — Modo Recomeçar
- [x] Ciclo 9 — Publicar na Vercel + instalar como app no celular (instalação testada no celular em 2026-11-11)

**V1 completa.** Próximo passo pelo blueprint: o "portão" antes da Etapa 2 — colocar estudantes da saúde para usar e só construir mais quando o núcleo estiver sendo usado de verdade.

## Histórico

- 2026-11-10 — Ciclo 1: projeto criado. Telas Planejar, Evoluir, Pets e Perfil ainda são moldes; a tela Hoje usa dados de exemplo.
- 2026-11-10 — Ciclo 2: login e cadastro com e-mail e senha (Supabase Auth). O app só abre para quem está logado; o nome digitado no cadastro aparece na tela Hoje; o Perfil mostra a conta e tem o botão "Sair". O nome fica salvo nos dados do usuário (`user_metadata.nome`); a tabela `profiles` entra no Ciclo 3, junto com as outras tabelas.
  - Arquivos novos: `src/lib/auth.tsx` (quem está logado + erros em português) e `src/screens/Entrar.tsx` (tela de entrada).
  - Corrigido: `src/lib/supabase.ts` agora usa os valores de `config.ts` (antes exigia um `.env` que não existe).
  - "Esqueci minha senha" adicionado em 2026-11-11 (ver abaixo).
- 2026-11-10 — Publicação adiantada (parte do Ciclo 9): app no ar em https://weup-rose.vercel.app (projeto `weup` no time `weup4` da Vercel). Ainda falta a parte de instalar como app no celular.

- 2026-11-10 — Ciclo 3: tarefas e projetos salvos no Supabase (tabelas `tasks` e `projects`, criadas por `supabase/ciclo3.sql`, com RLS: cada usuário só vê os próprios dados).
  - Planejar: abas Tarefas (Para hoje, Próximos dias, Sem data, Concluídas) e Projetos (etapas, barra de progresso, concluir/reabrir, excluir).
  - Hoje: tarefas reais do dia (pendentes até hoje + concluídas hoje), adicionar rápido, progresso e XP do dia calculados. Pendências antigas continuam aparecendo, sem rótulo de "atrasada".
  - XP: pequena 5, média 15, complexa 30, etapa de projeto 25. Por enquanto só é exibido; o registro (Experience Ledger) é o Ciclo 5.
  - Os hábitos de exemplo saíram da tela Hoje; voltam de verdade no Ciclo 4.
  - Arquivos: `src/lib/tarefas.ts` (tipos, XP, datas, banco), `src/lib/useDados.ts` (estado + ações), `src/components/{Sheet,TarefaItem,TarefaForm}.tsx`.

- 2026-11-10 — Ciclo 4: hábitos e agenda (tabelas `habits`, `habit_logs` e `events`, criadas por `supabase/ciclo4.sql`, com RLS).
  - Hábitos: nome, dias da semana (0 = domingo … 6 = sábado), categoria. Um registro por dia em `habit_logs`. +10 XP por dia feito.
  - Sem "sequência" que zera: o app mostra quantas vezes foi feito nos últimos 7 dias (princípio "sem punição por descansar"). Dá para marcar dias anteriores que a pessoa esqueceu de registrar.
  - Agenda: compromissos com data e hora opcional (não geram XP). A aba mostra os próximos 14 dias (compromissos + tarefas daquele dia) e "Mais adiante".
  - Hoje: seções "Hábitos de hoje" e "Próximos compromissos" (hoje e amanhã); progresso e XP do dia somam tarefas e hábitos.
  - Arquivos: `src/lib/{habitos,agenda}.ts`, `src/components/{HabitoForm,CompromissoForm,CampoData}.tsx`, `src/screens/planejar/{Habitos,Agenda,Vazio}.tsx`.

- 2026-11-10 — Ciclo 5: XP e níveis (Experience Ledger), criado por `supabase/ciclo5.sql`.
  - O XP é calculado **pelo banco** (gatilhos em `tasks`, `habit_logs` e `projects`) e gravado em `xp_transactions`. O app só lê; inserir XP ou chamar `conceder_xp` pela API dá "permissão negada" (testado).
  - Desmarcar tarefa/hábito ou reabrir projeto estorna (`estornado_em`). Excluir tarefa ou hábito **não** tira o XP já ganho.
  - Limite diário por tipo (pequena 10, média 6, complexa 3, etapa 4, hábito 10, projeto 2); acima disso o registro vale 0 XP com `limitado = true`. Dia do XP = horário de Brasília.
  - Hábito só pode ser registrado até 7 dias atrás (regra de segurança em `habit_logs`).
  - Níveis: XP para sair do nível n = 30 · n^1,5 (arredondado de 5 em 5). Títulos: Iniciante (1), Aprendiz (5), Dedicado (10), Persistente (20), Experiente (35), Mestre (50). Fica em `src/lib/xp.ts`.
  - Telas: Evoluir (nível, números rápidos, XP por dia, atributos, últimos ganhos); Hoje com nível real, XP do dia do registro e aviso ao subir de nível.

- 2026-11-10 — Ciclo 6: pet ativo com 3 estágios (tabela `user_pets`, criada por `supabase/ciclo6.sql`).
  - 3 espécies com arte **provisória** em SVG (`src/components/Pet.tsx`): Broto (Semente → Muda → Árvore), Faísca (Brasa → Chama → Fênix), Gota (Gotinha → Riacho → Nuvem).
  - Escolha do pet na primeira entrada; evolui nos níveis 5 e 10 com tela de comemoração; um gatilho no banco garante que o estágio nunca desce.
  - Tela Pets: pet que reage ao toque com frase de incentivo, barra até a próxima evolução, caminho dos 3 estágios, mudar nome e trocar espécie (mantém o estágio).
  - Não testado ao vivo: a comemoração de evolução (exigiria evoluir o pet de verdade, e isso não pode ser desfeito).

- 2026-11-10 — Ciclo 7: timer de foco (tabela `focus_sessions` e função `concluir_foco`, criadas por `supabase/ciclo7.sql`).
  - Sessões de 15, 25 ou 50 min, opcionalmente ligadas a uma tarefa do dia; +10 XP (limite de 8 por dia). XP vai para o atributo da categoria da tarefa (ou Conhecimento, no foco livre).
  - Proteção: o início é marcado pelo relógio do banco e `concluir_foco` recusa antes do tempo (folga de 30 s). Testado: concluir antes da hora, editar a sessão direto e criar com início falso — tudo bloqueado.
  - Tela cheia com anel e pet; tempo no título da aba; som + vibração no fim; parar não tem punição (apaga a sessão).
  - Retomar depois de fechar o app: usa a diferença entre o relógio do celular e o do servidor, medida no início (guardada no navegador).
  - Não testado: uma sessão completa até o fim (daria XP sem foco de verdade).

- 2026-11-10 — Ciclo 8: Modo Recomeçar (tabela `restarts`, criada por `supabase/ciclo8.sql`).
  - Fluxo de 4 passos em tela cheia (`src/components/Recomecar.tsx`): (1) o que travou — cansaço, excesso, falta de vontade, não sei; com nota discreta sobre o CVV (188); (2) tirar peso — a pessoa marca só o urgente e o resto vai para amanhã / 3 dias / sem data; (3) uma ação pequena (sugestões por motivo ou texto próprio), criada como tarefa pequena de hoje; (4) retomar aos poucos — marcar "Fiz!" e depois uma tarefa mantida de cada vez.
  - Cada primeira ação feita registra um "recomeço", mostrado em Evoluir como conquista.
  - Não testado: o botão "Fiz!" (registraria um recomeço falso que o app não consegue apagar).

- 2026-11-11 — Ciclo 9: app instalável (PWA) com `vite-plugin-pwa` (configurado em `vite.config.ts`).
  - Manifesto gerado no build; ícones PNG do mascote Broto em `public/` (`pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png`), gerados por `node scripts/gerar-icones.mjs`.
  - Service worker guarda os arquivos do app e a fonte (abre rápido e sem internet); dados do Supabase nunca são guardados. Versão nova entra sozinha na próxima abertura.
  - Aviso dourado "Sem internet" no topo; seção "App no celular" no Perfil (botão de instalar no Android/Chrome; passo a passo no iPhone).
  - O navegador embutido do Claude não suporta service workers, então a instalação e o modo offline precisam ser testados no celular.

- 2026-11-11 — Código no GitHub (chzlima/weup) com publicação automática pela Vercel.
- 2026-11-11 — "Esqueci minha senha": link na tela de login → e-mail do Supabase → ao abrir o link, tela "Criar senha nova" (`src/screens/NovaSenha.tsx`). Link vencido mostra aviso em português. Caminho completo testado com e-mail real em 2026-11-11.

- 2026-11-11 — Privacidade e dados (LGPD): página "Privacidade" (`src/screens/Privacidade.tsx`, linkada no login, no cadastro e no Perfil; contato público em `src/lib/config.ts`: contato.weupdisciplina@gmail.com); Perfil → "Baixar meus dados" (arquivo .json com tudo) e "Excluir minha conta" (digitar EXCLUIR; função `excluir_minha_conta` em `supabase/ciclo10-excluir-conta.sql` apaga o usuário e, em cascata, todos os dados). Texto da política escrito por nós, sem revisão jurídica. Exclusão testada com conta descartável em 2026-11-11.

- 2026-11-11 — Plano 0.2/0.3 do Matheus recebido; diagnóstico do repositório em https://claude.ai/artifact/BTZ8DttEutgPeRmC1WdK49. A partir daqui, o que muda vai para o `CHANGELOG.md`.
- 0.2 (em andamento, branch `0.2/aviso-atualizacao`): aviso "Atualização disponível" (service worker em modo `prompt`, `src/components/AvisoAtualizacao.tsx`) e versão + commit no fim do Perfil.

- 0.2: teste de isolamento entre contas em `supabase/teste-isolamento.sql` (roda no SQL Editor, cria duas contas falsas e desfaz tudo no fim). Resultado em 11/11/2026: tudo "ok". **Toda tabela nova precisa entrar na lista `tabelas` desse teste.**

- 0.2: testes automáticos em `src/lib/regras.test.ts` (`npm test`), conferência automática de cada PR no GitHub (`.github/workflows/ci.yml`) e checklist de lançamento/rollback em `docs/RELEASE.md`. **Valor de XP muda nos dois lados: no SQL e no app; o teste avisa se ficarem diferentes.**

- 0.2: registro de erros próprio, sem serviço de terceiros (`src/lib/erros.ts`, `src/components/TelaDeErro.tsx`, `supabase/ciclo11-erros.sql`). Erros que acontecem com a pessoa logada vão para a tabela `app_errors` (só detalhes técnicos, com e-mails e chaves removidos; no máximo 5 por abertura do app e 30 por conta por dia). **Para ver os erros:** Supabase → Table Editor → `app_errors`, ordenar por `created_at`. Se uma tela quebrar, aparece "Algo não saiu como esperado" com o botão Recarregar em vez de tela em branco.

- 0.2: backup semanal automático pelo GitHub (`.github/workflows/backup.yml`, `scripts/backup/`), criptografado e com teste de restauração. Depende dos segredos `SUPABASE_DB_URL` e `BACKUP_PASSPHRASE` no repositório. Tudo em `docs/BACKUP.md`. **Toda tabela nova precisa entrar também em `scripts/backup/tabelas.sh`.**

- 0.2: aviso "Atualizamos a política de privacidade" (`src/lib/privacidade.ts`, `src/components/AvisoPrivacidade.tsx`). **Mudou o texto da Privacidade → atualizar `POLITICA_VERSAO`.**

- 0.2: **proteção da `main` não está disponível**: o GitHub só oferece regras de proteção em repositório privado no plano pago (conferido em 11/11/2026). Fica valendo a regra combinada: nada vai direto para a `main`; toda mudança passa por PR com as verificações verdes e o OK do Carlos.

- **0.2.0 lançada em 11/11/2026** (tag `v0.2.0`). Próxima: 0.3 (Productivity Core).

- 0.3: seção "De dias anteriores" na tela Hoje e no Planejar, com reagendar em um toque (`separarPendentes` e `descreverAnterior` em `src/lib/tarefas.ts`). Decisão de produto: o nome é "De dias anteriores", não "Atrasadas", e essas tarefas não pesam no progresso do dia (princípio 1: sem punição).

- 0.3: tarefas que se repetem (`supabase/ciclo12-recorrencia.sql`, `src/lib/series.ts`, `src/components/SerieForm.tsx`). A tabela `task_series` guarda a regra; a função `gerar_ocorrencias()` do banco cria a tarefa do dia quando o app carrega (uma por série por dia, sem duplicar entre aparelhos; `gerado_ate` impede que uma tarefa apagada volte). Decisões: dias sem abrir o app não geram tarefa (sem acúmulo); mudar a série vale só para as próximas; a regra existe nos dois lados (`serie_cai_em` no SQL e `serieCaiEm` no app) e o calendário da 0.4 deve usar `ocorrenciasEntre` para mostrar as futuras sem criá-las no banco.

- **0.3.0 lançada em 11/11/2026** (tag `v0.3.0`). Próximo passo: teste com 10 a 15 estudantes da saúde (portão antes da 0.4). Depois, 0.4 (Smart Planning).

- **Próximas etapas (decididas em 12/11/2026), antes do teste com estudantes:** revisão espaçada automática → check-in de energia e dia leve → atalhos no ícone e compartilhar para o WeUp. Ideias para depois (modo prova, semana de plantão, carta semanal do pet, estudar junto, retrospectiva do semestre, funcionar sem internet) e onde cada uma entra no plano: nota "Ideias de inovação" no cofre do Obsidian.

- Revisão espaçada (`supabase/ciclo13-revisoes.sql`, `src/lib/revisoes.ts`): colunas `revisao_de`/`revisao_n` em `tasks` com índice único; a regra de segurança usa a função `tarefa_e_minha` (uma regra de `tasks` não pode consultar a própria `tasks`). Revisão de etapa de projeto sai avulsa e pequena.

- Check-in de energia (`supabase/ciclo14-energia.sql`, `src/lib/energia.ts`, `src/components/CheckinEnergia.tsx`): tabela `daily_checkins`, uma linha por pessoa por dia. Energia baixa = dia leve (meta de 3, menores primeiro); alta = maiores primeiro. Não vale XP. Decisões: respostas "Baixa / Normal / Alta" (sem flexão de gênero) e dado opcional, citado na Privacidade por ser próximo de dado de bem-estar.

- Atalhos e compartilhar (`src/lib/atalhos.ts`, `shortcuts` e `share_target` no `vite.config.ts`): o atalho ou o compartilhamento chega como `/?acao=...` ou `/?title=&text=&url=`; o app lê uma vez, guarda na sessão (sobrevive ao login), limpa o endereço e a tela Hoje abre o formulário ou o foco. Só funciona no app instalado; "Compartilhar" só no Android. O Android pode levar até um dia para atualizar os atalhos de um app já instalado.

- **0.3.1 lançada em 12/11/2026** (tag `v0.3.1`): mostrar a senha, revisão espaçada, check-in de energia e atalhos/compartilhar. Próximo passo: 0.4 (Smart Planning).

- **Teste com estudantes cancelado em 12/11/2026** (decisão do Carlos e do Matheus). A 0.4 começa direto; as decisões de produto ficam com a dupla.

- 0.4 (em andamento): modelo de agenda (`supabase/ciclo15-agenda.sql`). Tarefa tem três datas que não se confundem: `data` (dia planejado), `prazo` (até quando precisa estar pronta) e `concluida_em`. Compromisso vira bloco: `hora`, `hora_fim` e `task_id` opcional. **Horário local, sem fuso:** 08:00 é 08:00 em qualquer aparelho (o Brasil não tem mais horário de verão); fim menor que o início = atravessa a meia-noite. Regras em `src/lib/agenda.ts` (`duracaoMinutos`, `descreverFim`, `validarHorario`).

- 0.4: tela Hoje com **prioridades do dia** (`supabase/ciclo16-prioridades.sql`, `src/lib/prioridades.ts`): até 3 ids de tarefas, em ordem, na coluna `daily_checkins.prioridades` (o registro do dia; a energia passou a ser opcional). Amanhã começa vazio. E **prazo chegando**: tarefas com prazo até amanhã planejadas para outro dia ou sem data.

- 0.4: foco com pausa e duração livre (`supabase/ciclo17-foco.sql`): `focus_sessions` ganha `pausada_em` e `pausa_segundos`; pausar e continuar só pelas funções `pausar_foco`/`retomar_foco` (a tabela continua sem permissão de alterar). `concluir_foco` desconta as pausas, recusa sessão pausada e só dá XP a partir de 15 min (`MIN_MINUTOS_XP`). Duração de 5 a 120 min. A pausa curta de 5 min depois da sessão fica só no aparelho.

- 0.4: revisão semanal (`supabase/ciclo18-revisao-semanal.sql`, `src/lib/revisaoSemanal.ts`, `src/components/RevisaoSemanal.tsx`). A tabela `weekly_reviews` guarda só as 4 respostas (uma linha por semana, marcada pela segunda-feira); os números da semana são calculados na hora. No domingo revisa a semana que termina, na segunda a que acabou ontem (`semanaRevisada`). A carta do pet é montada por regra (`cartaDoPet`), sem IA, e nunca fala do que faltou.

- **Pet Rework** (proposta completa no cofre: "Pet Rework — proposta"). Ciclo 1 (`supabase/ciclo19-pet-fundacao.sql`): o banco calcula o nível (`nivel_do_xp`, mesma curva de `xp.ts`, com teste de paridade) e o estágio (`estagio_do_nivel`: 1/5/10/15/25). O app só pode gravar `especie` e `nome` em `user_pets` (permissão por coluna); a evolução passa por `sincronizar_pet()`. **Toda mudança na curva de XP precisa ser feita nos dois lados.**

- **Atenção (12/11/2026):** o `teste-isolamento.sql` foi esvaziado sem querer antes do commit da revisão semanal e foi restaurado no ciclo 1 do Pet Rework. Antes de commitar, conferir o `git diff --stat`: arquivo que perde centenas de linhas sem motivo é sinal de problema.

- Pet Rework, ciclo 2: arte em camadas em `src/pets/arte.tsx` (corpos por espécie e estágio, `RostoPet` com 6 expressões, `encaixes()` para os cosméticos). `src/components/Pet.tsx` só monta as camadas (props novas: `expressao`, `parado`). Animações em `index.css` (`pet-parado-*`, `pet-piscar`, `pet-aura`). **Galeria de desenvolvimento:** `npm run dev` e abrir `/?galeria` mostra todas as formas e expressões (não vai para o app publicado).

- Pet Rework, ciclo 3: humor do pet em `src/pets/humor.ts` (`expressaoDoMomento`, `contextoDoMomento`, falas por espécie em `FALAS`) e `src/pets/momento.ts` (`momentoDoDia`, usado pela tela Hoje e pela aba Pets). Nova `src/screens/Pets.tsx` com palco + abas Companheiro e Evolução (as abas Visual e Diário entram nos ciclos 6 e 7).

- Pet Rework, ciclo 4: laço (`supabase/ciclo20-laco.sql`, `src/pets/laco.ts`). `laco_do_pet()` (security invoker) soma por dia: dia com ação no livro-razão, dia com 3+ ações e `daily_checkins.cuidou_do_pet`. Níveis em `MINIMOS_LACO` = `nivel_do_laco` no banco (teste de paridade). Interações em `INTERACOES` (Acariciar 1, Conversar 2, Observar 3); a conversa usa `assuntosDoDia` (só fatos do dia).

- Pet Rework, ciclo 5: caminhos (`supabase/ciclo21-caminhos.sql`, `src/pets/caminhos.ts`). `user_pets.caminho` só muda por `escolher_caminho()` (estágio 4+, uma vez). Nomes em `FORMAS`, sugestão em `caminhoSugerido` (atributo com mais XP). Cenas: `src/pets/EscolherCaminho.tsx` e `src/pets/Transformacao.tsx` (substituiu a comemoração antiga). A galeria (`/?galeria`) tem prévias das duas cenas. **Decisão:** a pessoa escolhe o caminho, com sugestão (recomendado no plano; não houve objeção).

- Pet Rework, ciclo 6: diário (`supabase/ciclo22-memorias.sql`, `src/pets/memorias.ts`, `src/pets/Diario.tsx`). Tabela `pet_memories` (só leitura para o app; única por pessoa e `chave`). `registrar_memorias()` (security definer) reconstrói os marcos a partir do livro-razão, das revisões, dos recomeços e do laço, com a data real; `escolher_caminho` passou a gravar a memória na hora. **Toda tabela nova entra no isolamento, no backup e em Baixar meus dados** (feito para `pet_memories`).

- Pet Rework, ciclo 7: visual (`supabase/ciclo23-visual.sql`, `src/pets/visual.ts`, `src/pets/itens.tsx`, `src/pets/Visual.tsx`). `user_pets.chapeu/acessorio/efeito`; desbloqueio **derivado das memórias** (sem tabela de inventário): `item_do_pet()` no banco = `ITENS` no app (teste de paridade), e o gatilho `conferir_visual_do_pet` recusa item bloqueado ou no espaço errado. Pontos de encaixe por espécie/estágio em `pontosDoCorpo`.

- Pet Rework, ciclo 8: habitat (`src/pets/habitat.ts`: `periodoDoDia`, `nivelDoHabitat`, `DECORACOES` por memória; cena em `src/pets/CenaHabitat.tsx`). Sem SQL: as decorações vêm das memórias do diário. Arquivos de componente e de regra não podem ter o mesmo nome com maiúscula diferente (Windows não distingue): por isso `CenaHabitat.tsx` e `AbaVisual.tsx`.

- Pet Rework, ciclo 9 (último): Brincar e Surpresa (`src/pets/brincar.ts`, interações de laço 4 e 5) e **Modo simples** (`modo_simples` nos metadados da conta, lido por `useAuth().modoSimples`; esconde aba Pets, pet, nível, XP e comemorações; o pet evolui sem cena). **Pet Rework concluído nos 9 ciclos.**

## Como publicar uma nova versão

Para versões com número, siga o checklist em `docs/RELEASE.md`.

A Vercel está ligada ao GitHub: **todo envio (`git push`) para a branch `main` publica sozinho** em https://weup-rose.vercel.app (leva ~30 s).

```
git add -A
git commit -m "O que mudou"
git push
```

Plano B (publicar direto do PC, sem passar pelo GitHub): `npx.cmd vercel@latest deploy --prod --yes`. Use `npx.cmd`, não `npx`: o PowerShell deste PC bloqueia scripts `.ps1`.

O arquivo `.env.local` criado pela Vercel tem uma chave temporária: não compartilhe (ele fica fora do Git).

## Configuração no painel do Supabase

- **Authentication → URL Configuration → Site URL:** `https://weup-rose.vercel.app`. É para onde o link de confirmação do e-mail leva.
- **Redirect URLs:** `http://localhost:5173` (para testar no PC) e `https://weup-rose.vercel.app`.
- A confirmação por e-mail vem ligada por padrão (Authentication → Sign In / Providers → Email → "Confirm email").
- **E-mails (SMTP próprio, desde 2026-11-11):** saem pelo Gmail `contato.weupdisciplina@gmail.com` (Authentication → Emails → SMTP Settings: host `smtp.gmail.com`, porta 587, usuário = o próprio e-mail, senha = **senha de app** do Google, criada com a verificação em 2 etapas ligada nessa conta). A senha de app NÃO fica no projeto. Limite de envio: Authentication → Rate Limits → 100/hora.
  - Se der "Error sending … email": ver Logs → **Auth** (não "Edge"); `535 BadCredentials` = senha de app errada ou criada na conta errada.
  - Os primeiros e-mails podem cair no spam (e o Gmail desativa os links lá). Avisar quem for testar para olhar o spam e marcar "Não é spam".
  - Futuro: domínio próprio + serviço como Resend para entregar melhor.
