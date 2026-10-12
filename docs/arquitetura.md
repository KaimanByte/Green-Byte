# Arquitetura inicial do Green Byte

> **Documento em evolução:** esta documentação representa a visão inicial da arquitetura do projeto e será atualizada continuamente conforme os requisitos forem detalhados, novas funcionalidades forem implementadas e as decisões técnicas forem validadas. A estrutura descrita aqui não deve ser considerada definitiva.

## 1. Visão geral

O projeto está organizado inicialmente em três partes principais:

- **Frontend:** interface web desenvolvida com React e TypeScript, utilizando Vite para desenvolvimento e build.
- **Backend:** API desenvolvida com NestJS e TypeScript, responsável por receber requisições, executar regras de negócio e intermediar o acesso aos dados.
- **Banco de dados:** PostgreSQL, responsável por armazenar os dados da aplicação.

APIs auxiliares poderão ser integradas conforme as necessidades do projeto forem identificadas. Neste estágio, as integrações externas ainda não estão detalhadas.

## 2. Organização das pastas

A arquitetura inicial prioriza uma estrutura simples, acompanhando a organização atual do repositório:

```text
Green-Byte/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   └── app.service.ts
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql
├── docs/
│   ├── backlog.md
│   └── arquitetura.md
│   └── api-externas.md
│   └── calculos.md
├── docker-compose.yml
└── .env.example
```

Essa estrutura poderá ser refinada à medida que o sistema crescer. Por exemplo, módulos específicos de funcionalidades, serviços, validações, acesso a dados e integrações poderão ganhar pastas próprias quando houver necessidade, evitando criar camadas prematuramente.

## 3. Fluxo de dados previsto

O fluxo funcional esperado é:

1. **Coleta:** o frontend permite que o usuário informe ou consulte os dados necessários. Quando aplicável, o backend também poderá coletar dados de APIs auxiliares.
2. **Cálculo e processamento:** o backend valida os dados e executa as regras de negócio e os cálculos necessários.
3. **Persistência:** o backend consulta ou grava os dados no PostgreSQL.
4. **Dashboard:** o frontend solicita os dados processados à API e apresenta os resultados em telas, indicadores e gráficos.

Fluxo resumido:

```text
Usuário
  ↓
Frontend (React)
  ↓ requisições HTTP
Backend / API (NestJS)
  ├── Regras de negócio e cálculos
  ├── APIs auxiliares (quando definidas)
  ↓ acesso a dados via Drizzle ORM
PostgreSQL
  ↓ resultados
Backend → Frontend → Dashboard
```

O frontend não deve acessar o banco de dados diretamente. O acesso e as alterações nos dados serão realizados pelo backend, centralizando validações e regras de negócio.

## 4. Tecnologias e decisões iniciais

- **React + TypeScript:** construção da interface com componentes e tipagem estática.
- **Vite:** servidor de desenvolvimento e ferramenta de build do frontend.
- **NestJS + TypeScript:** organização da API backend e separação gradual das responsabilidades.
- **PostgreSQL:** banco de dados relacional para persistência.
- **Drizzle ORM:** será utilizado como camada de acesso ao banco. A escolha busca manter as consultas próximas ao SQL, oferecer tipagem com TypeScript e permitir controle explícito sobre as operações. A integração e as configurações do Drizzle serão implementadas conforme o desenvolvimento avançar.
- **Docker e Docker Compose:** padronização do ambiente de execução dos serviços, facilitando a inicialização do projeto em diferentes máquinas.
- **pgAdmin:** ferramenta opcional de administração visual do PostgreSQL no ambiente local.

Bibliotecas adicionais serão escolhidas conforme os requisitos concretos surgirem, evitando adicionar dependências antes de existir uma necessidade clara.

## 5. Containers e ambiente local

O arquivo `docker-compose.yml` descreve os serviços que podem ser iniciados em conjunto. Um **container** é um ambiente isolado no qual um serviço executa com suas dependências e configurações. Os containers do projeto são:

| Serviço | Função | Porta no computador |
|---|---|---|
| `frontend` | Disponibiliza a aplicação web por meio do Nginx | `3000` |
| `backend` | Executa a API NestJS | `3001` |
| `postgres` | Armazena os dados da aplicação | `5434` |
| `pgadmin` | Interface web para administrar o PostgreSQL | `5433` |

As portas externas são mapeadas para as portas internas dos containers. Por exemplo, o frontend fica acessível pelo computador na porta `3000`, embora o Nginx escute na porta `80` dentro do container.

O Docker Compose também configura:

- **Rede interna:** os serviços conseguem se comunicar entre si pelo nome do serviço. Por isso, o backend utiliza `postgres` como host do banco dentro do ambiente Docker, em vez de `localhost`.
- **Volume `postgres_data`:** mantém os dados do PostgreSQL mesmo quando o container é recriado. Apagar o volume, por outro lado, pode remover os dados persistidos.
- **Health check:** verifica se o PostgreSQL está pronto para aceitar conexões antes de iniciar o backend.
- **Variáveis de ambiente:** credenciais e configurações são fornecidas por variáveis, com valores locais mantidos no arquivo `.env`. O `.env` não deve ser versionado; o `.env.example` serve como referência para configurar o ambiente.
- **Inicialização do banco:** os arquivos da pasta `database/` são montados no diretório de inicialização do PostgreSQL. Scripts desse diretório são executados automaticamente quando o volume de dados é inicializado pela primeira vez; alterações posteriores nesses scripts não são reaplicadas automaticamente em um banco já inicializado.

Os Dockerfiles definem como as imagens de frontend e backend são construídas. O frontend é compilado e servido pelo Nginx; o backend é compilado e executado com Node.js.

## 6. APIs auxiliares

A arquitetura permite adicionar integrações externas quando forem identificadas. Essas integrações deverão ser chamadas pelo backend, que ficará responsável por tratar respostas, erros, autenticação e transformação dos dados antes de utilizá-los na aplicação. As APIs específicas ainda serão documentadas quando forem definidas.

## 7. Evolução da arquitetura

As decisões deste documento são iniciais e proporcionais ao estágio atual do projeto. A estrutura de pastas, o fluxo de dados, as bibliotecas e os serviços poderão ser ajustados conforme a equipe aprender mais sobre os requisitos. Mudanças relevantes deverão ser refletidas neste arquivo para mantê-lo alinhado à implementação real.
