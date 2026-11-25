import { describe, expect, it } from 'vitest'
import type { CompareDto, TimeSeriesCompareDto, TimeSeriesPointDto } from '../types/api'
import { compareSeriesCsv, compareTotalsCsv, csvFileName, formatCsvDate, serviceSeriesCsv, slugify, toCsv, utcOffsetLabel } from './csv'

const point = (timestamp: string, overrides: Partial<TimeSeriesPointDto> = {}): TimeSeriesPointDto => ({
  timestamp,
  collectionsCount: 2,
  servicesCount: 1,
  cpuPercent: 20.5,
  memoryGb: 2,
  diskGb: 10,
  energyKwh: 0.0961,
  co2Emissions: 36.3,
  ...overrides,
})

const lines = (csv: string) => csv.trimEnd().split('\r\n')

describe('toCsv', () => {
  it('usa ";" como separador, vírgula decimal e quebra de linha do Windows', () => {
    expect(toCsv(['a', 'b'], [[1.5, 'x']])).toBe('a;b\r\n1,5;x\r\n')
  })

  it('não arredonda nem agrupa milhar', () => {
    expect(lines(toCsv(['v'], [[1234567.000123]]))[1]).toBe('1234567,000123')
  })

  it('deixa a célula vazia para null, undefined e número inválido', () => {
    expect(lines(toCsv(['a', 'b', 'c'], [[null, undefined, Number.NaN]]))[1]).toBe(';;')
  })

  it('coloca entre aspas o texto com ";", aspas ou quebra de linha', () => {
    expect(lines(toCsv(['t'], [['a;b']]))[1]).toBe('"a;b"')
    expect(lines(toCsv(['t'], [['diz "oi"']]))[1]).toBe('"diz ""oi"""')
  })

  it('impede que um texto vire fórmula no Excel', () => {
    expect(lines(toCsv(['t'], [['=SOMA(A1)'], ['-1+2'], ['@x']])).slice(1)).toEqual(["'=SOMA(A1)", "'-1+2", "'@x"])
  })

  it('números negativos continuam números', () => {
    expect(lines(toCsv(['v'], [[-2.5]]))[1]).toBe('-2,5')
  })
})

describe('formatCsvDate / slugify / csvFileName', () => {
  it('formata a data no horário local', () => {
    expect(formatCsvDate(new Date(2026, 10, 21, 9, 5))).toBe('2026-11-21 09:05')
  })

  it('gera trecho de nome de arquivo sem acento nem espaço', () => {
    expect(slugify('Serviço Ação / Teste')).toBe('servico-acao-teste')
    expect(slugify('***')).toBe('dados')
  })

  it('descreve o fuso das datas como deslocamento em relação ao UTC', () => {
    expect(utcOffsetLabel({ getTimezoneOffset: () => 180 })).toBe('UTC-03:00')
    expect(utcOffsetLabel({ getTimezoneOffset: () => 0 })).toBe('UTC+00:00')
    expect(utcOffsetLabel({ getTimezoneOffset: () => -330 })).toBe('UTC+05:30')
  })

  it('monta o nome do arquivo com data e hora', () => {
    expect(csvFileName(['comparacao', '24h'], new Date(2026, 10, 21, 19, 5))).toBe('greenbyte-comparacao-24h-20261121-1905.csv')
  })
})

describe('serviceSeriesCsv', () => {
  it('exporta todas as métricas, uma linha por intervalo com coleta', () => {
    const csv = serviceSeriesCsv('Fraud Detector', 'us-east', [
      point(new Date(2026, 10, 21, 10, 0).toISOString()),
      point(new Date(2026, 10, 21, 10, 15).toISOString(), { collectionsCount: 1, cpuPercent: 40 }),
    ])
    const [header, first, second] = lines(csv)

    expect(header.split(';')).toEqual([
      'Serviço',
      'Região',
      `Início do intervalo (${utcOffsetLabel(new Date(2026, 10, 21, 10, 0))})`,
      'Coletas',
      'CO₂e médio por coleta (gCO₂e)',
      'Energia média por coleta (kWh)',
      'CPU média (%)',
      'Memória média (GB)',
      'Disco médio (GB)',
    ])
    expect(first).toBe('Fraud Detector;us-east;2026-11-21 10:00;2;36,3;0,0961;20,5;2;10')
    expect(second).toBe('Fraud Detector;us-east;2026-11-21 10:15;1;36,3;0,0961;40;2;10')
  })

  it('sem coletas no período, exporta só o cabeçalho', () => {
    expect(lines(serviceSeriesCsv('X', 'r', []))).toHaveLength(1)
  })
})

describe('compareSeriesCsv', () => {
  it('formato longo: serviços na ordem da seleção, intervalos em ordem cronológica', () => {
    const data: TimeSeriesCompareDto = {
      period: { from: '2026-11-21T00:00:00.000Z', to: '2026-11-22T00:00:00.000Z' },
      bucketSeconds: 900,
      aggregation: 'avg',
      units: { energyKwh: 'kWh', co2Emissions: 'gCO2e', cpuPercent: '%', memoryGb: 'GB', diskGb: 'GB' },
      total: 3,
      series: [
        { serviceId: 'b', name: 'Billing', regionCode: 'br-sudeste', total: 1, points: [point(new Date(2026, 10, 21, 10).toISOString())] },
        { serviceId: 'e', name: 'Email', regionCode: 'eu-west', total: 0, points: [] },
        { serviceId: 'a', name: 'Audit', regionCode: 'jp-east', total: 1, points: [point(new Date(2026, 10, 21, 11).toISOString())] },
      ],
    }
    const rows = lines(compareSeriesCsv(data)).slice(1)

    expect(rows.map((row) => row.split(';').slice(0, 3).join(' | '))).toEqual([
      'Billing | br-sudeste | 2026-11-21 10:00',
      'Audit | jp-east | 2026-11-21 11:00',
    ])
  })
})

describe('compareTotalsCsv', () => {
  it('exporta os totais do período e deixa vazio quem não estava ativo (não inventa zero)', () => {
    const data: CompareDto = {
      period: { from: new Date(2026, 10, 20, 19).toISOString(), to: new Date(2026, 10, 21, 19).toISOString() },
      units: { energyKwh: 'kWh', co2Emissions: 'gCO2e' },
      total: 2,
      items: [
        { serviceId: 'svc-1', name: 'Fraud Detector', regionCode: 'us-east', state: 'active', collectionsCount: 133, energyKwh: 0.0961, co2Emissions: 36.3 },
        { serviceId: 'svc-2', name: 'Legacy', regionCode: 'eu-west', state: 'unavailable', collectionsCount: 0, energyKwh: 0, co2Emissions: 0 },
      ],
    }
    const [header, active, inactive] = lines(compareTotalsCsv(data))

    const offset = utcOffsetLabel(new Date(2026, 10, 20, 19))
    expect(header).toBe(
      `Serviço;ID;Região;Estado no período;Coletas;CO₂e no período (gCO₂e);Energia no período (kWh);Início do período (${offset});Fim do período (${offset})`,
    )
    expect(active).toBe('Fraud Detector;svc-1;us-east;ativo;133;36,3;0,0961;2026-11-20 19:00;2026-11-21 19:00')
    expect(inactive).toBe('Legacy;svc-2;eu-west;indisponível;0;;;2026-11-20 19:00;2026-11-21 19:00')
  })
})
