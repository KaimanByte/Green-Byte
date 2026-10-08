# Integração com APIs Auxiliares

Esta documentação detalha a integração com os microsserviços **Greener Metrics Aggregator** e **Greener Carbon Intensity**, necessários para o cumprimento dos requisitos (RF01, RF03, RF12, RF13).

A integração entre as duas APIs permite identificar os serviços disponíveis, coletar suas métricas de utilização e relacionar a localização de cada serviço com fatores regionais de intensidade de carbono.

O fluxo principal de integração utiliza o `region_code` retornado pelo **Greener Metrics Aggregator** para consultar os dados correspondentes no **Greener Carbon Intensity**.

---

## 1. Greener Metrics Aggregator API

**Descrição:** Microsserviço que lista serviços disponíveis e expõe métricas de CPU, memória, disco, rede e localização.

**URL Base:** `https://metrics.unilaunch.org`

### 1.1 `GET /health`

* **Descrição:** Verifica a saúde e o estado básico do agregador de métricas.
* **Parâmetros:** Nenhum.

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "service": "metrics-aggregator",
  "status": "ok",
  "uptime_seconds": 122
}
```

| Campo            | Tipo      | Descrição                                             |
| ---------------- | --------- | ----------------------------------------------------- |
| `service`        | `string`  | Identificação do serviço responsável pela resposta.   |
| `status`         | `string`  | Estado atual do serviço.                              |
| `uptime_seconds` | `integer` | Tempo, em segundos, desde que o serviço foi iniciado. |

---

### 1.2 `GET /services`

* **Descrição:** Lista apenas os serviços atualmente presentes no registro. Serviços removidos deixam de aparecer nesta resposta.
* **Parâmetros:** Nenhum.

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
[
  {
    "id": "billing-api",
    "name": "Billing API",
    "location": {
      "region_code": "br-sudeste",
      "country": "Brazil",
      "region": "Sudeste",
      "city": "Sao Paulo",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "metrics_path": "/metrics/billing-api"
  }
]
```

#### Campos da Resposta

| Campo                  | Tipo              | Descrição                                          |
| ---------------------- | ----------------- | -------------------------------------------------- |
| `id`                   | `string`          | Identificador único do serviço.                    |
| `name`                 | `string`          | Nome de exibição do serviço.                       |
| `location`             | `object`          | Dados de localização associados ao serviço.        |
| `location.region_code` | `string`          | Código da região onde o serviço está localizado.   |
| `location.country`     | `string`          | País da localização do serviço.                    |
| `location.region`      | `string`          | Região geográfica.                                 |
| `location.city`        | `string` / `null` | Cidade associada ao serviço.                       |
| `location.latitude`    | `number`          | Latitude da localização.                           |
| `location.longitude`   | `number`          | Longitude da localização.                          |
| `metrics_path`         | `string`          | Caminho associado à coleta de métricas do serviço. |

> **Observação sobre `metrics_path`:** o campo representa o caminho disponibilizado pelo agregador para coleta das métricas do serviço. Para o consumo pela aplicação, deve ser utilizado o endpoint `GET /metrics/{service_id}`, utilizando o valor de `id` do serviço como `service_id`.
---

### 1.3 `GET /services/{id}`

* **Descrição:** Retorna detalhes de um serviço específico se ele estiver listado no registro atual.

#### Parâmetros da Requisição (Path)

| Nome | Tipo     | Obrigatório | Descrição                                         |
| ---- | -------- | ----------- | ------------------------------------------------- |
| `id` | `string` | Sim         | Identificador do serviço. Exemplo: `billing-api`. |

#### Exemplo de Requisição

```http
GET https://metrics.unilaunch.org/services/billing-api
```

#### Variações e Erros Mapeados

* **404 Not Found:** Serviço não listado no momento.

#### Exemplo de Resposta de Erro

```json
{
  "error": "service_unavailable",
  "message": "service 'unknown' is listed but currently unavailable"
}
```

---

### 1.4 `GET /metrics/{service_id}`

* **Descrição:** Coleta métricas de CPU, memória, disco e rede do serviço informado.

#### Parâmetros da Requisição (Path)

| Nome         | Tipo     | Obrigatório | Descrição                                                                             |
| ------------ | -------- | ----------- | ------------------------------------------------------------------------------------- |
| `service_id` | `string` | Sim         | Identificador do serviço, correspondente ao campo `id` retornado por `GET /services`. |

#### Exemplo de Requisição

```http
GET https://metrics.unilaunch.org/metrics/billing-api
```

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "collection_interval_seconds": 27,
  "metrics": {
    "cpu_percent": 62.67,
    "memory_gb": 3.17,
    "disk_gb": 19.26,
    "network_gb": 0.45
  }
}
```

#### Campos da Resposta

| Campo                         | Tipo      | Descrição                                                |
| ----------------------------- | --------- | -------------------------------------------------------- |
| `collection_interval_seconds` | `integer` | Intervalo, em segundos, associado à coleta das métricas. |
| `metrics.cpu_percent`         | `number`  | Percentual de utilização da CPU.                         |
| `metrics.memory_gb`           | `number`  | Memória utilizada, em GB.                                |
| `metrics.disk_gb`             | `number`  | Espaço em disco utilizado, em GB.                        |
| `metrics.network_gb`          | `number`  | Utilização de rede, em GB.                               |

#### Variações e Erros Mapeados

* **404 Not Found:** Serviço removido ou métricas inexistentes.
* **500 Internal Server Error:** Serviço indisponível ou exportador de métricas indisponível.

---

### 1.5 `GET /openapi.json`

* **Descrição:** Retorna a especificação OpenAPI da API em formato JSON.
* **Parâmetros:** Nenhum.

#### Resposta

**200 OK:** Especificação OpenAPI da API.

Esse endpoint é destinado principalmente à consulta técnica e integração com ferramentas compatíveis com OpenAPI.

---

### 1.6 `GET /docs`

* **Descrição:** Retorna a página HTML de documentação local da API, renderizada a partir da especificação `/openapi.json`.
* **Parâmetros:** Nenhum.

#### Resposta

**200 OK:** Página HTML contendo a documentação da API.

---

## 2. Greener Carbon Intensity API

**Descrição:** Microsserviço que fornece fatores regionais de intensidade de carbono em gCO2e/kWh.

A API utiliza o código regional (`region_code`) fornecido pelo Greener Metrics Aggregator para localizar o fator de intensidade de carbono correspondente.

**URL Base:** `https://carbon.unilaunch.org`

### 2.1 `GET /health`

* **Descrição:** Verifica a saúde e o estado básico do serviço de intensidade de carbono.
* **Parâmetros:** Nenhum.

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "service": "carbon-intensity",
  "status": "ok"
}
```

| Campo     | Tipo     | Descrição                                           |
| --------- | -------- | --------------------------------------------------- |
| `service` | `string` | Identificação do serviço responsável pela resposta. |
| `status`  | `string` | Estado atual do serviço.                            |

---

### 2.2 `GET /regions`

* **Descrição:** Retorna todas as regiões conhecidas, suas coordenadas aproximadas e fatores de intensidade de carbono.
* **Parâmetros:** Nenhum.

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "regions": [
    {
      "code": "br-sudeste",
      "country": "Brazil",
      "region": "Sudeste",
      "city": "Sao Paulo",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "carbon_intensity_gco2e_per_kwh": 85,
      "renewable_share_percent": 83
    },
  ],
  "total": 5
}
```

#### Campos da Resposta

| Campo                                      | Tipo              | Descrição                                                               |
| ------------------------------------------ | ----------------- | ----------------------------------------------------------------------- |
| `regions`                                  | `array`           | Lista de regiões registradas.                                           |
| `regions[].code`                           | `string`          | Código identificador da região.                                         |
| `regions[].country`                        | `string`          | País da região.                                                         |
| `regions[].region`                         | `string`          | Nome da região.                                                         |
| `regions[].city`                           | `string` / `null` | Cidade associada à região.                                              |
| `regions[].latitude`                       | `number`          | Latitude aproximada da região.                                          |
| `regions[].longitude`                      | `number`          | Longitude aproximada da região.                                         |
| `regions[].carbon_intensity_gco2e_per_kwh` | `number`          | Intensidade de carbono estimada em gramas de CO₂ equivalente por kWh.   |
| `regions[].renewable_share_percent`        | `number`          | Participação estimada de fontes renováveis na matriz elétrica regional. |
| `total`                                    | `integer`         | Quantidade total de regiões conhecidas.                                 |

---

### 2.3 `GET /regions/{code}`

* **Descrição:** Retorna os metadados completos de uma região pelo código utilizado pelo Agregador de Métricas.

#### Parâmetros da Requisição (Path)

| Nome   | Tipo     | Obrigatório | Descrição                                                                               |
| ------ | -------- | ----------- | --------------------------------------------------------------------------------------- |
| `code` | `string` | Sim         | Código regional. Exemplos: `br-sudeste`, `us-east`, `eu-west`, `ca-central`, `jp-east`. |

#### Exemplo de Requisição

```http
GET https://carbon.unilaunch.org/regions/br-sudeste
```

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "code": "br-sudeste",
  "country": "Brazil",
  "region": "Sudeste",
  "city": "Sao Paulo",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "carbon_intensity_gco2e_per_kwh": 85,
  "renewable_share_percent": 83
}
```

#### Variações e Erros Mapeados

* **404 Not Found:** Região não registrada.

#### Exemplo de Resposta de Erro

```json
{
  "error": "region_not_found",
  "message": "region 'unknown' is not registered"
}
```

---

### 2.4 `GET /regions/{code}/carbon-intensity`

* **Descrição:** Retorna o fator de intensidade de carbono e a participação renovável estimada da região.

#### Parâmetros da Requisição (Path)

| Nome   | Tipo     | Obrigatório | Descrição        |
| ------ | -------- | ----------- | ---------------- |
| `code` | `string` | Sim         | Código regional. |

#### Exemplo de Requisição

```http
GET https://carbon.unilaunch.org/regions/br-sudeste/carbon-intensity
```

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "region_code": "br-sudeste",
  "country": "Brazil",
  "region": "Sudeste",
  "city": "Sao Paulo",
  "carbon_intensity_gco2e_per_kwh": 85,
  "renewable_share_percent": 83
}
```

#### Variações e Erros Mapeados

* **404 Not Found:** Região não registrada.

---

### 2.5 `GET /carbon-intensity/{code}`

* **Descrição:** Alias de `/regions/{code}/carbon-intensity` para clientes que preferem uma rota mais direta.

#### Parâmetros da Requisição (Path)

| Nome   | Tipo     | Obrigatório | Descrição        |
| ------ | -------- | ----------- | ---------------- |
| `code` | `string` | Sim         | Código regional. |

#### Exemplo de Requisição

```http
GET https://carbon.unilaunch.org/carbon-intensity/br-sudeste
```

#### Exemplo de Resposta (Sucesso - 200 OK)

```json
{
  "region_code": "br-sudeste",
  "country": "Brazil",
  "region": "Sudeste",
  "city": "Sao Paulo",
  "carbon_intensity_gco2e_per_kwh": 85,
  "renewable_share_percent": 83
}
```

#### Variações e Erros Mapeados

* **404 Not Found:** Região não registrada.

> **Observação:** `/carbon-intensity/{code}` possui a mesma finalidade de `/regions/{code}/carbon-intensity`. A aplicação pode utilizar uma das duas rotas conforme a estratégia adotada para integração.

---

### 2.6 `GET /openapi.json`

* **Descrição:** Retorna a especificação OpenAPI da API em formato JSON.
* **Parâmetros:** Nenhum.

#### Resposta

**200 OK:** Especificação OpenAPI da API.

---

### 2.7 `GET /docs`

* **Descrição:** Retorna a página HTML de documentação local da API, renderizada a partir da especificação `/openapi.json`.
* **Parâmetros:** Nenhum.

#### Resposta

**200 OK:** Página HTML contendo a documentação da API.

---

## 3. Fluxo de Integração entre as APIs

A integração entre as duas APIs ocorre principalmente por meio do campo `region_code`.

O **Greener Metrics Aggregator** fornece as informações dos serviços, incluindo a região onde cada serviço está localizado. O código da região retornado nessa API deve ser utilizado para consultar a intensidade de carbono correspondente no **Greener Carbon Intensity**.

### 3.1 Fluxo resumido

```text
Greener Metrics Aggregator
          |
          | GET /services
          v
     Lista de serviços
          |
          | region_code
          v
Greener Carbon Intensity
          |
          | GET /carbon-intensity/{code}
          v
Intensidade de carbono
          |
          v
Cálculo de CO2e
```

### 3.2 Etapa 1 — Descobrir os serviços

A aplicação deve consultar:

```http
GET https://metrics.unilaunch.org/services
```

Exemplo:

```json
[
  {
    "id": "billing-api",
    "name": "Billing API",
    "location": {
      "region_code": "br-sudeste",
      "country": "Brazil",
      "region": "Sudeste",
      "city": "Sao Paulo",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "metrics_path": "/metrics/billing-api"
  }
]
```

A partir dessa resposta, a aplicação obtém:

* identificador do serviço: `billing-api`;
* localização;
* latitude e longitude;
* código regional: `br-sudeste`.

O `region_code` será utilizado na próxima etapa.

---

### 3.3 Etapa 2 — Coletar as métricas do serviço

Com o identificador do serviço, a aplicação pode consultar:

```http
GET https://metrics.unilaunch.org/metrics/billing-api
```

Exemplo:

```json
{
  "collection_interval_seconds": 27,
  "metrics": {
    "cpu_percent": 62.67,
    "memory_gb": 3.17,
    "disk_gb": 19.26,
    "network_gb": 0.45
  }
}
```

Esses dados representam as métricas coletadas para o serviço.

---

### 3.4 Etapa 3 — Consultar a intensidade de carbono da região

Utilizando o `region_code` obtido anteriormente:

```text
br-sudeste
```

A aplicação pode consultar:

```http
GET https://carbon.unilaunch.org/carbon-intensity/br-sudeste
```

Exemplo:

```json
{
  "region_code": "br-sudeste",
  "country": "Brazil",
  "region": "Sudeste",
  "city": "Sao Paulo",
  "carbon_intensity_gco2e_per_kwh": 85,
  "renewable_share_percent": 83
}
```

Dessa forma, o sistema consegue associar as métricas e a localização do serviço ao fator de intensidade de carbono da região.

---

### 3.5 Etapa 4 — Cálculo da emissão de CO₂e

A segunda API fornece o fator de intensidade de carbono em:

```text
gCO2e/kWh
```

O cálculo de emissão pode ser realizado utilizando:

```text
CO2e = energia_kWh × carbon_intensity_gco2e_per_kwh
```

Por exemplo, considerando uma intensidade de:

```text
85 gCO2e/kWh
```

e uma energia consumida de:

```text
10 kWh
```

o cálculo será:

```text
CO2e = 10 × 85
CO2e = 850 gCO2e
```

A API de intensidade de carbono fornece o fator necessário para esse cálculo, enquanto a energia em kWh deve ser obtida a partir dos dados disponíveis no sistema.

---

## 4. Mapeamento de Campos de Localização e Coordenadas (RF12/RF13)

Os dados geográficos e de localização retornados por ambas as APIs deverão ser mapeados para a estrutura do nosso sistema para atender aos requisitos de geolocalização.

| Entidade de Origem (API)    | Campo na API Externa   | Nosso Modelo (RF12/RF13) | Tipo de Dado | Observações                                                                                                                                |
| --------------------------- | ---------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Location` / `CarbonRegion` | `latitude`             | `endereco.latitude`      | `Number`     | Retornado em formato double (ex: `-23.5505`). Mapear diretamente para salvar as coordenadas do serviço/região.                             |
| `Location` / `CarbonRegion` | `longitude`            | `endereco.longitude`     | `Number`     | Retornado em formato double (ex: `-46.6333`). Essencial para plotagem no mapa.                                                             |
| `Location` / `CarbonRegion` | `region_code` / `code` | `endereco.codigo_regiao` | `String`     | Chave estrangeira lógica. Usar o `region_code` do agregador de métricas para buscar o `carbon_intensity` correspondente na API de Carbono. |
| `Location` / `CarbonRegion` | `country`              | `endereco.pais`          | `String`     | Campo descritivo para agrupamento e exibição na interface.                                                                                 |
| `Location` / `CarbonRegion` | `region`               | `endereco.regiao`        | `String`     | Campo descritivo para agrupamento e exibição na interface.                                                                                 |
| `Location` / `CarbonRegion` | `city`                 | `endereco.cidade`        | `String`     | Campo descritivo para agrupamento e exibição na interface. Pode ser nulo conforme o contrato da API.                                       |

---

## 5. Mapeamento das Métricas

As métricas retornadas pelo Greener Metrics Aggregator deverão ser utilizadas para representar o consumo e o estado operacional dos serviços.

| Campo da API                  | Tipo     | Descrição                                               |
| ----------------------------- | -------- | ------------------------------------------------------- |
| `cpu_percent`                 | `Number` | Percentual de utilização da CPU.                        |
| `memory_gb`                   | `Number` | Quantidade de memória utilizada, em GB.                 |
| `disk_gb`                     | `Number` | Quantidade de armazenamento em disco utilizada, em GB.  |
| `network_gb`                  | `Number` | Quantidade de utilização de rede, em GB.                |
| `collection_interval_seconds` | `Number` | Intervalo associado à coleta das métricas, em segundos. |

Essas informações podem ser armazenadas e relacionadas ao serviço correspondente utilizando o identificador `id`.

---

## 6. Mapeamento dos Dados de Carbono

Os dados fornecidos pelo Greener Carbon Intensity deverão ser utilizados para determinar o fator regional de emissão e a participação estimada de fontes renováveis.

| Campo da API                     | Tipo              | Descrição                                                               |
| -------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `region_code`                    | `String`          | Código identificador da região.                                         |
| `country`                        | `String`          | País da região.                                                         |
| `region`                         | `String`          | Região geográfica.                                                      |
| `city`                           | `String` / `null` | Cidade associada à região.                                              |
| `carbon_intensity_gco2e_per_kwh` | `Number`          | Gramas de CO₂ equivalente emitidos para gerar 1 kWh na região.          |
| `renewable_share_percent`        | `Number`          | Participação estimada de fontes renováveis na matriz elétrica regional. |

---

## 7. Tratamento de Erros

A aplicação consumidora deve considerar que os serviços e regiões podem não estar disponíveis durante a execução.

### Greener Metrics Aggregator

| Código HTTP | Situação                                                           |
| ----------- | ------------------------------------------------------------------ |
| `200`       | Operação realizada com sucesso.                                    |
| `404`       | Serviço não está listado, foi removido ou as métricas não existem. |
| `500`       | Serviço ou exportador de métricas indisponível.                    |

### Greener Carbon Intensity

| Código HTTP | Situação                               |
| ----------- | -------------------------------------- |
| `200`       | Operação realizada com sucesso.        |
| `404`       | Região solicitada não está registrada. |

### Estrutura padrão de erro

As APIs utilizam uma estrutura contendo:

```json
{
  "error": "region_not_found",
  "message": "region 'unknown' is not registered"
}
```

Os campos são:

| Campo     | Tipo     | Descrição                     |
| --------- | -------- | ----------------------------- |
| `error`   | `string` | Código identificador do erro. |
| `message` | `string` | Mensagem descritiva do erro.  |

A aplicação deve tratar esses erros adequadamente para evitar que a indisponibilidade de um serviço externo interrompa de forma inesperada o funcionamento do sistema.

---

## 8. Resumo da Integração

A integração pode ser resumida da seguinte forma:

```text
1. GET /services
        |
        v
Identificação do serviço
        |
        +---- id
        |
        +---- localização
        |
        +---- region_code
        |
        v
2. GET /metrics/{service_id}
        |
        v
Métricas do serviço
        |
        v
3. GET /carbon-intensity/{region_code}
        |
        v
Fator de intensidade de carbono
        |
        v
4. Associação dos dados
        |
        +---- Serviço
        +---- Métricas
        +---- Localização
        +---- Intensidade de carbono
        |
        v
5. Cálculo/visualização dos indicadores ambientais
```

Dessa forma, o **Greener Metrics Aggregator** é responsável pela descoberta dos serviços, localização e métricas operacionais, enquanto o **Greener Carbon Intensity** fornece os fatores regionais necessários para relacionar o consumo de energia à emissão estimada de CO₂e.

O `region_code` funciona como o principal elemento de ligação entre as duas APIs, permitindo que os dados de localização do serviço sejam associados aos respectivos dados de intensidade de carbono.
