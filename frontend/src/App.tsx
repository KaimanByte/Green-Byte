import { useCallback, useState } from 'react'
import {GloboScene} from './components/scenes/GloboScene'
import { Sidebar } from './components/layouts/Sidebar'
import { menuItems } from './components/layouts/menuItems'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(menuItems[0].id)

  const toggleMenu = useCallback(() => setIsMenuOpen((open) => !open), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  const selectItem = useCallback((Id: string) => {
    setActiveItem(Id)
    setIsMenuOpen(false)
  }, [])

  return (
    <>
      <GloboScene />
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