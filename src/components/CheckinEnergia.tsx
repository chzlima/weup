import { useState } from 'react'
import { ENERGIAS, type Energia } from '../lib/energia'

// "Como está sua energia hoje?": um toque, opcional. Depois de responder vira uma linha curta com "Mudar".
export function CheckinEnergia({ energia, onEscolher }: { energia: Energia | null; onEscolher: (e: Energia) => void }) {
  const [mudando, setMudando] = useState(false)
  const atual = ENERGIAS.find((e) => e.id === energia)

  if (atual && !mudando) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5">
        <span aria-hidden className="text-xl">
          {atual.emoji}
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-bold">{atual.modo}</span>
          <span className="text-muted"> · {atual.dica}</span>
        </p>
        <button onClick={() => setMudando(true)} className="text-xs font-bold text-mint">
          Mudar
        </button>
      </div>
    )
  }

  return (
    <section aria-label="Check-in de energia" className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-bold">Como está sua energia hoje?</p>
      <p className="mb-3 text-xs text-muted">Opcional. Ajusta a lista de hoje; não vale XP e dá para mudar quando quiser.</p>
      <div className="flex gap-2">
        {ENERGIAS.map((e) => {
          const on = energia === e.id
          return (
            <button
              key={e.id}
              onClick={() => {
                onEscolher(e.id)
                setMudando(false)
              }}
              aria-pressed={on}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors ${
                on ? 'border-brand bg-brand/15 text-mint' : 'border-line text-muted hover:text-ink'
              }`}
            >
              <span aria-hidden className="text-xl">
                {e.emoji}
              </span>
              {e.nome}
            </button>
          )
        })}
      </div>
    </section>
  )
}
