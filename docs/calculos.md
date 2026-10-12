# Fórmulas de cálculo e escopo (energia / água)

> Spike **IT-02** · RF07 · Rubrica TP04
> Base: documentação viva do desafio (docs.unilaunch.org), conferida com os slides e o PDF da ABP 2026-2.

## 1. Modelo

O projeto usa um **modelo simplificado** para estimar o impacto ambiental das aplicações monitoradas.

- Não mede o consumo elétrico real de servidores ou datacenters.
- Fornece uma **estimativa padronizada**, suficiente para comparar serviços, regiões e tendências.
- **Todos os grupos usam o mesmo modelo**, para que os resultados sejam comparáveis.

## 2. Fórmulas

### 2.1 Emissão (fórmula geral)

```text
CO₂e (g) = Energia (kWh) × Intensidade de Carbono (gCO₂e/kWh)
```

A intensidade de carbono é a da região onde o serviço está hospedado (Serviço de Intensidade de Carbono).

### 2.2 Energia

```text
Energia (kWh) = Potência Estimada (W) × Tempo de Coleta (h) / 1000
```

### 2.3 Potência estimada

```text
Potência Estimada (W) = Potência CPU + Potência Memória + Potência Disco + Potência Rede
```

```text
Potência CPU (W)     = (Uso de CPU (%) / 100) × Potência Máxima da CPU (W)
Potência Memória (W) = Memória Utilizada (GB) × Fator de Consumo da Memória (W/GB)
Potência Disco (W)   = Uso de Disco (GB)      × Fator de Consumo do Disco (W/GB)
Potência Rede (W)    = Tráfego de Rede (GB)   × Fator de Consumo da Rede (W/GB)
```

### 2.4 Fórmula consolidada

```text
CO₂e (g) =
[
  (
    (CPU% / 100 × CPU_MAX_WATTS)
    + (RAM_GB × RAM_WATTS_PER_GB)
    + (DISK_GB × DISK_WATTS_PER_GB)
    + (NETWORK_GB × NETWORK_WATTS_PER_GB)
  )
  × TEMPO_HORAS
  / 1000
]
× CARBON_INTENSITY
```

### 2.5 Agregados (RF08)

```text
Energia total = Σ energia dos serviços monitorados
CO₂e total    = Σ CO₂e dos serviços monitorados
```

Serviços indisponíveis ou sem métricas não entram na soma (não há dado); apenas são contados nos indicadores de estado.

## 3. Constantes do exemplo

| Constante | Valor | Unidade |
|---|---|---|
| `CPU_MAX_WATTS` | 100 | W |
| `RAM_WATTS_PER_GB` | 0,375 | W/GB |
| `DISK_WATTS_PER_GB` | 0,01 | W/GB |
| `NETWORK_WATTS_PER_GB` | 0,02 | W/GB |

## 4. Exemplo (vetor de teste para CA-02)

Serviço executado por 60 s em região com `85 gCO₂e/kWh`.

**Entradas**

```text
CPU: 50%            CPU_MAX_WATTS: 100 W
RAM: 2 GB           RAM_WATTS_PER_GB: 0,375 W/GB
DISCO: 10 GB        DISK_WATTS_PER_GB: 0,01 W/GB
REDE: 1 GB          NETWORK_WATTS_PER_GB: 0,02 W/GB
TEMPO: 60 segundos = 0,0167 horas
INTENSIDADE DE CARBONO: 85 gCO₂e/kWh
```

**Potência**

```text
CPU   = 50 / 100 × 100 = 50 W
RAM   = 2 × 0,375      = 0,75 W
DISCO = 10 × 0,01      = 0,10 W
REDE  = 1 × 0,02       = 0,02 W

Potência Estimada = 50 + 0,75 + 0,10 + 0,02 = 50,87 W
```

**Energia**

```text
Energia = 50,87 × 0,0167 / 1000 = 0,0008495 kWh
```

**Emissão**

```text
CO₂e = 0,0008495 × 85 = 0,0722 gCO₂e  ≈  0,072 gCO₂e
```

## 5. Escopo: energia e água

| Indicador | Situação |
|---|---|
| Energia (kWh) | Requisito (RF07, RF08, RF09, RF14) |
| CO₂e (g) | Requisito (RF07, RF08, RF09, RF14) |
| Água | Fora do modelo de cálculo: não há fórmula nem fator definidos, e nenhum RF a exige |

Decisão: o MVP calcula **energia e CO₂e**. A água aparece nos slides apenas como contexto do panorama de datacenters.

## 6. Premissas

- Estimativa padronizada para comparação, não medição elétrica direta.
- Intensidade de carbono em **gCO₂e/kWh**, vinda da API de intensidade de carbono por região.
- Ausência de métrica ou de intensidade: não inventar valor; marcar o cálculo como indisponível (RF06, RNF05, RNF07).
- Unidades e campos exatos das métricas (GB de RAM, disco e rede) seguem o Swagger do Agregador (IT-01).
