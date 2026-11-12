# Changelog do WeUp!

O que mudou em cada versão. A mais nova fica no topo.
A versão que está rodando aparece no fim da tela **Perfil** (número + commit).

## Não lançado (a caminho da 0.4.0 — Smart Planning)

### Pet Rework — ciclo 1 (fundação)
- O pet passa a ter **5 estágios**: níveis 1, 5 e 10 (como antes), **15** e **25**. Os estágios 4 e 5 usam por enquanto o desenho do 3 com uma aura dourada; a arte nova vem no próximo ciclo.
- **Segurança:** o estágio do pet passa a ser decidido só pelo banco, a partir do XP de verdade (função `sincronizar_pet`). Antes o app gravava o estágio direto. Precisa rodar `supabase/ciclo19-pet-fundacao.sql`.
### Pet Rework — ciclo 2 (arte em camadas)
- **Formas novas** para os estágios 4 e 5 das três espécies (Bosque e Árvore Lendária, Fênix Real e Fênix Lendária, Tempestade e Céu Lendário), com aura dourada.
- **6 expressões**: feliz, animado, curioso, tranquilo, orgulhoso e pensativo (as telas passam a usá-las no próximo ciclo).
- **O pet se mexe parado:** o Broto balança, a Faísca tremula, a Gota flutua, e todos piscam. Quem ativa "reduzir movimento" no aparelho vê o pet parado.
- A arte agora é feita em camadas (corpo, rosto e pontos de encaixe para acessórios), pronta para chapéus e acessórios e para trocar por arte de ilustrador no futuro.

### Pet Rework — ciclo 3 (nova aba Pets)
- **Aba Pets redesenhada:** o pet em destaque num palco com a cor da espécie, o balão de fala e duas abas, **Companheiro** e **Evolução**. A Evolução mostra as 5 formas em linha do tempo, com o progresso até a próxima.
- **O pet reage ao seu dia**, aqui e na tela Hoje: curioso quando o dia ainda não começou, feliz e animado conforme você faz coisas, orgulhoso quando termina tudo ou as prioridades, tranquilo no dia leve e à noite, pensativo no domingo e na segunda. Nunca triste.
- **Cada espécie fala do seu jeito**: o Broto fala devagar sobre crescer, a Faísca é intensa, a Gota observa e pergunta. 45 falas, nenhuma de cobrança (um teste confere).

### Pet Rework — ciclo 4 (laço e interações)
- **Laço com o pet** (aba Pets → Companheiro): cresce com os **dias** em que vocês caminham juntos (dia com alguma ação, dia com 3 ou mais ações e dia em que você interagiu com o pet). Até 3 pontos por dia, então não dá para farmar. Nunca diminui por descansar e não dá XP. Níveis de 1 a 10.
- **Interações:** Acariciar (como antes, e o primeiro carinho do dia conta para o laço); **Conversar** (laço 2): o pet comenta o seu dia de verdade, como o compromisso de hoje, a prioridade aberta, um prazo ou o que você já fez; **Observar** (laço 3): só o pet, em tela cheia, num momento de calma.
- Política de privacidade: passa a citar o laço com o pet. Precisa rodar `supabase/ciclo20-laco.sql`.

### Pet Rework — ciclo 5 (caminhos e transformação)
- **Caminhos de evolução:** no estágio 4 (nível 15) o pet segue um de três caminhos (conhecimento, saúde ou organização), cada um com forma própria e forma lendária. São 18 formas nas três espécies, como Árvore do Saber, Fênix Vital e Cristal de Gelo. A pessoa escolhe numa cena especial; o app marca "Combina com você" no atributo em que ela mais evoluiu. A escolha é uma vez só e o banco confere.
- **Nova cena de evolução:** a forma antiga brilha, um clarão, e a nova aparece com o nome.
- Precisa rodar `supabase/ciclo21-caminhos.sql` **antes** do merge (o app passa a ler a coluna `caminho`).

### Pet Rework — ciclo 6 (diário de memórias)
- **Aba Diário** em Pets: os marcos da jornada com a data real, do mais recente para o mais antigo, agrupados por mês. Entram o dia em que vocês se conheceram, as primeiras vezes (tarefa, hábito, foco, projeto), os marcos de 1.000, 5.000, 10.000 e 25.000 XP, os níveis 5 a 25, cada evolução (com a forma do pet), a primeira revisão da semana, o primeiro recomeço, cada nível de laço e o caminho escolhido.
- As memórias são criadas só pelo banco, a partir do histórico, uma vez cada; quem já usava o app ganha o passado reconstruído. O diário é privado.
- Política de privacidade: passa a citar o diário. Precisa rodar `supabase/ciclo22-memorias.sql`.

- **Corrigido:** o teste de isolamento (`supabase/teste-isolamento.sql`) tinha sido esvaziado sem querer na revisão semanal; foi restaurado, com as verificações da revisão semanal e do pet.

### Adicionado
- **Prazo nas tarefas** (opcional): "até quando precisa estar pronta", separado do dia em que você planeja fazer. Aparece na lista como "prazo hoje", "prazo amanhã", "prazo em 3 dias"; prazo passado vira só "o prazo era 10 de nov.", sem cobrança.
- **Horário de fim nos compromissos** (opcional): "das 08:00 até 10:00". Fim antes do início atravessa a meia-noite ("até 07:00 do dia seguinte"), para plantões noturnos.
- Base para o calendário: um compromisso pode ficar ligado a uma tarefa (a tela para isso vem com o calendário). Precisa rodar `supabase/ciclo15-agenda.sql`.
- **Prioridades de hoje** na tela Hoje: toque na ☆ de até 3 tarefas do dia para marcar o que mais importa. Elas sobem para uma seção própria, na ordem escolhida (↑ Subir / ↓ Descer). Amanhã a lista começa vazia. No dia leve, as prioridades contam nas 3 coisas do dia.
- **Prazo chegando** na tela Hoje: tarefas planejadas para outro dia (ou sem data) cujo prazo é até amanhã, com o botão "Fazer hoje". Precisa rodar `supabase/ciclo16-prioridades.sql`.
- **Foco com pausa:** botões **Pausar** e **Continuar**; o tempo pausado não conta, e a sessão continua certa mesmo fechando e abrindo o app.
- **Duração livre no foco:** além de 15, 25 e 50 min, "Outra" (de 5 a 120 minutos). Sessões a partir de 15 minutos valem XP; as mais curtas contam como tempo focado, sem XP.
- **Pausa curta depois do foco:** "Pausa de 5 min", com aviso quando acaba. Precisa rodar `supabase/ciclo17-foco.sql`.
- **Revisão semanal** (Evoluir, e lembrete na tela Hoje no domingo e na segunda): os fatos da semana (tarefas, hábitos, tempo de foco e XP), uma **carta do pet** que reconhece o que aconteceu sem cobrar o que faltou, e quatro perguntas opcionais: o que avançou, o que travou, o que muda e as prioridades da próxima semana. Dá para editar até a semana virar. Precisa rodar `supabase/ciclo18-revisao-semanal.sql`.
- Política de privacidade: passa a citar as respostas da revisão semanal.

## 0.3.1 — Pronto para o teste (12/11/2026)

Três melhorias antes do teste com estudantes da saúde, mais o botão de ver a senha. Os números de versão seguem as fases do plano; esta leva ainda faz parte da 0.3.

### Adicionado
- Botão de **mostrar a senha** (ícone de olho) nos campos de senha: entrar, criar conta e criar senha nova. Ajuda a corrigir um erro de digitação antes de enviar.
- **Revisão espaçada:** ao concluir uma tarefa de estudo, o app pergunta "Revisar depois?". Um toque agenda três revisões rápidas (amanhã, em 7 e em 30 dias), como tarefas pequenas marcadas com "revisão 1 de 3". Não duplica e não oferece de novo para a mesma tarefa. Precisa rodar `supabase/ciclo13-revisoes.sql`.
- **Check-in de energia:** na tela Hoje, um toque opcional por dia: energia baixa, normal ou alta. Energia baixa vira **dia leve**: a lista mostra só 3 coisas, das menores para as maiores, o progresso conta só essas 3 ("Dia leve cumprido 🌱") e "De dias anteriores" fica recolhido. Energia alta põe as tarefas maiores primeiro. Não vale XP. Precisa rodar `supabase/ciclo14-energia.sql`.
- **Atalhos no ícone do app:** segurar o ícone do WeUp! no celular mostra "Nova tarefa" e "Iniciar foco".
- **Compartilhar → WeUp!** (Android, com o app instalado): um texto ou link compartilhado de outro app abre o formulário de tarefa nova já preenchido.

### Mudado
- Política de privacidade: passa a citar o check-in de energia. Quem já tinha conta vê o aviso "Atualizamos a política de privacidade".

## 0.3.0 — Productivity Core (11/11/2026)

Tarefas mais fáceis de manter em dia: o que ficou para trás aparece separado e sem cobrança, e o que é rotina se repete sozinho.

### Adicionado
- Seção **"De dias anteriores"** na tela Hoje: as tarefas que ficaram para trás aparecem separadas, com de quando são ("de ontem", "de 3 dias atrás") e botões para trazer para **Hoje**, deixar para **Amanhã** ou tirar a data (**Sem data**). Com mais de uma, há o atalho "Trazer tudo para hoje".
- O mesmo grupo "De dias anteriores" na lista de tarefas do Planejar.
- **Tarefas que se repetem** (Planejar → Tarefas → Repetições, ou "Repetir esta tarefa…" ao criar uma tarefa): todo dia, em dias da semana ou num dia do mês. No dia certo a tarefa aparece sozinha, como uma tarefa comum; editar ou apagar essa tarefa não mexe na repetição. Dias em que o app não foi aberto não geram tarefa, então nada se acumula numa pausa. Precisa rodar `supabase/ciclo12-recorrencia.sql`.

### Mudado
- Tarefas de dias anteriores deixaram de contar no "Progresso de hoje": só entram quando a pessoa traz para hoje. O dia não começa mais devendo.

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
