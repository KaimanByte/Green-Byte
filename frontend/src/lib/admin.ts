// Regras de apresentação da área administrativa (funções puras, testadas em admin.test.ts).

import type { AuditChangeDto, AuditLogDto, SettingsField, SettingsValues, UserRole } from '../types/api'

/* ---------- papéis ---------- */

export const ROLE_ORDER: UserRole[] = ['admin', 'operator']

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  operator: 'Operador',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total: configura a coleta e a máquina, gerencia usuários e lê a auditoria.',
  operator: 'Configura a coleta e os dados da máquina e lê a auditoria. Não gerencia usuários.',
}

export type Permission = 'viewSettings' | 'editSettings' | 'viewAudit' | 'manageUsers'

export const PERMISSION_LABELS: Record<Permission, string> = {
  viewSettings: 'Consultar configurações',
  editSettings: 'Alterar coleta e dados da máquina',
  viewAudit: 'Ler a auditoria',
  manageUsers: 'Gerenciar usuários',
}

/** Mesma matriz aplicada no backend pelos guards (@Roles). */
const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['viewSettings', 'editSettings', 'viewAudit', 'manageUsers'],
  operator: ['viewSettings', 'editSettings', 'viewAudit'],
}

/** Sessão sem papel não recebe acesso; o backend continua sendo a regra final. */
export function can(role: UserRole | undefined, permission: Permission): boolean {
  return role !== undefined && PERMISSIONS[role].includes(permission)
}

/* ---------- intervalo de coleta ---------- */

/** 45 s · 1 min · 1 min 30 s · 2 h */
export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} h`)
  if (minutes > 0) parts.push(`${minutes} min`)
  if (rest > 0) parts.push(`${rest} s`)
  return parts.join(' ')
}

/** Atalhos oferecidos como botões. */
export const INTERVAL_PRESETS = [10, 30, 60, 300, 900, 3600]

/** Posições do controle deslizante: passos úteis, não lineares (de 5 s a 1 h). */
export const INTERVAL_STEPS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300, 600, 900, 1800, 3600]

/** Posição do controle deslizante mais próxima de um valor qualquer. */
export function nearestStepIndex(seconds: number, steps: number[] = INTERVAL_STEPS): number {
  let best = 0
  for (let index = 1; index < steps.length; index += 1) {
    if (Math.abs(steps[index] - seconds) < Math.abs(steps[best] - seconds)) best = index
  }
  return best
}

const DAY_SECONDS = 86_400
// por ciclo: 1 consulta de regiões + 1 de descoberta de serviços + 1 de métricas por serviço
const FIXED_REQUESTS_PER_CYCLE = 2

export type IntervalImpact = {
  cyclesPerDay: number
  /** chamadas às APIs externas por hora */
  requestsPerHour: number
  /** linhas novas na tabela de coletas por dia */
  rowsPerDay: number
  rowsPerMonth: number
}

export function estimateIntervalImpact(intervalSeconds: number, servicesCount: number): IntervalImpact {
  const cyclesPerDay = DAY_SECONDS / intervalSeconds
  const rowsPerDay = cyclesPerDay * servicesCount
  return {
    cyclesPerDay,
    requestsPerHour: (cyclesPerDay / 24) * (FIXED_REQUESTS_PER_CYCLE + servicesCount),
    rowsPerDay,
    rowsPerMonth: rowsPerDay * 30,
  }
}

export type IntervalAdvice = { tone: 'ok' | 'warn'; message: string }

export function getIntervalAdvice(intervalSeconds: number): IntervalAdvice {
  if (intervalSeconds < 10) {
    return { tone: 'warn', message: 'Intervalo muito curto: muitas chamadas às APIs externas e o banco cresce rápido.' }
  }
  if (intervalSeconds > 900) {
    return { tone: 'warn', message: 'Intervalo longo: o painel pode mostrar dados com bastante atraso e picos curtos passam sem registro.' }
  }
  return { tone: 'ok', message: 'Dentro da faixa recomendada (de 10 s a 15 min).' }
}

/** Instantes (em s) das coletas dentro de uma janela [0, janela), começando em 0. */
export function collectionTicks(intervalSeconds: number, windowSeconds: number): number[] {
  const ticks: number[] = []
  for (let time = 0; time < windowSeconds; time += intervalSeconds) ticks.push(time)
  return ticks
}

/* ---------- dados da máquina ---------- */

export type MachineField = Exclude<SettingsField, 'collectionIntervalSeconds'>

export const MACHINE_FIELDS: MachineField[] = ['cpuMaxWatts', 'ramWattsPerGb', 'diskWattsPerGb', 'networkWattsPerGb']

export type ResourceUsage = { cpuPercent: number; memoryGb: number; diskGb: number; networkGb: number }

export type PowerBreakdown = { cpu: number; memory: number; disk: number; network: number; total: number }

/** Mesma fórmula do backend (EnergyCalculator.powerWatts), aberta por componente. */
export function powerBreakdown(usage: ResourceUsage, model: Pick<SettingsValues, MachineField>): PowerBreakdown {
  const cpu = (usage.cpuPercent / 100) * model.cpuMaxWatts
  const memory = usage.memoryGb * model.ramWattsPerGb
  const disk = usage.diskGb * model.diskWattsPerGb
  const network = usage.networkGb * model.networkWattsPerGb
  return { cpu, memory, disk, network, total: cpu + memory + disk + network }
}

/** Variação em % entre dois valores; null quando a base é zero. */
export function percentChange(from: number, to: number): number | null {
  if (from === 0) return null
  return ((to - from) / from) * 100
}

/* ---------- auditoria ---------- */

const FIELD_LABELS: Record<string, string> = {
  collectionIntervalSeconds: 'intervalo de coleta',
  cpuMaxWatts: 'potência máxima da CPU',
  ramWattsPerGb: 'potência da memória',
  diskWattsPerGb: 'potência do disco',
  networkWattsPerGb: 'potência da rede',
  email: 'e-mail',
  role: 'papel',
  active: 'situação',
  password: 'senha',
}

const FIELD_UNITS: Record<string, string> = {
  cpuMaxWatts: ' W',
  ramWattsPerGb: ' W/GB',
  diskWattsPerGb: ' W/GB',
  networkWattsPerGb: ' W/GB',
}

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 })

function formatAuditValue(field: string, value: AuditChangeDto['from']): string {
  if (value === null) return '—'
  if (field === 'collectionIntervalSeconds' && typeof value === 'number') return formatInterval(value)
  if (field === 'role' && typeof value === 'string') return ROLE_LABELS[value as UserRole] ?? value
  if (field === 'active') return value ? 'ativa' : 'desativada'
  if (typeof value === 'number') return `${number.format(value)}${FIELD_UNITS[field] ?? ''}`
  return String(value)
}

/** "intervalo de coleta: 30 s → 1 min" */
export function describeAuditChange(change: AuditChangeDto): string {
  const label = FIELD_LABELS[change.field] ?? change.field
  if (change.field === 'password') return 'senha redefinida'
  if (change.from === null) return `${label}: ${formatAuditValue(change.field, change.to)}`
  return `${label}: ${formatAuditValue(change.field, change.from)} → ${formatAuditValue(change.field, change.to)}`
}

export type AuditCategory = 'settings' | 'users'

export function getAuditCategory(action: string): AuditCategory {
  return action.startsWith('settings.') ? 'settings' : 'users'
}

/** Título curto do registro: o que foi feito e com quem. */
export function describeAuditAction(log: Pick<AuditLogDto, 'action' | 'target'>): string {
  const target = log.target ?? 'usuário'
  switch (log.action) {
    case 'settings.update':
      return 'Alterou a configuração do monitoramento'
    case 'user.create':
      return `Criou o usuário ${target}`
    case 'user.update':
      return `Alterou o usuário ${target}`
    case 'user.delete':
      return `Excluiu o usuário ${target}`
    default:
      return log.action
  }
}
