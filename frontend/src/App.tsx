import { useCallback, useRef, useState } from 'react'
import { GloboScene, type FocusRequest } from './components/scenes/GloboScene'
import { Sidebar } from './components/layouts/Sidebar'
import { Logo } from './components/layouts/Logo'
import { SearchBar } from './components/layouts/SearchBar'
import { CollectionDate } from './components/layouts/CollectionDate'
import { LAST_COLLECTION_AT } from './data/dashboard'
import { DASHBOARD_ID, menuItems } from './components/layouts/menuItems'
import { REGIONS } from './data/regions'
import { RegionPanel } from './components/panels/RegionPanel'
import { Connector } from './components/panels/Connector'
import { DashboardPanel } from './components/panels/DashboardPanel'
import { ServiceListPanel } from './components/panels/ServiceListPanel'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(menuItems[0].id)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const dashboardRef = useRef<HTMLElement>(null)

  // dashboard aparece ao lado do menu, ligado ao item por uma linha
  const isDashboardOpen = isMenuOpen && activeItem === DASHBOARD_ID

  const selectedRegion = REGIONS.find((region) => region.code === selectedRegionCode) ?? null

  // fecha se clicar no marcador q ta selecionado
  // clicar no marcador: abre o painel e dá zoom na região
  // (clicar de novo no mesmo fecha e o zoom volta)
  const selectRegion = useCallback(
    (code: string) => {
      if (selectedRegionCode === code) {
        setSelectedRegionCode(null)
        return
      }
      setSelectedRegionCode(code)
      setFocusRequest({ code, id: Date.now() })
    },
    [selectedRegionCode],
  )

  const closeRegion = useCallback(() => setSelectedRegionCode(null), [])

  // escolhido na busca: abre o painel, gira o globo até o datacenter e dá zoom
  const searchRegion = useCallback((code: string) => {
    setSelectedRegionCode(code)
    setFocusRequest({ code, id: Date.now() })
  }, [])

  const toggleMenu = useCallback(() => setIsMenuOpen((open) => !open), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  const selectItem = useCallback((Id: string) => {
    setActiveItem(Id)
    // o dashboard abre ao lado do menu, então o menu continua aberto
    setIsMenuOpen(Id === DASHBOARD_ID)
  }, [])

  return (
    <>
            <GloboScene
        regions={REGIONS}
        selectedCode={selectedRegionCode}
        onSelectRegion={selectRegion}
        focusRequest={focusRequest}
      />

      <Logo />
      <SearchBar regions={REGIONS} onSelect={searchRegion} />
      <CollectionDate date={LAST_COLLECTION_AT} isHidden={selectedRegion !== null} />
      <ServiceListPanel />

      {selectedRegion && (
        <RegionPanel
          key={selectedRegion.code}
          region={selectedRegion}
          onClose={closeRegion}
          panelRef={panelRef}
        />
      )}
      <Connector
        anchorSelector={selectedRegionCode ? `[data-region="${selectedRegionCode}"]` : null}
        panelRef={panelRef}
      />

      {isDashboardOpen && <DashboardPanel onClose={closeMenu} panelRef={dashboardRef} />}
      <Connector
        anchorSelector={isDashboardOpen ? `[data-menu-item="${DASHBOARD_ID}"]` : null}
        panelRef={dashboardRef}
        overlay
      />
      <Sidebar
        isOpen={isMenuOpen}
        onToggle={toggleMenu}
        onClose={closeMenu}
        items={menuItems}
        activeId={activeItem}
        onSelect={selectItem}
      />
    </>
  )
}

export default App