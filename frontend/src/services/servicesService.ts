import type { ServiceDto } from '../types/api'
import { request, type RequestOptions } from './api'

/** GET /services */
export function getServices(options?: RequestOptions): Promise<ServiceDto[]> {
  return request<ServiceDto[]>('/services', options)
}

/** GET /services/:id */
export function getServiceById(serviceId: string, options?: RequestOptions): Promise<ServiceDto> {
  return request<ServiceDto>(`/services/${encodeURIComponent(serviceId)}`, options)
}
