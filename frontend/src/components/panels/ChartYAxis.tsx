import { tickFormatter, type ChartScale } from '../../lib/chartScale'
import styles from './DashboardPanel.module.css'

type Props = {
  scale: ChartScale
  /** unidade dos valores, mostrada no topo do eixo (ex.: "gCO₂e") */
  unit: string
  /** posição vertical de um valor, em % da altura do gráfico (a mesma usada para desenhar a linha) */
  yPercent: (value: number) => number
}

/**
 * Eixo vertical dos gráficos: a unidade no topo e os valores das linhas de grade ao lado,
 * para dar escala à linha. Vai dentro de `.chartBody`, ao lado do `.chartPlot`.
 * Só visual: os valores exatos continuam no tooltip e na descrição acessível do gráfico.
 */
export function ChartYAxis({ scale, unit, yPercent }: Props) {
  const format = tickFormatter(scale.step)
  const labels = scale.ticks.map(format)
  const widest = labels.reduce((a, b) => (b.length > a.length ? b : a), '')

  return (
    <>
      <span className={styles.yAxisUnit} aria-hidden="true">
        {unit}
      </span>
      <div className={styles.yAxis} aria-hidden="true">
        {/* invisível: dá ao eixo a largura do maior valor (as marcas são posicionadas por cima) */}
        <span className={styles.yAxisSizer}>{widest}</span>
        {scale.ticks.map((tick, i) => (
          <span key={tick} className={styles.yTick} style={{ top: `${yPercent(tick)}%` }}>
            {labels[i]}
          </span>
        ))}
      </div>
    </>
  )
}
