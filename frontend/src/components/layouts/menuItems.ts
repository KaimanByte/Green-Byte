export type MenuItem = {
    id: string
    label: string
}

// abre um painel ao lado do menu (o menu fica aberto)
export const DASHBOARD_ID = 'dashboard'

export const menuItems: MenuItem[] = [
    { id: 'LoremIpsum1', label: 'Lorem Ipsum 1' },
    { id: DASHBOARD_ID, label: 'Dashboard' },
    { id: 'LoremIpsum3', label: 'Lorem Ipsum 3' },
    { id: 'LoremIpsum4', label: 'Lorem Ipsum 4' },
    { id: 'LoremIpsum5', label: 'Lorem Ipsum 5' },
]
