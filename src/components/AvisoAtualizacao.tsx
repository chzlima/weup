import { useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UMA_HORA = 60 * 60 * 1000
const TEMPO_MAXIMO_ESPERA = 4000

// "Atualização disponível": aparece quando uma versão nova do app foi publicada.
// A pessoa escolhe a hora de atualizar (assim nada que esteja digitando se perde).
// Se tocar em "Depois", a versão nova entra sozinha na próxima vez que o app for fechado e aberto.
export function AvisoAtualizacao() {
  const registro = useRef<ServiceWorkerRegistration | undefined>(undefined)
  const [atualizando, setAtualizando] = useState(false)

  const {
    needRefresh: [temVersaoNova, setTemVersaoNova],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, r) {
      registro.current = r
      if (!r) return
      // Procura versão nova quando o app volta para a tela e, com ele aberto, a cada hora.
      const procurar = () => {
        if (navigator.onLine) r.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') procurar()
      })
      setInterval(procurar, UMA_HORA)
    },
  })

  // O app recarrega por conta própria. Antes dependia de um aviso da biblioteca que não chega quando a
  // versão nova foi achada pela busca "ao voltar para o app": a versão nova assumia, mas a tela não recarregava.
  const atualizar = async () => {
    setAtualizando(true)
    let recarregou = false
    const recarregar = () => {
      if (recarregou) return
      recarregou = true
      window.location.reload()
    }
    // 1) Quando a versão nova assumir o controle, recarrega.
    navigator.serviceWorker?.addEventListener('controllerchange', recarregar)
    // 2) Manda a versão que está esperando assumir agora.
    const esperando = registro.current?.waiting
    if (esperando) esperando.postMessage({ type: 'SKIP_WAITING' })
    else await updateServiceWorker(true).catch(() => {})
    // 3) Garantia: se nada acontecer em alguns segundos, recarrega mesmo assim.
    setTimeout(recarregar, TEMPO_MAXIMO_ESPERA)
  }

  if (!temVersaoNova) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-brand/40 bg-surface px-4 py-3 shadow-lg"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Atualização disponível</p>
        <p className="text-xs text-muted">
          {atualizando ? 'Atualizando…' : 'Uma versão nova do WeUp! está pronta.'}
        </p>
      </div>
      {!atualizando && (
        <button
          onClick={() => setTemVersaoNova(false)}
          className="rounded-xl px-2 py-2 text-xs font-semibold text-muted hover:text-ink"
        >
          Depois
        </button>
      )}
      <button
        onClick={atualizar}
        disabled={atualizando}
        className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-bg disabled:opacity-60"
      >
        {atualizando ? '…' : 'Atualizar'}
      </button>
    </div>
  )
}
