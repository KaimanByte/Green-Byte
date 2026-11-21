// Rotas da área administrativa. Todas exigem login (`auth: true`); o backend
// ainda confere o papel do usuário e responde 403 quando ele não permite a ação.

import type {
  AuditLogDto,
  CollectionStatusDto,
  SettingsDto,
  SettingsValues,
  UserDto,
  UserRole,
} from '../types/api'
import { request, type RequestOptions } from './api'

/** GET /settings */
export function getSettings(options?: RequestOptions): Promise<SettingsDto> {
  return request<SettingsDto>('/settings', { ...options, auth: true })
}

/** PATCH /settings — só os campos enviados mudam (papéis: admin, operator). */
export function updateSettings(changes: Partial<SettingsValues>, options?: RequestOptions): Promise<SettingsDto> {
  return request<SettingsDto>('/settings', { ...options, auth: true, method: 'PATCH', body: changes })
}

/** GET /monitoring/collection-status */
export function getCollectionStatus(options?: RequestOptions): Promise<CollectionStatusDto> {
  return request<CollectionStatusDto>('/monitoring/collection-status', { ...options, auth: true })
}

/** GET /users (papel: admin) */
export function getUsers(options?: RequestOptions): Promise<UserDto[]> {
  return request<UserDto[]>('/users', { ...options, auth: true })
}

export type CreateUserInput = { email: string; password: string; role: UserRole }

/** POST /users (papel: admin). O backend chama o campo da senha em texto puro de `hashPassword`. */
export function createUser({ email, password, role }: CreateUserInput, options?: RequestOptions): Promise<UserDto> {
  return request<UserDto>('/users', { ...options, auth: true, method: 'POST', body: { email, hashPassword: password, role } })
}

export type UpdateUserInput = { role?: UserRole; active?: boolean; password?: string }

/** PATCH /users/:id (papel: admin) */
export function updateUser(id: number, { password, ...rest }: UpdateUserInput, options?: RequestOptions): Promise<UserDto> {
  const body = password === undefined ? rest : { ...rest, hashPassword: password }
  return request<UserDto>(`/users/${id}`, { ...options, auth: true, method: 'PATCH', body })
}

/** DELETE /users/:id (papel: admin) */
export function deleteUser(id: number, options?: RequestOptions): Promise<UserDto> {
  return request<UserDto>(`/users/${id}`, { ...options, auth: true, method: 'DELETE' })
}

/** GET /audit-logs?limit= (papéis: admin, operator) */
export function getAuditLogs(limit = 50, options?: RequestOptions): Promise<AuditLogDto[]> {
  return request<AuditLogDto[]>('/audit-logs', { ...options, auth: true, query: { limit } })
}
