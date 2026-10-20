# Entregas e evidências — Sprint 1

**Projeto:** Green Byte · **Período:** 2026-2 · **Fechamento previsto:** 20/10/2026
**Snapshot:** 20/10/2026

**Escopo:** somente a Sprint 1 e o trabalho registrado neste ciclo; sem funcionalidades de sprints futuras.

> **Nota sobre a rubrica:** a rubrica do professor determina que o plano completo apresente as três sprints antes da primeira entrega. Este documento foi reduzido à Sprint 1 para registrar o que foi feito neste ciclo; sozinho, ele não substitui o planejamento das demais sprints caso o professor cobre esse requisito.

---

## 1. Resumo do ciclo

O objetivo da Sprint 1 foi estabelecer a base do Green Byte: repositório e fluxo de trabalho, ambiente de execução, integração inicial com serviços e métricas, persistência, API inicial, primeiro fluxo do frontend, testes e atividades iniciais de UX.

O snapshot local do GitHub Project foi sincronizado em 20/10/2026 às 00:56 (-03:00). Das 27 tarefas listadas para a Sprint 1, 23 estavam em **Feito** e 4 em **Em progresso**. Esses números descrevem o status do quadro; não são uma nota nem uma confirmação independente de que todos os critérios de aceite foram comprovados.

| Situação no GitHub Project | Quantidade | Leitura |
| --- | :---: | --- |
| Feito | 23 | Cartão marcado como concluído no Project; conferir o aceite e a evidência da issue. |
| Em progresso | 4 | Trabalho ainda aberto no snapshot: plano, DoD, review/retrospectiva e fechamento/tag. |
| **Total na Sprint 1** | **27** | |

---

## 2. Trabalho realizado e estado registrado

Os nomes abaixo foram expandidos a partir da lista da equipe no README. Os responsáveis são os que aparecem nas issues do GitHub Project; isso identifica a atribuição registrada e deve ser acompanhado pelos commits, PRs e artefatos individuais na avaliação de GA09.

| Frente | Entrega desta Sprint 1 | Responsáveis registrados | Issues e estado no snapshot |
| --- | --- | --- | --- |
| Gestão e organização | Repositório inicial; Project, labels e milestones; backlog priorizado; fluxo Git; planejamento da Sprint 1. | Thiago Guedes; Erick Rost; Rafael Melo; Gabriel Oliveira | #12, #13, #14, #17, #18 — Feito |
| Ambiente e scaffolds | Estruturas iniciais do backend NestJS/TypeScript e frontend React/TypeScript; containers de frontend, backend e PostgreSQL via Docker Compose. | Thiago Guedes | #27, #28, #29 — Feito |
| Descoberta técnica e documentação | Leitura dos contratos Swagger das APIs externas; escopo/fórmula inicial; documentação da arquitetura. | Thiago Guedes; Erick Rost | #31, #32, #33 — Feito |
| Integração com serviços | Descoberta de serviços pelo agregador e coleta de métricas por serviço. | Erick Rost | #34, #35 — Feito |
| Persistência | Escolha/configuração do ORM e PostgreSQL; entidades, migrações iniciais e repositories de serviços/coletas. | João Pedro; Thiago Guedes | #38, #39, #40 — Feito |
| API do backend | Endpoint `GET /services` e documentação Swagger dos endpoints implementados. | Erick Rost; João Pedro; Thiago Guedes | #51, #54 — Feito |
| Frontend e UX inicial | Camada de acesso à API/provider; listagem de serviços na tela inicial; identificação de usuários/tarefas e protótipo/fluxo de navegação. | João Pedro; João Lorena; Gabriel Oliveira | #56, #57, #73, #74 — Feito |
| Qualidade | Configuração do Jest e script para executar testes. | João Pedro | #79 — Feito |
| Pendências de gestão e fechamento | Elaborar/validar este plano; validar e aplicar a DoD; registrar Sprint Review e retrospectiva; concluir fechamento e publicar a tag `sprint-1`. | Sem responsável indicado no snapshot consultado | #15, #16, #19, #20 — Em progresso |

---

## 3. Critérios da rubrica relacionados à Sprint 1

A rubrica oficial mantém as pontuações originais. A seleção abaixo acompanha o trabalho efetivamente incluído no Sprint Backlog e soma **80 pontos máximos** se a equipe confirmar essa distribuição com o professor. O status mostrado é evidência/status do Project; a nota de cada critério depende da conferência de funcionamento e da avaliação docente.

| Critério e valor oficial | Evidência desta Sprint 1 | Situação observável / verificação pendente |
| --- | --- | --- |
| **GA01** — Product Backlog (5) | Backlog e issues priorizadas: #14, backlog versionado. | Issue Feita no Project. Conferir prioridades, cobertura dos requisitos e critérios de aceite. |
| **GA02** — Planejamento da sprint (5) | Planejamento da Sprint 1: #18. | Issue Feita no Project. Conferir objetivo, capacidade, seleção e histórico de alterações. |
| **GA03** — Histórias e critérios de aceite (5) | Issues do Sprint Backlog, incluindo #14. | Conferir critérios verificáveis nas issues; o snapshot do backlog registra caixas de aceite desmarcadas em issues Feitas. |
| **GA04** — Acompanhamento e rastreabilidade (4) | Estados no Project, issues vinculadas e snapshot em `backlog.md`. | Evidência parcial: o snapshot registra o estado, mas a avaliação também precisa conferir histórico de mudanças, impedimentos e vínculos com PRs/commits. |
| **GA05** — Execução incremental (3) | Histórico de commits e PRs locais entre 17 e 19/10/2026; tarefas associadas às issues acima. | Há atividade no histórico; conferir distribuição temporal e ligação de cada entrega com o planejamento. |
| **GA06** — Review, retrospectiva e adaptação (4) | #19 — Sprint Review e Retrospectiva. | Em progresso no Project; falta registrar resultados, dificuldades e ações de melhoria. |
| **GA07** — Definition of Done e aplicação (3) | #16 — DoD e proposta versionada. | Em progresso no Project; falta validar adoção e demonstrar a aplicação nos itens marcados como Feito. |
| **GA08** — Documentação e reprodutibilidade (3) | README, arquitetura, APIs externas, cálculos e este relatório. | Documentos existentes. Conferir comandos em ambiente limpo, completar instruções de verificação e relacionar à versão entregue. |
| **GA09** — Colaboração e participação (8) | Tarefas atribuídas aos seis integrantes na tabela da seção 4; issues e histórico do Git. | Evidências indicam responsáveis e atividade; conferir commits/PRs identificáveis por pessoa e contribuição relevante. A rubrica reserva 8/4/0 pontos conforme a cobertura da equipe. |
| **DW01** — Tecnologias obrigatórias (3) | Scaffold React/TypeScript e NestJS/TypeScript: #27, #28. | Feito no Project; verificar build/execução da versão entregue. |
| **DW02** — Integração com APIs auxiliares (5) | Contratos, descoberta e métricas: #32, #34, #35, `api-externas.md`. | Itens da descoberta e métricas Feitos no Project; verificar chamadas, respostas e falhas. Não incluí funcionalidades de outras sprints neste relatório. |
| **DW03** — Backend e API REST (4) | Módulos/repositories e endpoint/documentação: #40, #51, #54. | Feito no Project; executar endpoint e conferir separação de responsabilidades, respostas e Swagger. |
| **DW04** — PostgreSQL e ORM (4) | ORM, esquema, migrações e repositories: #38, #39, #40. | Feito no Project; aplicar migrações em banco vazio e verificar gravação/consulta. |
| **DW05** — Organização e integração do frontend (3) | Provider/API e listagem inicial: #56, #57. | Feito no Project; verificar fluxo funcional da interface até o backend. |
| **DW07** — Execução/documentação da API (3) | Docker Compose #29 e instruções no README. | Feito no Project; conferir inicialização e verificação a partir de ambiente limpo. |
| **TP01** — Responsabilidades e SOLID (4) | Organização documentada em `arquitetura.md` e estrutura do backend. | Evidência documental existente; confirmar princípios no código real, sem inferir atendimento só pela presença de arquivos. |
| **TP02** — Injeção e desacoplamento (4) | Providers e dependências do backend; integração e persistência nas issues #34 e #40. | Conferir providers e substituição por doubles nos testes. |
| **TP04** — Testes unitários (4) | Configuração/script Jest: #79. | Issue Feita no Project; a rubrica exige testes significativos, então conferir casos cobertos e execução da suíte. |
| **IHC01** — Usuários e tarefas (3) | #73 — Identificar usuários e tarefas. | Feito no Project; confirmar que perfis e tarefas estão registrados em artefato acessível no GitHub. |
| **IHC02** — Fluxos e protótipos (3) | #74 — Protótipo e navegação. | Feito no Project; confirmar que o protótipo/fluxo está anexado à issue ou versionado e acessível. |

> **Importante:** os códigos GA-01, GA-02 etc. usados como identificadores das tarefas no backlog **não** são automaticamente os critérios GA01, GA02 etc. da rubrica. Por exemplo, a tarefa GA-04 do quadro trata do plano de entregas, enquanto o critério GA04 do professor avalia acompanhamento e rastreabilidade. A associação acima foi feita pelo conteúdo, não pela semelhança do código.

---

## 4. Integrantes e contribuições registradas

Esta relação usa os responsáveis atribuídos às issues da Sprint 1 e os nomes publicados no README. Para GA09, mantenha links diretos a commits/PRs individuais na própria issue ou na avaliação; a atribuição da issue sozinha não prova autoria do trabalho.

| Integrante | Tarefas / contribuição associada | Evidência para conferência |
| --- | --- | --- |
| Thiago Guedes | Estrutura do repositório; scaffolds; Docker Compose; spike dos contratos; persistência/repositories; Swagger. | #12, #27–#29, #32, #39, #40, #54 |
| Erick Rost | Project/backlog/fluxo Git; documentação da arquitetura; fórmula e integrações de serviços/métricas; API/Swagger. | #13, #14, #17, #31, #33–#35, #51, #54 |
| Rafael Melo | Configuração do Project, backlog priorizado, fluxo de trabalho Git e planejamento da Sprint 1. | #13, #14, #17, #18 |
| João Pedro | ORM e PostgreSQL; modelos/migrações e repositories; endpoint de serviços; provider de API; configuração de testes. | #38–#40, #51, #56, #79 |
| João Lorena | Listagem inicial de serviços no frontend; identificação de usuários/tarefas; protótipo e fluxo. | #57, #73, #74 |
| Gabriel Oliveira | Planejamento da Sprint 1; identificação de usuários/tarefas; protótipo e fluxo de navegação. | #18, #73, #74 |

---

## 5. Pendências para considerar a Sprint 1 fechada

- [ ] Concluir e validar o plano de entregas em **#15**.
- [ ] Validar a Definition of Done e aplicá-la aos itens declarados como Feito em **#16**.
- [ ] Registrar a demonstração, o retorno, a retrospectiva e as ações de melhoria em **#19**.
- [ ] Revisar os critérios de aceite ainda desmarcados, registrar instruções reproduzíveis de execução/verificação e publicar a tag `sprint-1` em **#20**.
- [ ] Completar evidências acessíveis de protótipo/usuários e vincular contribuições individuais a commits, PRs ou artefatos, especialmente para GA09 e IHC01/IHC02.

---

## 6. Fontes e limite desta versão

- GitHub Project #3 e snapshot sincronizado em `backlog.md`, datado de 20/10/2026 às 00:56 (-03:00).
- Issues do repositório `KaimanByte/Green-Byte`, listadas em cada entrega.
- Histórico local de commits consultado até 20/10/2026.
- Rubrica "3DSM - Proposta de rubrica de avaliação das sprints".

O relatório não atribui nota docente nem declara aprovação funcional com base apenas no status do Project. O professor deve validar a pontuação após conferir código, testes, documentos, histórico, PRs e evidências do protótipo. O status do quadro consultado também não é uma atualização em tempo real.
