import { LayoutDashboard, Server, Settings, type LucideIcon } from 'lucide-react'

export type MenuItem = {
    id: string
    label: string
    /** ícone opcional; sem ele o item mostra o ponto */
    icon?: LucideIcon
}

// abre um painel ao lado do menu (o menu fica aberto)
export const DASHBOARD_ID = 'dashboard'
export const SERVICES_ID = 'services'
export const ADMIN_ID = 'admin'

/** Itens que abrem um painel ao lado do menu, ligado ao item por uma linha. */
export const PANEL_IDS: string[] = [DASHBOARD_ID, SERVICES_ID, ADMIN_ID]

export const menuItems: MenuItem[] = [
    { id: DASHBOARD_ID, label: 'Dashboard', icon: LayoutDashboard },
    { id: SERVICES_ID, label: 'Serviços', icon: Server },
]

/** Itens da área administrativa: só entram no menu com alguém logado. */
export const adminMenuItems: MenuItem[] = [
    { id: ADMIN_ID, label: 'Administração', icon: Settings },
]

export const LOGIN_ID = 'login'
