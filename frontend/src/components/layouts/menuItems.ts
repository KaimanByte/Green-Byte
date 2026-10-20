export type MenuItem = {
    id: string
    label: string
}

// abre um painel ao lado do menu (o menu fica aberto)
export const DASHBOARD_ID = 'dashboard'

export const menuItems: MenuItem[] = [
    { id: DASHBOARD_ID, label: 'Dashboard' },
]
