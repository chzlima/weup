import { useRegisterSW } from 'virtual:pwa-register/react'

const UMA_HORA = 60 * 60 * 1000

// "Atualização disponível": aparece quando uma versão nova do app foi publicada.
// A pessoa escolhe a hora de atualizar (assim nada que esteja digitando se perde).
// Se tocar em "Depois", a versão nova entra sozinha na próxima vez que o app for fechado e aberto.
export function AvisoAtualizacao() {
  const {
    needRefresh: [temVersaoNova, setTemVersaoNova],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      // Procura versão nova quando o app volta para a tela e, com ele aberto, a cada hora.
      const procurar = () => {
        if (navigator.onLine) registro.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') procurar()
      })
      setInterval(procurar, UMA_HORA)
    },
  })

  if (!temVersaoNova) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-brand/40 bg-surface px-4 py-3 shadow-lg"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Atualização disponível</p>
        <p className="text-xs text-muted">Uma versão nova do WeUp! está pronta.</p>
      </div>
      <button
        onClick={() => setTemVersaoNova(false)}
        className="rounded-xl px-2 py-2 text-xs font-semibold text-muted hover:text-ink"
      >
        Depois
      </button>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-bg"
      >
        Atualizar
      </button>
    </div>
  )
}
