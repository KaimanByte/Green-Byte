import { useCallback, useEffect, useRef, useState } from 'react'
import { GloboScene, type FocusRequest } from './components/scenes/GloboScene'
import { Sidebar } from './components/layouts/Sidebar'
import { Logo } from './components/layouts/Logo'
import { SearchBar } from './components/layouts/SearchBar'
import { CollectionDate } from './components/layouts/CollectionDate'
import { LAST_COLLECTION_AT } from './data/dashboard'
import { DASHBOARD_ID, LOGIN_ID, menuItems } from './components/layouts/menuItems'
import { LoginPanel } from './components/panels/LoginPanel'
import { REGIONS } from './data/regions'
import { RegionPanel } from './components/panels/RegionPanel'
import { Connector } from './components/panels/Connector'
import { DashboardPanel } from './components/panels/DashboardPanel'
import { IntroOverlay } from './components/layouts/IntroOverlay'
import { INTRO_HOLD_MS, type IntroPhase } from './lib/intro'


// quem pediu menos movimento no sistema não vê a intro
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(menuItems[0].id)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const dashboardRef = useRef<HTMLElement>(null)
  const [introPhase, setIntroPhase] = useState<IntroPhase>(() => (prefersReducedMotion() ? 'done' : 'hold'))
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const loginRef = useRef<HTMLElement>(null)


  // o tempo da logo só começa a contar quando a cena já está desenhada
  const [isSceneReady, setIsSceneReady] = useState(false)
  const markSceneReady = useCallback(() => setIsSceneReady(true), [])


  // logo na tela por alguns segundos, depois começa o zoom até a Terra
  useEffect(() => {
    if (introPhase !== 'hold' || !isSceneReady) return
    const timer = window.setTimeout(() => setIntroPhase('zoom'), INTRO_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [introPhase, isSceneReady])

  // pular: na logo começa o zoom; no meio do zoom vai direto pro globo
  const skipIntro = useCallback(() => {
    setIntroPhase((phase) => (phase === 'hold' ? 'zoom' : 'done'))
  }, [])

  const finishIntro = useCallback(() => setIntroPhase('done'), [])

  

  // dashboard aparece ao lado do menu, ligado ao item por uma linha
  const showLogin = isMenuOpen && isLoginOpen
  const isDashboardOpen = isMenuOpen && activeItem === DASHBOARD_ID && !isLoginOpen

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

  // fechar o menu sempre fecha o login junto
const toggleMenu = useCallback(() => {
  setIsMenuOpen((open) => !open)
  setIsLoginOpen(false)
}, [])
const closeMenu = useCallback(() => {
  setIsMenuOpen(false)
  setIsLoginOpen(false)
}, [])

const selectItem = useCallback((id: string) => {
  // login abre ao lado do menu, no lugar do dashboard
  if (id === LOGIN_ID) {
    setIsLoginOpen(true)
    return
  }
  setIsLoginOpen(false)
  setActiveItem(id)
  setIsMenuOpen(id === DASHBOARD_ID)
}, [])

  const scene = (
    <GloboScene
      regions={REGIONS}
      selectedCode={selectedRegionCode}
      onSelectRegion={selectRegion}
      focusRequest={focusRequest}
      introPhase={introPhase}
      onIntroReady={markSceneReady}
      onIntroDone={finishIntro}
    />
  )

  // durante a intro só aparece o espaço e a logo; o resto da interface entra no fim
  if (introPhase !== 'done') {
    return (
      <>
        {scene}
        <IntroOverlay phase={introPhase} onSkip={skipIntro} />
      </>
    )
  }

  return (
    <>
      {scene}
      <div className="ui-reveal">
        <Logo />
        <SearchBar regions={REGIONS} onSelect={searchRegion} />
        <CollectionDate date={LAST_COLLECTION_AT} isHidden={selectedRegion !== null} />

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

        {showLogin && <LoginPanel onClose={closeMenu} panelRef={loginRef} />}
        <Connector
          anchorSelector={showLogin ? `[data-menu-item="${LOGIN_ID}"]` : null}
          panelRef={loginRef}
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
      </div>
    </>
  )
}

export default App