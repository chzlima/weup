import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'
import './lib/instalar' // começa a escutar o aviso de "pode instalar" logo na abertura
import './lib/atalhos' // lê "Nova tarefa", "Iniciar foco" ou algo compartilhado antes de o endereço mudar
import { escutarErros } from './lib/erros'
import { AvisoAtualizacao } from './components/AvisoAtualizacao'
import { TelaDeErro } from './components/TelaDeErro'
import { Galeria } from './pets/Galeria'

escutarErros() // registra os erros que acontecerem no aparelho, para dar para consertar

// Só em desenvolvimento: ?galeria mostra todas as artes dos pets.
const galeria = import.meta.env.DEV && new URLSearchParams(window.location.search).has('galeria')

createRoot(document.getElementById('root')!).render(
  galeria ? <Galeria /> : (
  <StrictMode>
    <TelaDeErro>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TelaDeErro>
    {/* Fora do login: até na tela de entrar o app avisa que há versão nova. */}
    <AvisoAtualizacao />
  </StrictMode>
  ),
)
