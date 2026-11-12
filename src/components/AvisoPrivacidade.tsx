import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { deveAvisarPolitica, marcarPoliticaVista, versaoVistaDaPolitica } from '../lib/privacidade'
import { Privacidade } from '../screens/Privacidade'

// "Atualizamos a política de privacidade": aparece uma vez para quem já tinha conta quando o texto mudou.
export function AvisoPrivacidade() {
  const { user } = useAuth()
  const [mostrar, setMostrar] = useState(() => deveAvisarPolitica(user?.created_at, versaoVistaDaPolitica()))
  const [lendo, setLendo] = useState(false)

  const fechar = () => {
    marcarPoliticaVista()
    setMostrar(false)
  }

  if (lendo)
    return (
      <Privacidade
        onFechar={() => {
          setLendo(false)
          fechar()
        }}
      />
    )
  if (!mostrar) return null

  return (
    <div role="status" className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Atualizamos a política de privacidade</p>
        <p className="text-xs text-muted">Veja o que mudou em como cuidamos dos seus dados.</p>
      </div>
      <button onClick={fechar} className="rounded-xl px-2 py-2 text-xs font-semibold text-muted hover:text-ink">
        Ok
      </button>
      <button onClick={() => setLendo(true)} className="rounded-xl bg-surface-2 px-3 py-2 text-sm font-bold text-ink">
        Ver
      </button>
    </div>
  )
}
