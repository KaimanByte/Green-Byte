import { createContext } from 'react'
import type { UserDto } from '../types/api'

export type AuthContextValue = {
  /** Usuário logado, ou `null`. */
  user: UserDto | null
  isAuthenticated: boolean
  /** Faz login na API e guarda a sessão. Rejeita com `ApiError` (400, 401 ou falha de rede). */
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
