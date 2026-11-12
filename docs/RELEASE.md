# Como lançar uma versão do WeUp!

Vale para versões com número (0.2.0, 0.3.0…). Correções pequenas do dia a dia seguem só os passos 1 a 3.

## Antes do merge

1. **PR com tudo verde.** O GitHub roda sozinho os testes, a compilação e a checagem de dependências (aba *Checks* do PR).
   No PC, o mesmo é `npm test` e `npm run build`.
2. **Banco primeiro.** Se a versão tem arquivo novo em `supabase/`, rode no SQL Editor **antes** do merge.
   Os SQLs só acrescentam coisas, então o app antigo continua funcionando com o banco novo.
3. **Testar na prévia do PR** (`weup-git-<branch>-weup4.vercel.app`), no celular, com uma conta de teste:
   - [ ] entrar e sair
   - [ ] criar, concluir e desmarcar uma tarefa (o XP sobe e volta)
   - [ ] marcar e desmarcar um hábito
   - [ ] criar um compromisso
   - [ ] iniciar e desistir de um foco
   - [ ] abrir Evoluir, Pets e Perfil sem erro
   - [ ] a função nova da versão, do jeito que uma pessoa usaria
4. **Isolamento entre contas.** Se mudou tabela ou regra de segurança: incluir a tabela na lista `tabelas` de
   `supabase/teste-isolamento.sql`, rodar no SQL Editor e conferir que tudo dá "ok".
5. **Backup.** Antes de qualquer SQL que altere ou apague dados existentes, rodar um backup à mão (ver `docs/BACKUP.md`).
6. **Privacidade.** Se o texto de `src/screens/Privacidade.tsx` mudou, atualizar `POLITICA_VERSAO` e `POLITICA_ATUALIZADA_EM` em
   `src/lib/privacidade.ts`: é isso que faz o aviso aparecer para quem já tem conta.

## Lançar

7. Atualizar o `CHANGELOG.md`: trocar "Não lançado" pelo número e a data.
8. Subir o número em `package.json` (`"version"`). É ele que aparece no fim do Perfil.
9. Fazer o merge do PR. A Vercel publica sozinha em ~30 s.
10. Marcar a versão:
   ```
   git checkout main
   git pull
   git tag v0.2.0
   git push origin v0.2.0
   ```

## Depois de publicar

11. Abrir o app instalado no celular: deve aparecer **Atualização disponível**. Tocar em **Atualizar** e conferir no
    fim do Perfil que o número e o commit mudaram.
12. Repetir a lista do passo 3 em produção, rapidamente.

## Se der errado (rollback)

**O app quebrou.** Voltar para a publicação anterior, sem mexer no código:
painel da Vercel → projeto `weup` → *Deployments* → na publicação anterior que funcionava → **⋯ → Promote to Production**
(ou *Instant Rollback*). Leva segundos. Quem está com o app aberto recebe o aviso de atualização e volta para a versão boa.

Depois, com calma, desfazer no código para a `main` voltar a bater com o que está no ar:

```
git checkout main
git pull
git revert -m 1 <commit do merge>
git push
```

**O problema está no banco.** Os SQLs do projeto só acrescentam tabelas, colunas e funções; a versão antiga do app
ignora o que é novo, então normalmente basta o rollback do app. Se um SQL alterou ou apagou dados, restaurar o backup
do passo 5.

**Regra:** primeiro voltar para o que funcionava, depois investigar. Não tentar consertar em produção com pressa.
