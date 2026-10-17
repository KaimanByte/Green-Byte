import { useContext } from 'react'
import { GreenDataContext, type GreenDataContextValue } from '../contexts/GreenDataContext'

/** Acessa os dados compartilhados do dashboard. Requer `<GreenDataProvider>` acima na árvore. */
export function useGreenData(): GreenDataContextValue {
  const context = useContext(GreenDataContext)
  if (!context) {
    throw new Error('useGreenData deve ser usado dentro de <GreenDataProvider>.')
  }
  return context
}