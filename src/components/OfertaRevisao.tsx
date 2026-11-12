import { useEffect, useState } from 'react'
import type { Dados } from '../lib/useDados'

// "Revisar depois?": aparece logo depois de concluir uma tarefa de estudo.
// Um toque agenda as revisões; "Agora não" some sem deixar nada para trás.
export function OfertaRevisao({ dados }: { dados: Dados }) {
  const t = dados.ofertaRevisao
  const [agendado, setAgendado] = useState(false)

  // Depois de agendar, mostra a confirmação por alguns segundos e some.
  useEffect(() => {
    if (!agendado) return
    const id = setTimeout(() => setAgendado(false), 3500)
    return () => clearTimeout(id)
  }, [agendado])

  if (!t && !agendado) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 z-30 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-brand/40 bg-surface px-4 py-3 shadow-lg"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      {agendado ? (
        <p className="flex-1 text-sm font-semibold text-mint">Revisões agendadas: amanhã, em 7 e em 30 dias. 🌱</p>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Revisar depois?</p>
            <p className="text-xs text-muted">Três revisões rápidas: amanhã, em 7 e em 30 dias. Ajuda a não esquecer.</p>
          </div>
          <button
            onClick={dados.dispensarRevisao}
            className="rounded-xl px-2 py-2 text-xs font-semibold text-muted hover:text-ink"
          >
            Agora não
          </button>
          <button
            onClick={async () => {
              if (await dados.agendarRevisoes()) setAgendado(true)
            }}
            className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-bg"
          >
            Agendar
          </button>
        </>
      )}
    </div>
  )
}
