# Product Backlog — Green-Byte

> Este documento é um retrato versionado do [GitHub Project #3](https://github.com/orgs/KaimanByte/projects/3), sincronizado em 10/11/2026. O Project e as issues são a fonte de verdade operacional: a issue contém a descrição e os critérios de aceite; este arquivo registra a organização vigente por sprint, a situação da issue e a rastreabilidade.

## Como ler este backlog

- **Sprint** é o milestone atualmente definido no Project.
- **Situação** é o estado da issue no GitHub (`fechada` ou `aberta`), e não uma inferência a partir do código.
- **Responsáveis** são os membros atribuídos à issue. A ausência de nome significa que o Project ainda não tem responsável atribuído.
- Itens concluídos continuam na sprint em que foram entregues; não são deslocados para Sprint 3 apenas por já estarem fechados.
- Critérios de aceite, discussões, evidências e pull requests permanecem nas respectivas issues, para não haver uma cópia divergente neste arquivo.

## Épicos do Project

| Issue | Épico | Progresso de subissues no Project |
|---|---|---:|
| [#1](https://github.com/KaimanByte/Green-Byte/issues/1) | E01 · Gestão ágil do projeto | 10/15 |
| [#2](https://github.com/KaimanByte/Green-Byte/issues/2) | E02 · Arquitetura, ambiente e infraestrutura | 4/4 |
| [#3](https://github.com/KaimanByte/Green-Byte/issues/3) | E03 · Integração com as APIs auxiliares | 6/6 |
| [#4](https://github.com/KaimanByte/Green-Byte/issues/4) | E04 · Persistência (PostgreSQL + ORM) | 4/4 |
| [#5](https://github.com/KaimanByte/Green-Byte/issues/5) | E05 · Cálculo de energia e CO₂e | 5/5 |
| [#6](https://github.com/KaimanByte/Green-Byte/issues/6) | E06 · Monitoramento dinâmico e estados | 4/4 |
| [#7](https://github.com/KaimanByte/Green-Byte/issues/7) | E07 · API REST do backend | 5/5 |
| [#8](https://github.com/KaimanByte/Green-Byte/issues/8) | E08 · Dashboard (frontend) | 11/12 |
| [#9](https://github.com/KaimanByte/Green-Byte/issues/9) | E09 · Autenticação e configuração | 3/5 |
| [#10](https://github.com/KaimanByte/Green-Byte/issues/10) | E10 · Interação Humano-Computador | 3/6 |
| [#11](https://github.com/KaimanByte/Green-Byte/issues/11) | E11 · Qualidade e documentação final | 1/4 |

## Sprint 1

**Situação:** 34 de 34 issues fechadas.

| Issue | Item | Responsáveis |
|---|---|---|
| [#12](https://github.com/KaimanByte/Green-Byte/issues/12) | GA-01 · Criar o repositório único e a estrutura inicial | Thiago-Tolosa |
| [#13](https://github.com/KaimanByte/Green-Byte/issues/13) | GA-02 · Configurar o GitHub Project, labels e milestones | erickrost, RafaelPMR |
| [#14](https://github.com/KaimanByte/Green-Byte/issues/14) | GA-03 · Registrar o Product Backlog priorizado | erickrost, RafaelPMR |
| [#15](https://github.com/KaimanByte/Green-Byte/issues/15) | GA-04 · Elaborar e validar o docs/plano-de-entregas.md | RafaelPMR |
| [#16](https://github.com/KaimanByte/Green-Byte/issues/16) | GA-05 · Definir a Definition of Done | RafaelPMR |
| [#17](https://github.com/KaimanByte/Green-Byte/issues/17) | GA-06 · Definir o fluxo de trabalho Git | erickrost, RafaelPMR |
| [#18](https://github.com/KaimanByte/Green-Byte/issues/18) | GA-07 · Planejamento da Sprint 1 | GabrielOlsa, RafaelPMR |
| [#19](https://github.com/KaimanByte/Green-Byte/issues/19) | GA-08 · Sprint Review e Retrospectiva da Sprint 1 | RafaelPMR |
| [#20](https://github.com/KaimanByte/Green-Byte/issues/20) | GA-09 · Fechamento e entrega da Sprint 1 | RafaelPMR |
| [#27](https://github.com/KaimanByte/Green-Byte/issues/27) | IN-01 · Criar o scaffold do backend | Thiago-Tolosa |
| [#28](https://github.com/KaimanByte/Green-Byte/issues/28) | IN-02 · Criar o scaffold do frontend | Thiago-Tolosa |
| [#29](https://github.com/KaimanByte/Green-Byte/issues/29) | IN-03 · Containerizar frontend, backend e PostgreSQL | Thiago-Tolosa |
| [#31](https://github.com/KaimanByte/Green-Byte/issues/31) | DOC-01 · Documentar a arquitetura inicial | erickrost |
| [#32](https://github.com/KaimanByte/Green-Byte/issues/32) | IT-01 · Ler os Swagger das APIs | Thiago-Tolosa |
| [#33](https://github.com/KaimanByte/Green-Byte/issues/33) | IT-02 · Conferir fórmula e escopo de cálculo | erickrost |
| [#34](https://github.com/KaimanByte/Green-Byte/issues/34) | IT-03 · Consumir `/services` do Agregador | erickrost |
| [#35](https://github.com/KaimanByte/Green-Byte/issues/35) | IT-04 · Coletar `/metrics/{id_servico}` | erickrost |
| [#36](https://github.com/KaimanByte/Green-Byte/issues/36) | IT-05 · Consumir API de intensidade de carbono | Thiago-Tolosa |
| [#38](https://github.com/KaimanByte/Green-Byte/issues/38) | DB-01 · Escolher ORM e configurar PostgreSQL | JoaoPedroLuvisariSeveriano |
| [#39](https://github.com/KaimanByte/Green-Byte/issues/39) | DB-02 · Modelar entidades e migrações iniciais | Thiago-Tolosa, JoaoPedroLuvisariSeveriano |
| [#40](https://github.com/KaimanByte/Green-Byte/issues/40) | DB-03 · Criar repositories de serviços e coletas | Thiago-Tolosa, JoaoPedroLuvisariSeveriano |
| [#46](https://github.com/KaimanByte/Green-Byte/issues/46) | CA-05 · Documentar fórmulas, unidades e exemplos | erickrost |
| [#51](https://github.com/KaimanByte/Green-Byte/issues/51) | API-01 · Endpoint `GET /services` | erickrost, JoaoPedroLuvisariSeveriano |
| [#54](https://github.com/KaimanByte/Green-Byte/issues/54) | API-04 · Documentar endpoints com Swagger | erickrost, Thiago-Tolosa |
| [#56](https://github.com/KaimanByte/Green-Byte/issues/56) | FE-01 · Camada de acesso à API e provider de dados | JoaoPedroLuvisariSeveriano |
| [#57](https://github.com/KaimanByte/Green-Byte/issues/57) | FE-02 · Listar serviços do backend na tela inicial | JoaoLorena0 |
| [#58](https://github.com/KaimanByte/Green-Byte/issues/58) | FE-03 · Dashboard operacional por serviço | JoaoLorena0 |
| [#59](https://github.com/KaimanByte/Green-Byte/issues/59) | FE-04 · Cards de indicadores consolidados | GabrielOlsa |
| [#60](https://github.com/KaimanByte/Green-Byte/issues/60) | FE-05 · Atualização automática e última atualização | Thiago-Tolosa |
| [#64](https://github.com/KaimanByte/Green-Byte/issues/64) | FE-09 · Ranking de impacto | erickrost, Thiago-Tolosa |
| [#66](https://github.com/KaimanByte/Green-Byte/issues/66) | FE-11 · Mapa geográfico dos serviços | JoaoLorena0, GabrielOlsa |
| [#73](https://github.com/KaimanByte/Green-Byte/issues/73) | UX-01 · Identificar usuários e tarefas prioritárias | JoaoLorena0, GabrielOlsa |
| [#74](https://github.com/KaimanByte/Green-Byte/issues/74) | UX-02 · Protótipo das principais telas e fluxo de navegação | JoaoLorena0, GabrielOlsa |
| [#79](https://github.com/KaimanByte/Green-Byte/issues/79) | QA-01 · Configurar testes (Jest) e script de execução | JoaoPedroLuvisariSeveriano |

## Sprint 2

**Situação:** 22 de 24 issues fechadas. Permanecem abertas apenas as issues [#22](https://github.com/KaimanByte/Green-Byte/issues/22) e [#23](https://github.com/KaimanByte/Green-Byte/issues/23), referentes ao encerramento da própria sprint.

| Issue | Situação | Item | Responsáveis |
|---|---|---|---|
| [#21](https://github.com/KaimanByte/Green-Byte/issues/21) | fechada | GA-10 · Planejamento da Sprint 2 | GabrielOlsa, RafaelPMR |
| [#22](https://github.com/KaimanByte/Green-Byte/issues/22) | aberta | GA-11 · Sprint Review e Retrospectiva da Sprint 2 | — |
| [#23](https://github.com/KaimanByte/Green-Byte/issues/23) | aberta | GA-12 · Fechamento e entrega da Sprint 2 | — |
| [#37](https://github.com/KaimanByte/Green-Byte/issues/37) | fechada | IT-06 · Agendar coleta periódica | erickrost |
| [#41](https://github.com/KaimanByte/Green-Byte/issues/41) | fechada | DB-04 · Histórico de coletas por período | JoaoPedroLuvisariSeveriano |
| [#42](https://github.com/KaimanByte/Green-Byte/issues/42) | fechada | CA-01 · Calcular potência | erickrost |
| [#43](https://github.com/KaimanByte/Green-Byte/issues/43) | fechada | CA-02 · Calcular energia e emissão | erickrost, Thiago-Tolosa |
| [#44](https://github.com/KaimanByte/Green-Byte/issues/44) | fechada | CA-03 · Tratar dados ausentes ou inválidos | RafaelPMR |
| [#45](https://github.com/KaimanByte/Green-Byte/issues/45) | fechada | CA-04 · Indicadores agregados do ambiente | JoaoPedroLuvisariSeveriano |
| [#47](https://github.com/KaimanByte/Green-Byte/issues/47) | fechada | MD-01 · Classificar estado de cada serviço | erickrost, Thiago-Tolosa |
| [#48](https://github.com/KaimanByte/Green-Byte/issues/48) | fechada | MD-02 · Reconciliar lista de serviços | Thiago-Tolosa, RafaelPMR |
| [#49](https://github.com/KaimanByte/Green-Byte/issues/49) | fechada | MD-03 · Tolerância a falhas das APIs | RafaelPMR |
| [#50](https://github.com/KaimanByte/Green-Byte/issues/50) | fechada | MD-04 · Testes de estados e reconciliação | erickrost |
| [#52](https://github.com/KaimanByte/Green-Byte/issues/52) | fechada | API-02 · Validação e tratamento global de exceções | Thiago-Tolosa |
| [#53](https://github.com/KaimanByte/Green-Byte/issues/53) | fechada | API-03 · Histórico e indicadores | JoaoPedroLuvisariSeveriano |
| [#55](https://github.com/KaimanByte/Green-Byte/issues/55) | fechada | API-05 · Ranking e comparação | JoaoPedroLuvisariSeveriano |
| [#61](https://github.com/KaimanByte/Green-Byte/issues/61) | fechada | FE-06 · Estados e alertas por texto e ícone | RafaelPMR |
| [#62](https://github.com/KaimanByte/Green-Byte/issues/62) | fechada | FE-07 · Carregamento, vazio e erro | JoaoLorena0, RafaelPMR |
| [#63](https://github.com/KaimanByte/Green-Byte/issues/63) | fechada | FE-08 · Gráfico de histórico por serviço | RafaelPMR |
| [#65](https://github.com/KaimanByte/Green-Byte/issues/65) | fechada | FE-10 · Comparação entre serviços | RafaelPMR |
| [#68](https://github.com/KaimanByte/Green-Byte/issues/68) | fechada | AU-01 · Login com hash e JWT | Thiago-Tolosa |
| [#69](https://github.com/KaimanByte/Green-Byte/issues/69) | fechada | AU-02 · Proteger rotas de configuração | Thiago-Tolosa |
| [#72](https://github.com/KaimanByte/Green-Byte/issues/72) | fechada | AU-05 · Usuário inicial por seed e variáveis | Thiago-Tolosa |
| [#76](https://github.com/KaimanByte/Green-Byte/issues/76) | fechada | UX-07 · Animação de abertura na inicialização | JoaoLorena0 |

## Sprint 3

**Situação:** 0 de 12 issues fechadas.

| Issue | Item | Responsáveis |
|---|---|---|
| [#24](https://github.com/KaimanByte/Green-Byte/issues/24) | GA-13 · Planejamento da Sprint 3 | — |
| [#25](https://github.com/KaimanByte/Green-Byte/issues/25) | GA-14 · Sprint Review e Retrospectiva da Sprint 3 | — |
| [#26](https://github.com/KaimanByte/Green-Byte/issues/26) | GA-15 · Fechamento e entrega da Sprint 3 | — |
| [#67](https://github.com/KaimanByte/Green-Byte/issues/67) | FE-12 · Responsividade e desempenho | — |
| [#70](https://github.com/KaimanByte/Green-Byte/issues/70) | AU-03 · Área de configuração do monitoramento | — |
| [#71](https://github.com/KaimanByte/Green-Byte/issues/71) | AU-04 · Tela de login e rota protegida | — |
| [#75](https://github.com/KaimanByte/Green-Byte/issues/75) | UX-03 · Diretrizes de apresentação dos indicadores | — |
| [#77](https://github.com/KaimanByte/Green-Byte/issues/77) | UX-05 · Executar avaliação de usabilidade | — |
| [#78](https://github.com/KaimanByte/Green-Byte/issues/78) | UX-06 · Aplicar melhorias da avaliação | — |
| [#81](https://github.com/KaimanByte/Green-Byte/issues/81) | QA-03 · Revisão de tipagem e código limpo | — |
| [#82](https://github.com/KaimanByte/Green-Byte/issues/82) | QA-04 · Testes das regras de ranking, comparação e auth | — |
| [#83](https://github.com/KaimanByte/Green-Byte/issues/83) | QA-05 · Conferir README, comandos e links | — |

## Itens que não estão no Project atual

O backlog anterior continha `IN-04` (CI), `UX-04` (planejar avaliação de usabilidade) e `QA-02` (justificar SOLID e injeção de dependências), mas não há issue correspondente a eles no Project. Eles não são apresentados como trabalho comprometido até que a equipe crie e inclua as respectivas issues.

## Atualização deste documento

Ao criar, mover ou fechar uma issue, atualize primeiro o GitHub Project. Em seguida, atualize esta tabela no mesmo pull request — incluindo milestone, situação e responsáveis — para manter a evidência versionada coerente com o quadro.
