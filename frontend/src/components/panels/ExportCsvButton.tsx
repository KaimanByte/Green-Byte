import { Download } from 'lucide-react'
import { downloadCsv } from '../../lib/csv'
import dash from './DashboardPanel.module.css'

type Props = {
  /** texto do botão */
  label: string
  /** o que vai no arquivo, para leitores de tela */
  description: string
  fileName: () => string
  /** gera o conteúdo só no clique, com os dados da hora */
  content: () => string
  disabled?: boolean
}

/** Botão "Exportar CSV" alinhado à direita, no fim de uma seção. */
export function ExportCsvButton({ label, description, fileName, content, disabled = false }: Props) {
  return (
    <div className={dash.exportRow}>
      <button
        type="button"
        className={dash.refresh}
        onClick={() => downloadCsv(fileName(), content())}
        disabled={disabled}
        aria-label={`${label}: ${description}`}
        title={description}
      >
        <Download size={14} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </button>
    </div>
  )
}
