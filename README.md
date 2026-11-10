# ABP - GreenER: Monitoramento de Energia e Emissões de Carbono (Green Byte)

<p align="center">
  <img src="./docs/LogoKaymanByte.png"
       alt="TOP"
       style="max-width: 260px; width: 60%; height: auto;">
</p>

[Sobre o Projeto](#descrição-do-projeto) | [Entrega de Sprints](#entregas-de-sprints) | [Recursos do Produto](#recursos-do-produto) | [Stack](#stack) | [Como rodar](#como-subir-a-aplicação-com-docker-compose) | [Nossa Equipe](#equipe)

## Descrição do Projeto

O projeto ABP (Aprendizagem Baseada em Projeto) é desenvolvido como atividade do 3º semestre do curso de **Desenvolvimento de Software Multiplataforma (DSM)** da **Fatec Jacareí**, no período 2026-2.

O desafio **GreenER** propõe uma plataforma que estima o impacto ambiental de aplicações em execução: quanto de **energia (kWh)** elas consomem e quanto de **carbono (gCO₂e)** isso representa, considerando a região onde cada serviço está hospedado.

O **Green Byte** é a solução desenvolvida pela nossa equipe. O sistema:

- Descobre automaticamente os serviços disponíveis a partir da API **Greener Metrics Aggregator**.
- Coleta periodicamente as métricas de CPU, memória, disco e rede de cada serviço.
- Consulta a **intensidade de carbono** da região de cada serviço na API **Greener Carbon Intensity**.
- Calcula energia e CO₂e com o modelo padronizado do desafio e guarda o histórico no banco de dados.
- Apresenta tudo em um dashboard, com indicadores consolidados, histórico, ranking, comparação entre serviços e mapa.

> O modelo é uma **estimativa padronizada** para comparar serviços, regiões e tendências. Ele não mede o consumo elétrico real de servidores ou datacenters.

### Como o cálculo funciona

```text
Potência (W)  = (CPU% / 100 × CPU_MAX_WATTS) + (RAM_GB × RAM_W/GB) + (DISCO_GB × DISCO_W/GB) + (REDE_GB × REDE_W/GB)
Energia (kWh) = Potência (W) × Tempo (h) / 1000
CO₂e (g)      = Energia (kWh) × Intensidade de Carbono (gCO₂e/kWh)
```

Fórmulas completas, constantes e um exemplo numérico passo a passo estão em [`docs/calculos.md`](./docs/calculos.md).

## Entregas de Sprints

Todas as entregas seguem os prazos acordados no calendário da disciplina. Para cada ciclo de desenvolvimento, é gerado um relatório de sprint e as tarefas são acompanhadas no **GitHub Project** do repositório.

| Sprint | Entrega       | Status | Foco                                                                                  | Relatório | Apresentação |
| ------ | ------------- | ------ | ------------------------------------------------------------------------------------- | --------- | ------------ |
| 1      | 📅 20/10/2026 | ✅     | Fundação: ambiente containerizado, APIs auxiliares, persistência inicial e protótipo  | [Sprint Review](./docs/sprintReview1)         | [Apresentação](https://youtu.be/GThHoh05cKw)            |
| 2      | 📅 10/11/2026 | —      | Núcleo do produto: cálculo de energia e CO₂e, monitoramento dinâmico e dashboard      | —         | —            |
| 3      | 📅 23/11/2026 | —      | Fechamento do MVP: ranking, comparação, mapa, autenticação e avaliação de usabilidade | —         | —            |

**Legenda:**

- ✅ **Finalizada**
- 🚧 **Em Progresso**
- `—` **Não iniciado**

## Recursos do Produto

- **Backlog do Produto:** [Acesse aqui](./docs/backlog.md)
  Épicos, itens por sprint com prioridade e estimativa, critérios de aceite e matriz de rastreabilidade (requisito → item).

- **Arquitetura:** [Acesse aqui](./docs/arquitetura.md)
  Organização das pastas, fluxo de dados, tecnologias escolhidas e funcionamento dos containers.

- **APIs Externas:** [Acesse aqui](./docs/api-externas.md)
  Contratos das APIs Greener Metrics Aggregator e Greener Carbon Intensity, com exemplos de resposta e erros mapeados.

- **Fórmulas de Cálculo:** [Acesse aqui](./docs/calculos.md)
  Modelo de cálculo de energia e CO₂e, constantes, premissas e decisão de escopo (energia e CO₂e no MVP; água fora do modelo).

## Stack

- **Frontend:** React + TypeScript + Vite, servido por Nginx
- **Backend:** NestJS + TypeScript
- **Banco de Dados:** PostgreSQL 16 com Drizzle ORM
- **Testes e qualidade:** Jest e oxlint (backend), ESLint (frontend)
- **Orquestração:** Docker e Docker Compose
- **Node.js nas imagens Docker:** 24 (Alpine)

## Arquitetura

```mermaid
flowchart LR
    U[Usuário] --> F[Frontend<br/>React]
    F -->|HTTP| B[Backend<br/>NestJS]
    B --> D[(PostgreSQL<br/>Drizzle ORM)]
    B --> M[Metrics Aggregator<br/>API externa]
    B --> C[Carbon Intensity<br/>API externa]
```

O frontend nunca acessa o banco diretamente. Toda regra de negócio, cálculo e integração com APIs externas passa pelo backend. Mais detalhes em [`docs/arquitetura.md`](docs/arquitetura.md).

## Equipe

| Nome             | Função | GitHub                                                  | LinkedIn                                                                              |
| ---------------- | ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Rafael Melo      | Product Owner | [Github](https://github.com/RafaelPMR)               | [LinkedIn](https://www.linkedin.com/in/rafael-prado-de-melo-raimundo-55a150144)       |
| Gabriel Oliveira | Scrum Master | [Github](https://github.com/GabrielOlsa)             | [LinkedIn](https://www.linkedin.com/in/gabriel-oliveira-96013138b)  
| Thiago Guedes    | Desenvolvedor | [Github](https://github.com/Thiago-Tolosa)           | [LinkedIn](https://www.linkedin.com/in/thiago-guedes-4965b0390)                       |
| João Pedro       | Desenvolvedor | [Github](https://github.com/JoaoPedroLuvisariSeveriano) | [LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-pedro-luvisari-severiano-bb1aa9303/) |
| Erick Rost       | Desenvolvedor | [Github](https://github.com/erickrost)               | [LinkedIn](https://www.linkedin.com/in/erick-rost/)                                   |
| João Lorena  | Desenvolvedor | [Github](https://github.com/JoaoLorena0)               | [LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-lorena-056b95271/)          |

## Estrutura

- `docker-compose.yml`: orquestração dos containers (frontend, migration, backend e PostgreSQL)
- `.env.example`: modelo das variáveis de ambiente; copie para `.env`
- `backend/`: API NestJS
  - `backend/src/database/`: conexão e schema do Drizzle ORM
  - `backend/drizzle/migrations/`: migrações SQL geradas pelo Drizzle
  - `backend/test/`: testes end-to-end
- `frontend/`: interface React
- `docs/`: backlog, arquitetura, contratos das APIs e fórmulas de cálculo

## Como subir a aplicação com Docker Compose

Pré-requisitos:

- Docker Engine e Docker Compose instalados.
- Node.js 24, apenas para executar o projeto fora dos containers.

Passo a passo:

1. Clone o repositório e entre na pasta:

```
git clone https://github.com/KaimanByte/Green-Byte.git
cd Green-Byte
```

2. Crie o arquivo de variáveis de ambiente a partir do modelo:

```
cp .env.example .env
```

3. Suba todos os containers:

```
docker compose up --build -d
```

O Compose aguarda o PostgreSQL ficar saudável, executa as migrations versionadas pelo Drizzle e só então inicia o backend. É esperado que o serviço `migrate` termine com status `Exited (0)` após aplicar — ou confirmar que já aplicou — as migrations.

4. Verifique se os serviços estão em execução:

```
docker compose ps
```

5. Para acompanhar os logs:

```
docker compose logs -f
```

6. Para parar o ambiente:

```
docker compose down
```

> Para apagar também os dados do banco, use `docker compose down -v`. Isso remove o volume `postgres_data`.

> **Atualização de ambiente:** se o seu volume PostgreSQL foi criado antes da adoção do serviço `migrate`, recrie-o uma única vez com `docker compose down -v` antes de subir novamente. Esse comando apaga os dados locais do banco.

## URLs

Conforme o mapeamento de portas definido no `docker-compose.yml`:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- PostgreSQL no host: `localhost:5434`

## Variáveis de ambiente

| Variável | Descrição | Valor no `.env.example` |
| --- | --- | --- |
| `DATABASE_URL` | Conexão do backend e do serviço de migration com o PostgreSQL. | `postgresql://postgres:postgres@postgres:5432/green_byte` |
| `JWT_SECRET` | Segredo usado para assinar os tokens de login. Obrigatória. | `your_super_secret_key_change_me` |
| `ADM_EMAIL` | E-mail do administrador criado apenas quando ainda não há usuários. Obrigatória. | `admin@greenbyte.com` |
| `ADM_PASSWORD` | Senha do administrador inicial. Obrigatória. | `admin_password` |
| `METRICS_API_BASE_URL` | URL base da API de métricas. Obrigatória. | `https://metrics.unilaunch.org` |
| `CARBON_API_BASE_URL` | URL base da API de intensidade de carbono. Obrigatória. | `https://carbon.unilaunch.org` |
| `PORT` | Porta da API. | `3001` |
| `FRONTEND_URL` | URL permitida para o frontend. | `http://localhost:3000` |
| `NODE_ENV` | Ambiente de execução. | `development` |
| `COLLECTION_INTERVAL_SECONDS` | Intervalo entre ciclos automáticos de descoberta e coleta, em segundos. Aceita inteiros de 1 a 2147483. | `30` |

> Troque `JWT_SECRET` e `ADM_PASSWORD` antes de qualquer uso fora do ambiente local. O arquivo `.env` não é versionado.

### Agendamento da coleta periódica

O backend executa um ciclo completo de sincronização assim que a aplicação inicia. Depois da conclusão desse ciclo inicial, a descoberta de regiões/serviços e a coleta de métricas são executadas periodicamente conforme `COLLECTION_INTERVAL_SECONDS`.

- Unidade: segundos.
- Padrão: `30` segundos, caso a variável não seja informada.
- Valor aceito: número inteiro entre `1` e `2147483`. Valores inválidos impedem a inicialização do serviço e geram uma mensagem explícita.
- Concorrência: se o intervalo vencer enquanto outro ciclo ainda estiver em execução, o novo disparo é ignorado; ciclos não são executados em paralelo.
- Observabilidade: cada ciclo registra início, término, duração e, em caso de falha, a etapa que apresentou o erro.

Para alterar o intervalo, edite `COLLECTION_INTERVAL_SECONDS` no `.env`. Exemplo para executar a cada 2 minutos:

```env
COLLECTION_INTERVAL_SECONDS=120
```

Após alterar o `.env`, recrie o container do backend para aplicar a configuração:

```bash
docker compose up -d --build --force-recreate backend
```

## Banco de Dados

- Durante a execução via Docker Compose, o backend acessa o PostgreSQL pelo host interno `postgres` e pela porta `5432`.
- O serviço é publicado no host pela porta `5434`, conforme o mapeamento `5434:5432`.
- Para acesso direto por ferramentas como DBeaver ou psql, use:
  - Host: `localhost`
  - Port: `5434`
  - Database: `green_byte`
  - User: `postgres`
  - Password: `postgres`
- O acesso aos dados é feito com **Drizzle ORM**. O schema fica em `backend/src/database/database.schema.ts` e as migrations em `backend/drizzle/migrations/`.
- No Docker Compose, o serviço `migrate` executa `npm run db:migrate` automaticamente antes do backend iniciar. Não é necessário aplicar SQLs manualmente pelo Postgres.

Para aplicar manualmente as migrations em um PostgreSQL exposto pelo Docker, entre em `backend`, instale as dependências com `npm ci` e informe a conexão pela porta do host (`5434`):

```bash
cd backend
npm ci
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/green_byte npm run db:migrate
```

No PowerShell, defina a variável na sessão antes do comando:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5434/green_byte'
npm run db:migrate
```

## Desenvolvimento e testes

Backend:

```
cd backend
npm ci
npm run lint        # análise estática (oxlint)
npm test            # testes unitários (Jest)
npm run build
npm run test:e2e    # testes end-to-end
```

Frontend:

```
cd frontend
npm ci
npm run dev         # servidor de desenvolvimento (Vite)
npm run lint
npm run build
```

## Fluxo de trabalho

- Branch `main`: versão estável, entregue ao final de cada sprint.
- Branch `dev`: integração do trabalho em andamento.
- Branches de funcionalidade: `feature/<descrição>`, integradas por **Pull Request** com revisão.
- Commits no padrão Conventional Commits, citando o item do backlog quando houver. Exemplo: `docs(IT-02): fórmulas de cálculos e o escopo`.
