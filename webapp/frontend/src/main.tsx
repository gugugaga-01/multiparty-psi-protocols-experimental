import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'animal-island-ui/style'
import './index.css'
import './styles/tokens.css'
import './styles/modern.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
