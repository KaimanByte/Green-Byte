import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import * as authService from '../services/authService'
import { clearSession, getSession, saveSession, subscribe } from '../services/authStorage'

/**
 * Compartilha a sessão de login com todo o app. A sessão mora no `authStorage`;
 * o provider só a espelha, então um 401 tratado no cliente HTTP também desloga a tela.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession)

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password)
    saveSession({ token: response.access_token, user: response.user })
  }, [])

  const logout = useCallback(() => clearSession(), [])

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, isAuthenticated: session !== null, login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
