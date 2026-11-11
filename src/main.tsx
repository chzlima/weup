import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import './lib/instalar' // começa a escutar o aviso de "pode instalar" logo na abertura
import { escutarErros } from './lib/erros'
import { AvisoAtualizacao } from './components/AvisoAtualizacao'
import { TelaDeErro } from './components/TelaDeErro'

escutarErros() // registra os erros que acontecerem no aparelho, para dar para consertar

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TelaDeErro>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TelaDeErro>
    {/* Fora do login: até na tela de entrar o app avisa que há versão nova. */}
    <AvisoAtualizacao />
  </StrictMode>,
)
