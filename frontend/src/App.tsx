import { useCallback, useRef, useState } from 'react'
import {GloboScene} from './components/scenes/GloboScene'
import { Sidebar } from './components/layouts/Sidebar'
import { menuItems } from './components/layouts/menuItems'
import { REGIONS } from './data/regions'
import { RegionPanel } from './components/panels/RegionPanel'
import { Connector } from './components/panels/Connector'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(menuItems[0].id)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null)
  const panelRef = useRef<HTMLElement>(null)

  const selectedRegion = REGIONS.find((region) => region.code === selectedRegionCode) ?? null

  // fecha se clicar no marcador q ta selecionado
  const selectRegion = useCallback((code: string) => {
    setSelectedRegionCode((current) => (current === code ? null : code))
  }, [])

  const closeRegion = useCallback(() => setSelectedRegionCode(null), [])

  const toggleMenu = useCallback(() => setIsMenuOpen((open) => !open), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  const selectItem = useCallback((Id: string) => {
    setActiveItem(Id)
    setIsMenuOpen(false)
  }, [])

  return (
    <>
            <GloboScene
        regions={REGIONS}
        selectedCode={selectedRegionCode}
        onSelectRegion={selectRegion}
      />

      {selectedRegion && (
        <RegionPanel
          key={selectedRegion.code}
          region={selectedRegion}
          onClose={closeRegion}
          panelRef={panelRef}
        />
      )}
      <Connector regionCode={selectedRegionCode} panelRef={panelRef} />
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