import { useCallback, useEffect, useRef, useState } from 'react'
import { GloboScene, type FocusRequest } from './components/scenes/GloboScene'
import { Sidebar } from './components/layouts/Sidebar'
import { Logo } from './components/layouts/Logo'
import { SearchBar } from './components/layouts/SearchBar'
import { CollectionDate } from './components/layouts/CollectionDate'
import { LOGIN_ID, PANEL_IDS, SERVICES_ID, menuItems } from './components/layouts/menuItems'
import { LoginPanel } from './components/panels/LoginPanel'
import { useGlobeRegions } from './hooks/useGlobeRegions'
import { useAuth } from './hooks/useAuth'
import { RegionPanel } from './components/panels/RegionPanel'
import { Connector } from './components/panels/Connector'
import { DashboardPanel } from './components/panels/DashboardPanel'
import { ServicesPanel } from './components/panels/ServicesPanel'
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

  // usuário logado aparece no menu, no lugar do botão LOGIN
  const { user } = useAuth()

  // regiões reais do backend (GET /regions + GET /services)
  const regions = useGlobeRegions()

  // o tempo da logo só começa a contar quando a cena já está desenhada
  const [isSceneReady, setIsSceneReady] = useState(false)
  const markSceneReady = useCallback(() => setIsSceneReady(true), [])


  // logo na tela por alguns segundos, depois começa o zoom até a Terra
  useEffect(() => {
    if (introPhase !== 'hold' || !isSceneReady) return
    const timer = window.setTimeout(() => setIntroPhase('zoom'), INTRO_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [introPhase, isSceneReady])

  // pular: um clique só leva direto pro globo (na logo ou no meio do zoom)
  const skipIntro = useCallback(() => setIntroPhase('done'), [])

  const finishIntro = useCallback(() => setIntroPhase('done'), [])



  // dashboard/serviços aparecem ao lado do menu, ligados ao item por uma linha
  const showLogin = isMenuOpen && isLoginOpen
  const openPanelId = isMenuOpen && !isLoginOpen && PANEL_IDS.includes(activeItem) ? activeItem : null

  // trocar de painel com outro já aberto: o novo entra na hora, sem esperar a linha
  // se desenhar de novo (padrão do React pra lembrar o valor do render anterior)
  const [lastPanelId, setLastPanelId] = useState<string | null>(openPanelId)
  const [isPanelSwap, setIsPanelSwap] = useState(false)
  if (openPanelId !== lastPanelId) {
    setIsPanelSwap(lastPanelId !== null && openPanelId !== null)
    setLastPanelId(openPanelId)
  }

  const selectedRegion = regions.find((region) => region.code === selectedRegionCode) ?? null

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
  // login abre ao lado do menu, no lugar do painel aberto
  if (id === LOGIN_ID) {
    setIsLoginOpen(true)
    return
  }
  setIsLoginOpen(false)
  setActiveItem(id)
  // os painéis abrem ao lado do menu, então o menu continua aberto
  setIsMenuOpen(PANEL_IDS.includes(id))
}, [])

  const scene = (
    <GloboScene
      regions={regions}
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
        <SearchBar regions={regions} onSelect={searchRegion} />
        <CollectionDate isHidden={selectedRegion !== null} />

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

        <div className={isPanelSwap ? 'panel-swap' : undefined} style={{ display: 'contents' }}>
          {openPanelId === SERVICES_ID ? (
            <ServicesPanel key={openPanelId} onClose={closeMenu} panelRef={dashboardRef} />
          ) : openPanelId ? (
            <DashboardPanel key={openPanelId} onClose={closeMenu} panelRef={dashboardRef} />
          ) : null}
        </div>
        <Connector
          anchorSelector={openPanelId ? `[data-menu-item="${openPanelId}"]` : null}
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
          userEmail={user?.email ?? null}
        />
      </div>
    </>
  )
}

export default App
