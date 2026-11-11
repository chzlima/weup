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
- 2026-11-11 — "Esqueci minha senha": link na tela de login → e-mail do Supabase → ao abrir o link, tela "Criar senha nova" (`src/screens/NovaSenha.tsx`). Link vencido mostra aviso em português. Testado sem enviar e-mail de verdade; falta testar o caminho completo com um e-mail real.

## Como publicar uma nova versão

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
