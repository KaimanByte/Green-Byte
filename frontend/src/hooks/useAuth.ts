import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'

/** Acessa a sessão de login. Requer `<AuthProvider>` acima na árvore. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  }
  return context
}
