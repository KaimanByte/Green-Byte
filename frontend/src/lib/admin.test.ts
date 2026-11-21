import { describe, expect, it } from 'vitest'
import {
  can,
  collectionTicks,
  describeAuditAction,
  describeAuditChange,
  estimateIntervalImpact,
  formatInterval,
  getAuditCategory,
  getIntervalAdvice,
  nearestStepIndex,
  percentChange,
  powerBreakdown,
} from './admin'

describe('permissões por papel', () => {
  it('administrador pode tudo', () => {
    expect(can('admin', 'manageUsers')).toBe(true)
    expect(can('admin', 'editSettings')).toBe(true)
  })

  it('operador configura e lê a auditoria, mas não gerencia usuários', () => {
    expect(can('operator', 'editSettings')).toBe(true)
    expect(can('operator', 'viewAudit')).toBe(true)
    expect(can('operator', 'manageUsers')).toBe(false)
  })

  it('sessão sem papel não recebe acesso', () => {
    expect(can(undefined, 'viewSettings')).toBe(false)
    expect(can(undefined, 'editSettings')).toBe(false)
    expect(can(undefined, 'viewAudit')).toBe(false)
  })
})

describe('formatInterval', () => {
  it.each([
    [5, '5 s'],
    [60, '1 min'],
    [90, '1 min 30 s'],
    [900, '15 min'],
    [3600, '1 h'],
    [5400, '1 h 30 min'],
  ])('%i s -> %s', (seconds, text) => {
    expect(formatInterval(seconds)).toBe(text)
  })
})

describe('impacto do intervalo', () => {
  it('30 s com 8 serviços: 2880 ciclos, 1200 chamadas por hora, 23040 linhas por dia', () => {
    const impact = estimateIntervalImpact(30, 8)
    expect(impact.cyclesPerDay).toBe(2880)
    expect(impact.requestsPerHour).toBe(1200)
    expect(impact.rowsPerDay).toBe(23040)
    expect(impact.rowsPerMonth).toBe(691200)
  })

  it('dobrar o intervalo corta pela metade chamadas e linhas', () => {
    const fast = estimateIntervalImpact(30, 5)
    const slow = estimateIntervalImpact(60, 5)
    expect(slow.requestsPerHour).toBe(fast.requestsPerHour / 2)
    expect(slow.rowsPerDay).toBe(fast.rowsPerDay / 2)
  })

  it('sem serviços ainda há as duas chamadas fixas por ciclo e nenhuma linha', () => {
    const impact = estimateIntervalImpact(60, 0)
    expect(impact.requestsPerHour).toBe(120)
    expect(impact.rowsPerDay).toBe(0)
  })

  it('avisa nos extremos e aprova a faixa recomendada', () => {
    expect(getIntervalAdvice(5).tone).toBe('warn')
    expect(getIntervalAdvice(30).tone).toBe('ok')
    expect(getIntervalAdvice(900).tone).toBe('ok')
    expect(getIntervalAdvice(3600).tone).toBe('warn')
  })

  it('acha a posição do controle mais próxima e marca as coletas na janela', () => {
    expect(nearestStepIndex(30)).toBe(4)
    expect(nearestStepIndex(70)).toBe(6)
    expect(nearestStepIndex(999_999)).toBe(14)
    expect(collectionTicks(60, 300)).toEqual([0, 60, 120, 180, 240])
  })
})

describe('potência da máquina', () => {
  const model = { cpuMaxWatts: 100, ramWattsPerGb: 0.375, diskWattsPerGb: 0.01, networkWattsPerGb: 0.02 }

  it('bate com o exemplo do modelo: 50,87 W', () => {
    const power = powerBreakdown({ cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1 }, model)
    expect(power.cpu).toBe(50)
    expect(power.memory).toBe(0.75)
    expect(power.disk).toBeCloseTo(0.1, 10)
    expect(power.network).toBeCloseTo(0.02, 10)
    expect(power.total).toBeCloseTo(50.87, 10)
  })

  it('calcula a variação percentual e não divide por zero', () => {
    expect(percentChange(100, 150)).toBe(50)
    expect(percentChange(200, 100)).toBe(-50)
    expect(percentChange(0, 10)).toBeNull()
  })
})

describe('auditoria', () => {
  it('descreve cada tipo de alteração de forma legível', () => {
    expect(describeAuditChange({ field: 'collectionIntervalSeconds', from: 30, to: 60 })).toBe('intervalo de coleta: 30 s → 1 min')
    expect(describeAuditChange({ field: 'cpuMaxWatts', from: 100, to: 120.5 })).toBe('potência máxima da CPU: 100 W → 120,5 W')
    expect(describeAuditChange({ field: 'role', from: 'operator', to: 'admin' })).toBe('papel: Operador → Administrador')
    expect(describeAuditChange({ field: 'active', from: true, to: false })).toBe('situação: ativa → desativada')
    expect(describeAuditChange({ field: 'role', from: null, to: 'admin' })).toBe('papel: Administrador')
    expect(describeAuditChange({ field: 'password', from: null, to: 'redefinida' })).toBe('senha redefinida')
  })

  it('dá título e categoria ao registro', () => {
    expect(describeAuditAction({ action: 'user.delete', target: 'a@b.c' })).toBe('Excluiu o usuário a@b.c')
    expect(describeAuditAction({ action: 'settings.update', target: null })).toBe('Alterou a configuração do monitoramento')
    expect(getAuditCategory('settings.update')).toBe('settings')
    expect(getAuditCategory('user.create')).toBe('users')
  })
})
