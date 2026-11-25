import { useEffect, useState } from 'react'

/**
 * Horário atual que avança sozinho, para textos relativos ("há 12 s") não ficarem parados
 * entre uma atualização de dados e outra. Com a aba escondida o relógio para; ao voltar,
 * ele se atualiza na hora.
 */
export function useNow(intervalMs = 1_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let timer = 0
    const schedule = () => {
      window.clearInterval(timer)
      if (document.visibilityState !== 'visible') return
      setNow(Date.now())
      timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    }

    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [intervalMs])

  return now
}
