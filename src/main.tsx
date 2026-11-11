import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import './lib/instalar' // começa a escutar o aviso de "pode instalar" logo na abertura
import { AvisoAtualizacao } from './components/AvisoAtualizacao'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    {/* Fora do login: até na tela de entrar o app avisa que há versão nova. */}
    <AvisoAtualizacao />
  </StrictMode>,
)
