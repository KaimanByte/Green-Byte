import { useState, type FormEvent } from 'react'
import { Cpu, Gauge, HardDrive, MemoryStick, Network, RotateCcw, Save, type LucideIcon } from 'lucide-react'
import { MACHINE_FIELDS, percentChange, powerBreakdown, type MachineField, type ResourceUsage } from '../../../lib/admin'
import { decimal } from '../../../lib/format'
import type { SettingsDto, SettingsValues } from '../../../types/api'
import styles from './admin.module.css'

type Props = {
  settings: SettingsDto
  canEdit: boolean
  onSave: (changes: Partial<SettingsValues>, successMessage: string) => Promise<boolean>
}

type FieldSpec = {
  label: string
  description: string
  unit: string
  icon: LucideIcon
  /** faixa do controle deslizante (o campo numérico aceita até o limite do servidor) */
  sliderMax: number
  step: number
}

const FIELDS: Record<MachineField, FieldSpec> = {
  cpuMaxWatts: {
    label: 'CPU a 100%',
    description: 'Potência do processador em carga total. O uso de CPU de cada coleta é uma fração disso.',
    unit: 'W',
    icon: Cpu,
    sliderMax: 500,
    step: 5,
  },
  ramWattsPerGb: {
    label: 'Memória',
    description: 'Potência para cada GB de memória em uso.',
    unit: 'W/GB',
    icon: MemoryStick,
    sliderMax: 2,
    step: 0.005,
  },
  diskWattsPerGb: {
    label: 'Disco',
    description: 'Potência para cada GB de disco em uso.',
    unit: 'W/GB',
    icon: HardDrive,
    sliderMax: 0.5,
    step: 0.005,
  },
  networkWattsPerGb: {
    label: 'Rede',
    description: 'Potência para cada GB trafegado na rede.',
    unit: 'W/GB',
    icon: Network,
    sliderMax: 0.5,
    step: 0.005,
  },
}

// máquinas de referência da prévia (uso de recursos em uma coleta)
const PROFILES: { id: string; label: string; usage: ResourceUsage }[] = [
  { id: 'leve', label: 'Leve', usage: { cpuPercent: 15, memoryGb: 4, diskGb: 50, networkGb: 1 } },
  { id: 'media', label: 'Média', usage: { cpuPercent: 50, memoryGb: 16, diskGb: 200, networkGb: 5 } },
  { id: 'pesada', label: 'Pesada', usage: { cpuPercent: 90, memoryGb: 64, diskGb: 1000, networkGb: 20 } },
]

const PARTS = [
  { key: 'cpu', label: 'CPU' },
  { key: 'memory', label: 'Memória' },
  { key: 'disk', label: 'Disco' },
  { key: 'network', label: 'Rede' },
] as const

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 })
const toText = (value: number) => String(value).replace('.', ',')
const parse = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')))

type Draft = Record<MachineField, string>

const toDraft = (values: SettingsValues): Draft => ({
  cpuMaxWatts: toText(values.cpuMaxWatts),
  ramWattsPerGb: toText(values.ramWattsPerGb),
  diskWattsPerGb: toText(values.diskWattsPerGb),
  networkWattsPerGb: toText(values.networkWattsPerGb),
})

/** Dados da máquina: parâmetros de potência do modelo de energia, com prévia do efeito. */
export function MachineSection({ settings, canEdit, onSave }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings))
  const [profileId, setProfileId] = useState('media')
  const [isSaving, setIsSaving] = useState(false)

  const values = Object.fromEntries(MACHINE_FIELDS.map((field) => [field, parse(draft[field])])) as Record<MachineField, number>
  const isFieldValid = (field: MachineField) =>
    Number.isFinite(values[field]) && values[field] >= settings.limits[field].min && values[field] <= settings.limits[field].max
  const invalidFields = MACHINE_FIELDS.filter((field) => !isFieldValid(field))
  const changedFields = MACHINE_FIELDS.filter((field) => isFieldValid(field) && values[field] !== settings[field])
  const isDirty = MACHINE_FIELDS.some((field) => values[field] !== settings[field])
  const canSubmit = invalidFields.length === 0 && changedFields.length > 0 && !isSaving
  const isAtDefaults = MACHINE_FIELDS.every((field) => values[field] === settings.defaults[field])

  // a prévia usa o valor salvo nos campos ainda inválidos
  const model = Object.fromEntries(
    MACHINE_FIELDS.map((field) => [field, isFieldValid(field) ? values[field] : settings[field]]),
  ) as Record<MachineField, number>
  const profile = PROFILES.find((item) => item.id === profileId) ?? PROFILES[1]
  const power = powerBreakdown(profile.usage, model)
  const savedPower = powerBreakdown(profile.usage, settings)
  const change = percentChange(savedPower.total, power.total)

  const setField = (field: MachineField, text: string) => setDraft((current) => ({ ...current, [field]: text }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setIsSaving(true)
    const changes = Object.fromEntries(changedFields.map((field) => [field, values[field]]))
    await onSave(changes, 'Dados da máquina salvos. Valem a partir da próxima coleta.')
    setIsSaving(false)
  }

  return (
    <form className={styles.stack} onSubmit={submit}>
      <fieldset className={`${styles.fieldset} ${styles.paramGrid}`} disabled={!canEdit || isSaving}>
        <legend className={styles.srOnly}>Parâmetros de potência da máquina</legend>
        {MACHINE_FIELDS.map((field) => {
          const spec = FIELDS[field]
          const Icon = spec.icon
          const valid = isFieldValid(field)
          const isChanged = valid && values[field] !== settings[field]
          const isDefault = values[field] === settings.defaults[field]
          const limits = settings.limits[field]

          return (
            <div key={field} className={styles.card} data-changed={isChanged}>
              <header className={styles.cardHeader}>
                <label className={styles.cardTitle} htmlFor={`machine-${field}`}>
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  {spec.label}
                </label>
                {isChanged && <span className={styles.badge} data-tone="warn">Alterado</span>}
              </header>
              <p className={styles.hint}>{spec.description}</p>

              <div className={styles.sliderRow}>
                <input
                  className={styles.slider}
                  type="range"
                  aria-label={`${spec.label} (controle deslizante)`}
                  min={limits.min}
                  max={spec.sliderMax}
                  step={spec.step}
                  value={valid ? Math.min(values[field], spec.sliderMax) : settings[field]}
                  onChange={(event) => setField(field, toText(Number(event.target.value)))}
                />
                <div className={styles.numberField}>
                  <input
                    id={`machine-${field}`}
                    className={styles.input}
                    inputMode="decimal"
                    value={draft[field]}
                    aria-invalid={!valid}
                    aria-describedby={`machine-${field}-hint`}
                    onChange={(event) => setField(field, event.target.value)}
                  />
                  <span className={styles.unit} aria-hidden="true">{spec.unit}</span>
                </div>
              </div>

              <p id={`machine-${field}-hint`} className={valid ? styles.defaultLine : styles.fieldError}>
                {valid ? (
                  <>
                    Padrão do modelo: {number.format(settings.defaults[field])} {spec.unit}
                    {!isDefault && (
                      <button type="button" className={styles.link} onClick={() => setField(field, toText(settings.defaults[field]))}>
                        usar padrão
                      </button>
                    )}
                  </>
                ) : (
                  `Use um número entre ${number.format(limits.min)} e ${number.format(limits.max)} ${spec.unit}.`
                )}
              </p>
            </div>
          )
        })}
      </fieldset>

      {/* ---------- prévia ---------- */}
      <section className={styles.card} aria-labelledby="machine-preview-title">
        <header className={styles.cardHeader}>
          <h3 id="machine-preview-title" className={styles.cardTitle}>
            <Gauge size={16} strokeWidth={1.75} aria-hidden="true" />
            Prévia: potência estimada de uma máquina
          </h3>
          <div className={styles.segmented} role="group" aria-label="Máquina de referência">
            {PROFILES.map((item) => (
              <button key={item.id} type="button" aria-pressed={item.id === profile.id} onClick={() => setProfileId(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <p className={styles.hint}>
          {profile.usage.cpuPercent}% de CPU · {profile.usage.memoryGb} GB de memória · {profile.usage.diskGb} GB de disco ·{' '}
          {profile.usage.networkGb} GB de rede
        </p>

        <div className={styles.powerRow} aria-live="polite">
          <p className={styles.powerTotal}>
            <span className={styles.bigValue}>{decimal.format(power.total)}</span> W
          </p>
          {isDirty && change !== null && Math.abs(change) >= 0.05 && (
            <span className={styles.badge} data-tone={change > 0 ? 'warn' : 'ok'}>
              {change > 0 ? '+' : '−'}
              {decimal.format(Math.abs(change))}% em relação ao salvo ({decimal.format(savedPower.total)} W)
            </span>
          )}
        </div>

        <div className={styles.stackedBar} aria-hidden="true">
          {PARTS.map(({ key }) => (
            <span key={key} data-part={key} style={{ flexGrow: power.total > 0 ? power[key] / power.total : 0 }} />
          ))}
        </div>
        <ul className={styles.partList}>
          {PARTS.map(({ key, label }) => (
            <li key={key} data-part={key}>
              <span className={styles.partDot} aria-hidden="true" />
              {label}
              <strong>{decimal.format(power[key])} W</strong>
              <span className={styles.partShare}>
                {power.total > 0 ? decimal.format((power[key] / power.total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>
          Em 1 hora nessa carga: {number.format(power.total / 1000)} kWh. A alteração vale para as próximas coletas; o
          histórico já gravado não é recalculado.
        </p>
      </section>

      {canEdit ? (
        <footer className={styles.actions}>
          <button
            type="button"
            className={styles.ghost}
            disabled={isAtDefaults || isSaving}
            onClick={() => setDraft(toDraft(settings.defaults))}
          >
            <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
            Restaurar padrão do modelo
          </button>
          <button type="button" className={styles.ghost} disabled={!isDirty || isSaving} onClick={() => setDraft(toDraft(settings))}>
            Descartar
          </button>
          <button type="submit" className={`liquid liquid--tint ${styles.primary}`} disabled={!canSubmit}>
            <span className="liquid__ring" aria-hidden="true" />
            <Save size={14} strokeWidth={1.75} aria-hidden="true" />
            {isSaving ? 'Salvando…' : 'Salvar dados da máquina'}
          </button>
        </footer>
      ) : (
        <p className={styles.readOnly}>Seu papel permite só consultar. Peça a um administrador ou operador para alterar.</p>
      )}
    </form>
  )
}
