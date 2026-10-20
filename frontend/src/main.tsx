import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/glass.css'
import './styles/liquid.css'
import './index.css'
import App from './App.tsx'
import { GreenDataProvider } from './providers/GreenDataProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GreenDataProvider>
      <App />
    </GreenDataProvider>
  </StrictMode>)
