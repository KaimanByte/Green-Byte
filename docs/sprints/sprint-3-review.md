# Sprint Review e Retrospectiva — Sprint 3

> Registro interno consolidado em 22/11/2026 para a issue #25. Este documento diferencia a revisão técnica realizada no repositório de uma Sprint Review com retorno externo, que ainda não foi registrada.

## Revisão das entregas

| Entrega | Situação verificada | Evidência |
|---|---|---|
| Gestão de usuários e papéis (#107) | Concluída | Gestão, guardas de papel e testes presentes. |
| Saúde e configuração dinâmica da coleta (#109) | Concluída | Estado de ciclo, reprogramação, polling limitado e testes presentes. |
| Testes de ranking, comparação e autenticação (#82) | Concluída | Casos de sucesso/falha e doubles presentes no código atual. |
| Auditoria (#108) | Concluída | E2E HTTP real cobre autenticação, proteção de rota, alteração temporária da configuração, escrita e leitura do registro de auditoria. |
| Configuração e login do frontend (#70 e #71) | Parciais | Há funcionalidade implementada, mas ainda faltam critérios de documentação e rota/redirecionamento. |
| Qualidade (#81) | Pendente | O refactor associado foi majoritariamente revertido; os critérios devem ser refeitos no código final. |

## Retorno da revisão

Não foi registrado retorno de usuário, cliente ou professor nesta Sprint. A revisão acima é técnica e interna; ela não deve ser apresentada como validação externa.

## Retrospectiva

### O que funcionou

- A área administrativa passou a concentrar coleta, modelo de energia, usuários e auditoria.
- O intervalo efetivo da coleta passou a orientar o polling do dashboard, com teto de 60 segundos.
- A equipe preservou funcionalidades de administração, autenticação e auditoria no `dev` atual depois da reconciliação dos commits.

### Dificuldades

- Commits revertidos e reintroduzidos tornaram o estado do Project diferente do código final em alguns itens, especialmente #81 e #82.
- O E2E real havia sido substituído por um teste de “Hello World”, eliminando a evidência integrada de autenticação, configuração e auditoria até sua restauração nesta revisão.
- Não houve avaliação formal de usabilidade registrada; logo #77 e #78 não podem ser dadas como concluídas por inferência.

### Ações de melhoria

1. Vincular cada pull request à issue e só mover para `Feito` após validar os critérios no código que permanece em `dev`.
2. Executar o E2E HTTP contra ambiente descartável antes do encerramento e manter seus parâmetros documentados.
3. Registrar responsáveis, capacidade e mudanças de escopo no início da sprint seguinte.
4. Atualizar `docs/backlog.md` junto de cada mudança relevante no Project.

## Pendências para o fechamento

As pendências técnicas e documentais vigentes estão em `docs/sprints/sprint-3.md`. A Sprint não deve ser marcada como finalizada antes de atualizar #67, #70, #71, #75, #77/#78, #81 e #83.
