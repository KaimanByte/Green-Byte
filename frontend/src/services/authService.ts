import type { LoginResponseDto } from '../types/api'
import { request, type RequestOptions } from './api'

/**
 * POST /auth/login
 * Erros: 400 (corpo inválido, com as mensagens do DTO em `ApiError.details`) e 401 (e-mail ou senha errados).
 */
export function login(email: string, password: string, options?: RequestOptions): Promise<LoginResponseDto> {
  return request<LoginResponseDto>('/auth/login', { ...options, method: 'POST', body: { email, password } })
}
