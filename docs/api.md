# API REST do Green-Byte

Este documento descreve os endpoints expostos pelo backend NestJS. A documentação interativa (OpenAPI/Swagger) é gerada a partir dos próprios controllers e fica disponível em:

- Local: `http://localhost:3001/api/docs`
- Produção: `https://green-byte.onrender.com/api/docs`

> Os contratos das APIs **externas** consumidas pelo backend (Greener Metrics Aggregator e Greener Carbon Intensity) estão em [`api-externas.md`](./api-externas.md).

## Convenções

- **Formato:** requisições e respostas em JSON.
- **Datas:** ISO 8601 em UTC, por exemplo `2026-11-22T18:00:00Z`.
- **Período padrão:** nos endpoints com período, a ausência dos parâmetros equivale às **últimas 24 horas**. Nos endpoints com `from`/`to`, datas inválidas ou `from` posterior a `to` retornam `400`.
- **Validação:** o corpo das requisições é validado por DTOs (`class-validator`). Campos inválidos retornam `400` com as mensagens de validação.
- **Autenticação:** rotas protegidas exigem o cabeçalho `Authorization: Bearer <access_token>`, obtido em `POST /auth/login`.
- **Papéis:** `admin` (acesso total) e `operator` (operação do monitoramento, sem gestão de usuários).

### Códigos HTTP utilizados

| Código | Quando ocorre |
|---|---|
| `200 OK` | Consulta ou operação concluída. |
| `201 Created` | Recurso criado (`POST /users`). |
| `400 Bad Request` | Parâmetro ou corpo inválido (datas, `limit`, `metric`, faixas de configuração). |
| `401 Unauthorized` | Token ausente, inválido, expirado ou credenciais incorretas no login. |
| `403 Forbidden` | Usuário autenticado sem o papel exigido. |
| `404 Not Found` | Serviço, região ou usuário inexistente. |
| `409 Conflict` | E-mail já cadastrado ao criar ou atualizar usuário. |

## Resumo dos endpoints

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/health` | Pública | Saúde do backend e da coleta automática. |
| `POST` | `/auth/login` | Pública | Autentica e retorna o token JWT. |
| `GET` | `/services` | Pública | Lista os serviços monitorados. |
| `GET` | `/services/:id` | Pública | Busca um serviço pelo ID. |
| `GET` | `/services/:id/history` | Pública | Série temporal de coletas de um serviço. |
| `POST` | `/services/sync` | `admin`, `operator` | Sincroniza os serviços com a API de métricas. |
| `GET` | `/regions` | Pública | Lista as regiões com intensidade de carbono. |
| `GET` | `/regions/:codigoRegiao` | Pública | Busca uma região pelo código. |
| `POST` | `/regions/sync` | `admin`, `operator` | Sincroniza as regiões com a API de carbono. |
| `GET` | `/collections/service/:serviceId` | Pública | Histórico de coletas de um serviço. |
| `GET` | `/collections/emissions/region` | Pública | Energia e emissões agrupadas por região. |
| `GET` | `/collections/emissions/service` | Pública | Energia e emissões agrupadas por serviço. |
| `GET` | `/collections/timeseries` | Pública | Evolução das métricas ao longo do tempo. |
| `GET` | `/collections/timeseries/compare` | Pública | Evolução de 2 ou mais serviços no mesmo período. |
| `POST` | `/collections/sync` | `admin`, `operator` | Executa uma coleta e calcula as emissões. |
| `GET` | `/summary` | Pública | Indicadores consolidados do ambiente. |
| `GET` | `/ranking` | Pública | Ranking dos serviços por energia ou CO₂e. |
| `GET` | `/compare` | Pública | Comparação de totais entre 2 ou mais serviços. |
| `GET` | `/monitoring/collection-interval` | Pública | Intervalo de coleta em vigor. |
| `GET` | `/monitoring/collection-status` | `admin`, `operator` | Saúde detalhada da coleta automática. |
| `GET` | `/settings` | `admin`, `operator` | Consulta a configuração do monitoramento. |
| `PATCH` | `/settings` | `admin`, `operator` | Altera a configuração do monitoramento. |
| `GET` | `/audit-logs` | `admin`, `operator` | Lista as alterações administrativas. |
| `POST` | `/users` | `admin` | Cria um usuário. |
| `GET` | `/users` | `admin` | Lista os usuários. |
| `GET` | `/users/:id` | `admin` | Busca um usuário pelo ID. |
| `GET` | `/users/email/:email` | `admin` | Busca um usuário pelo e-mail. |
| `PATCH` | `/users/:id` | `admin` | Atualiza um usuário. |
| `DELETE` | `/users/:id` | `admin` | Remove um usuário. |

---

## Saúde

### `GET /health`

Rota pública usada como health check da hospedagem e alvo de ping. Não consulta o banco e sempre responde `200` enquanto o processo está ativo; uma falha da coleta aparece em `collection.lastCycleSucceeded`.

```json
{
  "status": "ok",
  "uptimeSeconds": 3600,
  "collection": {
    "intervalSeconds": 30,
    "isRunning": false,
    "lastCycleSucceeded": true,
    "lastCycleAt": "2026-11-22T18:00:01.200Z"
  }
}
```

## Autenticação

### `POST /auth/login`

Corpo:

```json
{
  "email": "admin@greenbyte.com",
  "password": "sua-senha"
}
```

Resposta `200`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@greenbyte.com",
    "role": "admin",
    "active": true,
    "createdAt": "2026-11-05T20:00:00.000Z"
  }
}
```

Erros: `400` (e-mail inválido ou campos ausentes) e `401` (credenciais incorretas ou conta desativada). As senhas são armazenadas com hash; o token é assinado com `JWT_SECRET`.

## Serviços

### `GET /services`

Lista os serviços descobertos no Greener Metrics Aggregator e persistidos no banco, incluindo a região de cada um.

### `GET /services/:id`

Retorna um serviço pelo identificador (ex.: `billing-api`). `404` se não existir.

### `GET /services/:id/history`

Série temporal de coletas de um serviço. O período efetivo e as unidades são informados na resposta.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `from` | data ISO | não | Início do período. |
| `to` | data ISO | não | Fim do período. |
| `limit` | inteiro positivo | não | Máximo de coletas retornadas. |

Erros: `400` (datas ou `limit` inválidos) e `404` (serviço inexistente).

### `POST /services/sync`

Consulta `GET /services` na API externa e insere ou atualiza cada serviço no banco. Requer `admin` ou `operator`.

## Regiões

### `GET /regions`

Lista as regiões com a intensidade de carbono (gCO₂e/kWh) obtida na Greener Carbon Intensity.

### `GET /regions/:codigoRegiao`

Retorna uma região pelo código. `404` se não existir.

### `POST /regions/sync`

Sincroniza as regiões com a API de intensidade de carbono. Requer `admin` ou `operator`.

## Coletas e indicadores

Cada coleta guarda as métricas do serviço (CPU, memória, disco e rede), a intensidade de carbono da região e os valores calculados de potência (W), energia (kWh) e emissão (gCO₂e). As fórmulas estão em [`calculos.md`](./calculos.md).

### `GET /collections/service/:serviceId`

Histórico de coletas de um serviço.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `from` | data ISO | não | Início do período. |
| `to` | data ISO | não | Fim do período. |
| `limit` | inteiro positivo | não | Máximo de coletas (o dashboard usa `limit=1` para obter a última). |

### `GET /collections/emissions/region` e `GET /collections/emissions/service`

Somam energia (kWh) e emissões (gCO₂e) no período, agrupadas por região ou por serviço.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `start` | data ISO | não | Início do período. Ausente: 24 horas antes de `end`. |
| `end` | data ISO | não | Fim do período. Ausente: o momento da consulta. |

Diferente dos demais endpoints de período, estes usam `start`/`end` (e não `from`/`to`) e não retornam `400` para datas inválidas: um valor que não seja uma data válida é tratado como ausente.

### `GET /collections/timeseries`

Evolução das métricas agregada em intervalos (*buckets*).

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `from` | data ISO | não | Início do período. |
| `to` | data ISO | não | Fim do período. |
| `serviceId` | texto | não | Restringe a um serviço; sem ele, considera todos. |
| `bucketSeconds` | inteiro | não | Tamanho de cada intervalo, em segundos (ex.: `900`). |
| `origin` | data ISO | não | Origem dos intervalos: cada um começa em `origin` + n × `bucketSeconds`. O dashboard envia a meia-noite local, para os intervalos caírem em horários redondos (00:15, 02:00…). Padrão: `from`. Não altera quais coletas entram, só os rótulos dos intervalos. |

A resposta informa `bucketOrigin`, a origem usada. Erros: `400` (parâmetros inválidos ou intervalos demais para o período) e `404` (serviço inexistente).

### `GET /collections/timeseries/compare`

Mesma série temporal para 2 ou mais serviços. Recebe `ids` (obrigatório, separados por vírgula ou repetidos), além de `from`, `to`, `bucketSeconds` e `origin`. Erros: `400` e `404`.

### `POST /collections/sync`

Percorre os serviços ativos, busca as métricas na API externa, cruza com a intensidade de carbono da região e grava a coleta calculada. Requer `admin` ou `operator`.

### `GET /summary`

Indicadores consolidados do ambiente no período (`from`, `to` opcionais). A resposta traz o período efetivo (`period`), as unidades (`units`), os totais calculados (`totals`) e a situação dos serviços (`services`). Erro: `400` para datas inválidas.

### `GET /ranking`

Ordena os serviços pelo total do período. Serviços ativos vêm primeiro, em ordem decrescente; o desempate é pelo ID.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `metric` | `energia` \| `co2e` | sim | Métrica de ordenação. |
| `from` | data ISO | não | Início do período. |
| `to` | data ISO | não | Fim do período. |

Erro: `400` para `metric` ausente/inválido ou datas inválidas.

### `GET /compare`

Compara os totais de 2 ou mais serviços no mesmo período. Recebe `ids` (obrigatório), `from` e `to`. Erros: `400` (menos de 2 IDs distintos ou datas inválidas) e `404` (serviço inexistente).

## Monitoramento

### `GET /monitoring/collection-interval`

Rota pública que expõe apenas o intervalo de coleta em vigor, usado pelo dashboard para ajustar a atualização automática.

### `GET /monitoring/collection-status`

Intervalo em vigor, próximo disparo e resultado do último ciclo (duração, falha, etapa e coletas gravadas). Requer `admin` ou `operator`.

## Configuração

### `GET /settings`

Retorna o intervalo de coleta e os parâmetros de potência, com os valores padrão e as faixas aceitas. Requer `admin` ou `operator`.

### `PATCH /settings`

Altera apenas os campos enviados. O novo intervalo vale imediatamente, sem reiniciar o backend; os parâmetros de potência valem a partir da próxima coleta e não recalculam o histórico. Toda alteração é registrada na auditoria. Requer `admin` ou `operator`.

| Campo | Unidade | Faixa aceita |
|---|---|---|
| `collectionIntervalSeconds` | s (inteiro) | 5 a 86.400 |
| `cpuMaxWatts` | W | 1 a 2.000 |
| `ramWattsPerGb` | W/GB | 0 a 50 |
| `diskWattsPerGb` | W/GB | 0 a 10 |
| `networkWattsPerGb` | W/GB | 0 a 10 |

```json
{ "collectionIntervalSeconds": 60, "cpuMaxWatts": 100 }
```

Erros: `400` (valor fora da faixa ou nenhum campo informado) e `403`.

## Auditoria

### `GET /audit-logs`

Lista as alterações administrativas mais recentes primeiro: autor, data/hora, ação, alvo e campos alterados. Senhas nunca são expostas. Parâmetro opcional `limit` (padrão 50, máximo 200). Requer `admin` ou `operator`.

## Usuários

Todas as rotas exigem o papel `admin`. Criações, alterações e remoções são registradas na auditoria.

### `POST /users`

```json
{
  "email": "operador@empresa.com",
  "hashPassword": "SenhaSegura123!",
  "role": "operator"
}
```

`hashPassword` recebe a senha em texto (mínimo de 8 caracteres) e é armazenada com hash. `role` é opcional; sem ele o usuário é criado como `operator`. Resposta `201`. Erros: `400` e `409` (e-mail já cadastrado).

### `GET /users`, `GET /users/:id` e `GET /users/email/:email`

Listam ou buscam usuários. As respostas nunca incluem a senha. `404` se o usuário não existir.

### `PATCH /users/:id`

Atualiza parcialmente `email`, `hashPassword`, `role` e `active`. Desativar a conta (`"active": false`) bloqueia o login e invalida os tokens já emitidos. Erros: `400`, `404` e `409`.

### `DELETE /users/:id`

Remove o usuário. Erro: `404`.
