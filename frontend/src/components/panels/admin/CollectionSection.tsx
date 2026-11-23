import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Activity, CircleAlert, CircleCheck, Save, Timer, TriangleAlert } from 'lucide-react'
import {
  INTERVAL_PRESETS,
  INTERVAL_STEPS,
  collectionTicks,
  estimateIntervalImpact,
  formatInterval,
  getIntervalAdvice,
  nearestStepIndex,
} from '../../../lib/admin'
import { formatRelative, formatTime, integer } from '../../../lib/format'
import { dashboardRefreshIntervalMs } from '../../../lib/collectionRefresh'
import { getCollectionStatus } from '../../../services/adminService'
import type { CollectionStatusDto, SettingsDto, SettingsValues } from '../../../types/api'
import styles from './admin.module.css'

type Props = {
  settings: SettingsDto
  servicesCount: number
  canEdit: boolean
  onSave: (changes: Partial<SettingsValues>, successMessage: string) => Promise<boolean>
}

// janela do simulador: 10 minutos
const SIMULATOR_WINDOW_SECONDS = 600
// acima disso os traços viram uma faixa contínua (não daria para distinguir um do outro)
const MAX_VISIBLE_TICKS = 121

type Health = { tone: 'ok' | 'warn' | 'bad' | 'idle'; label: string }

function getHealth(status: CollectionStatusDto | null, failed: boolean): Health {
  if (failed) return { tone: 'bad', label: 'Sem resposta do servidor' }
  if (!status) return { tone: 'idle', label: 'Consultando…' }
  if (status.isRunning) return { tone: 'ok', label: 'Coletando agora' }
  if (!status.lastCycle) return { tone: 'idle', label: 'Aguardando o primeiro ciclo' }
  if (!status.lastCycle.succeeded) return { tone: 'bad', label: 'Último ciclo falhou' }
  if (status.lastCycle.collectionsSaved === 0) return { tone: 'warn', label: 'Ciclo sem coletas gravadas' }
  return { tone: 'ok', label: 'Em dia' }
}

function SimulatorRow({ label, intervalSeconds, tone }: { label: string; intervalSeconds: number; tone: 'current' | 'draft' }) {
  const ticks = collectionTicks(intervalSeconds, SIMULATOR_WINDOW_SECONDS)
  const isDense = ticks.length > MAX_VISIBLE_TICKS

  return (
    <div className={styles.simRow} data-tone={tone}>
      <span className={styles.simLabel}>{label}</span>
      <svg className={styles.simTrack} viewBox="0 0 600 20" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="10" x2="600" y2="10" className={styles.simAxis} />
        {isDense ? (
          <rect x="0" y="4" width="600" height="12" className={styles.simBand} />
        ) : (
          ticks.map((time) => <line key={time} x1={time} y1="3" x2={time} y2="17" className={styles.simTick} />)
        )}
      </svg>
      <span className={styles.simCount}>
        {integer.format(Math.floor(SIMULATOR_WINDOW_SECONDS / intervalSeconds))} coletas
      </span>
    </div>
  )
}

/** Tempo de coleta: escolha do intervalo, prévia do impacto e saúde da coleta em tempo real. */
export function CollectionSection({ settings, servicesCount, canEdit, onSave }: Props) {
  const saved = settings.collectionIntervalSeconds
  const statusRefreshMs = dashboardRefreshIntervalMs(saved)
  const limits = settings.limits.collectionIntervalSeconds
  const [text, setText] = useState(String(saved))
  const [isSaving, setIsSaving] = useState(false)

  const [status, setStatus] = useState<CollectionStatusDto | null>(null)
  const [statusFailed, setStatusFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // saúde da coleta: consulta periódica enquanto a aba está aberta
  useEffect(() => {
    const controller = new AbortController()
    const load = () =>
      getCollectionStatus({ signal: controller.signal }).then(
        (next) => {
          setStatus(next)
          setStatusFailed(false)
        },
        () => {
          if (!controller.signal.aborted) setStatusFailed(true)
        },
      )
    void load()
    const timer = window.setInterval(load, statusRefreshMs)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [saved, statusRefreshMs])

  // relógio da contagem regressiva
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const value = Number(text)
  const isValid = text.trim() !== '' && Number.isInteger(value) && value >= limits.min && value <= limits.max
  const draft = isValid ? value : saved
  const isDirty = isValid && value !== saved

  const impact = estimateIntervalImpact(draft, servicesCount)
  const currentImpact = estimateIntervalImpact(saved, servicesCount)
  const advice = getIntervalAdvice(draft)
  const loadFactor = saved / draft

  const health = getHealth(status, statusFailed)
  const lastCycle = status?.lastCycle ?? null
  const secondsToNext = status?.nextRunAt ? Math.max(0, Math.round((new Date(status.nextRunAt).getTime() - now) / 1000)) : null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isDirty || isSaving) return
    setIsSaving(true)
    await onSave({ collectionIntervalSeconds: value }, `Coleta agora a cada ${formatInterval(value)}. Já está valendo.`)
    setIsSaving(false)
  }

  return (
    <div className={styles.stack}>
      {/* ---------- saúde ---------- */}
      <section className={styles.card} aria-labelledby="collection-health-title">
        <header className={styles.cardHeader}>
          <h3 id="collection-health-title" className={styles.cardTitle}>
            <Activity size={16} strokeWidth={1.75} aria-hidden="true" />
            Saúde da coleta
          </h3>
          <span className={styles.badge} data-tone={health.tone} role="status">
            {health.tone === 'bad' ? (
              <CircleAlert size={13} strokeWidth={2} aria-hidden="true" />
            ) : health.tone === 'warn' ? (
              <TriangleAlert size={13} strokeWidth={2} aria-hidden="true" />
            ) : health.tone === 'ok' ? (
              <CircleCheck size={13} strokeWidth={2} aria-hidden="true" />
            ) : null}
            {health.label}
          </span>
        </header>

        <dl className={styles.metrics}>
          <div>
            <dt>Intervalo em vigor</dt>
            <dd>{status ? formatInterval(status.intervalSeconds) : '—'}</dd>
          </div>
          <div>
            <dt>Próxima coleta</dt>
            <dd>{status?.isRunning ? 'em andamento' : secondsToNext === null ? '—' : `em ${formatInterval(secondsToNext)}`}</dd>
          </div>
          <div>
            <dt>Último ciclo</dt>
            <dd title={lastCycle ? formatTime(new Date(lastCycle.finishedAt)) : undefined}>
              {lastCycle ? formatRelative(new Date(lastCycle.finishedAt), new Date(now)) : '—'}
            </dd>
          </div>
          <div>
            <dt>Duração</dt>
            <dd>{lastCycle ? `${integer.format(lastCycle.durationMs)} ms` : '—'}</dd>
          </div>
          <div>
            <dt>Coletas gravadas</dt>
            <dd>{lastCycle ? integer.format(lastCycle.collectionsSaved) : '—'}</dd>
          </div>
        </dl>

        {lastCycle && !lastCycle.succeeded && (
          <p className={styles.alert} data-tone="bad">
            <CircleAlert size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>
              Falhou na etapa de <strong>{lastCycle.failedStep}</strong>
              {lastCycle.errorMessage ? `: ${lastCycle.errorMessage}` : '.'}
            </span>
          </p>
        )}
      </section>

      {/* ---------- intervalo ---------- */}
      <form className={styles.card} onSubmit={submit} aria-labelledby="collection-interval-title">
        <header className={styles.cardHeader}>
          <h3 id="collection-interval-title" className={styles.cardTitle}>
            <Timer size={16} strokeWidth={1.75} aria-hidden="true" />
            Intervalo entre coletas
          </h3>
          <span className={styles.bigValue}>{formatInterval(draft)}</span>
        </header>

        <fieldset className={styles.fieldset} disabled={!canEdit || isSaving}>
          <div className={styles.presets} role="group" aria-label="Intervalos rápidos">
            {INTERVAL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={styles.chip}
                aria-pressed={draft === preset}
                onClick={() => setText(String(preset))}
              >
                {formatInterval(preset)}
              </button>
            ))}
          </div>

          <div className={styles.sliderRow}>
            <label className={styles.srOnly} htmlFor="collection-interval-slider">Intervalo (controle deslizante)</label>
            <input
              id="collection-interval-slider"
              className={styles.slider}
              type="range"
              min={0}
              max={INTERVAL_STEPS.length - 1}
              step={1}
              value={nearestStepIndex(draft)}
              // parte já percorrida do trilho, pintada de verde pelo CSS
              style={{ '--fill': `${(nearestStepIndex(draft) / (INTERVAL_STEPS.length - 1)) * 100}%` } as CSSProperties}
              aria-valuetext={formatInterval(draft)}
              onChange={(event) => setText(String(INTERVAL_STEPS[Number(event.target.value)]))}
            />
            <div className={styles.numberField}>
              <label className={styles.srOnly} htmlFor="collection-interval-input">Intervalo em segundos</label>
              <input
                id="collection-interval-input"
                className={styles.input}
                inputMode="numeric"
                value={text}
                aria-invalid={!isValid}
                aria-describedby="collection-interval-hint"
                onChange={(event) => setText(event.target.value.replace(/[^\d]/g, ''))}
              />
              <span className={styles.unit} aria-hidden="true">s</span>
            </div>
          </div>
          <div className={styles.sliderScale} aria-hidden="true">
            <span>5 s</span>
            <span>1 h</span>
          </div>
        </fieldset>

        <p id="collection-interval-hint" className={isValid ? styles.hint : styles.fieldError}>
          {isValid
            ? `Aceita de ${formatInterval(limits.min)} a ${formatInterval(limits.max)}, em segundos inteiros.`
            : `Use um número inteiro entre ${limits.min} e ${integer.format(limits.max)} segundos.`}
        </p>

        {/* ---------- prévia do impacto ---------- */}
        <div className={styles.preview} aria-live="polite">
          <h4 className={styles.previewTitle}>Prévia do impacto {isDirty ? '(ainda não salvo)' : '(valor atual)'}</h4>

          <div className={styles.simulator}>
            <SimulatorRow label="Atual" intervalSeconds={saved} tone="current" />
            {isDirty && <SimulatorRow label="Novo" intervalSeconds={draft} tone="draft" />}
            <p className={styles.simCaption}>Cada traço é uma coleta em 10 minutos.</p>
          </div>

          <dl className={styles.metrics}>
            <div>
              <dt>Chamadas externas</dt>
              <dd>{integer.format(impact.requestsPerHour)} / h</dd>
            </div>
            <div>
              <dt>Coletas gravadas</dt>
              <dd>{integer.format(impact.rowsPerDay)} / dia</dd>
            </div>
            <div>
              <dt>Em 30 dias</dt>
              <dd>{integer.format(impact.rowsPerMonth)} linhas</dd>
            </div>
            <div>
              <dt>Atraso máximo do painel</dt>
              <dd>{formatInterval(draft)}</dd>
            </div>
          </dl>

          {isDirty && (
            <p className={styles.compare}>
              {loadFactor > 1
                ? `${loadFactor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× mais chamadas e coletas que hoje`
                : `${(1 / loadFactor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× menos chamadas e coletas que hoje`}{' '}
              ({integer.format(currentImpact.requestsPerHour)} → {integer.format(impact.requestsPerHour)} chamadas/h).
            </p>
          )}

          <p className={styles.alert} data-tone={advice.tone}>
            {advice.tone === 'warn' ? (
              <TriangleAlert size={15} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <CircleCheck size={15} strokeWidth={1.75} aria-hidden="true" />
            )}
            <span>{advice.message}</span>
          </p>
          <p className={styles.hint}>
            Estimativa com os {servicesCount} serviços monitorados hoje: por ciclo, uma consulta de regiões, uma de
            descoberta e uma de métricas por serviço.
          </p>
        </div>

        {canEdit ? (
          <footer className={styles.actions}>
            <button type="button" className={styles.ghost} disabled={!isDirty && isValid} onClick={() => setText(String(saved))}>
              Descartar
            </button>
            <button type="submit" className={`liquid liquid--tint ${styles.primary}`} disabled={!isDirty || isSaving}>
              <span className="liquid__ring" aria-hidden="true" />
              <Save size={14} strokeWidth={1.75} aria-hidden="true" />
              {isSaving ? 'Salvando…' : 'Salvar intervalo'}
            </button>
          </footer>
        ) : (
          <p className={styles.readOnly}>Seu papel permite só consultar. Peça a um administrador ou operador para alterar.</p>
        )}
      </form>
    </div>
  )
}
