import { useState } from 'react'
import { Pet } from '../components/Pet'
import type { MeuPet } from '../lib/pets'
import { CAMINHOS, FORMAS, caminho as dadosDoCaminho, type Caminho } from './caminhos'

// Cena da escolha do caminho (estágio 4). Mostra as três formas possíveis, marca a que combina com a pessoa
// (o atributo em que ela mais evoluiu) e pede confirmação: a escolha é uma vez só.
export function EscolherCaminho(props: {
  pet: MeuPet
  sugerido: Caminho
  onEscolher: (c: Caminho) => Promise<void>
  onFechar: () => void
}) {
  const { pet } = props
  const [escolhido, setEscolhido] = useState<Caminho>(props.sugerido)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const confirmar = async () => {
    setEnviando(true)
    setErro('')
    try {
      await props.onEscolher(escolhido)
      props.onFechar()
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.')
      setEnviando(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Escolher caminho" className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="mx-auto max-w-md space-y-5 px-4 py-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Um novo caminho</p>
          <h1 className="mt-1 text-2xl font-extrabold">Para onde {pet.nome} vai crescer?</h1>
          <p className="mt-1 text-sm text-muted">
            Cada caminho tem a sua forma, e a lendária segue o mesmo caminho. A escolha é uma vez só.
          </p>
        </header>

        <div className="space-y-3">
          {CAMINHOS.map((c) => {
            const on = c.id === escolhido
            return (
              <button
                key={c.id}
                onClick={() => setEscolhido(c.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-colors ${
                  on ? 'bg-surface-2' : 'border-line bg-surface hover:bg-surface-2'
                }`}
                style={on ? { borderColor: c.cor } : undefined}
              >
                <Pet especie={pet.especie} estagio={pet.estagio} caminho={c.id} expressao={on ? 'animado' : 'curioso'} parado={!on} size={88} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">{FORMAS[pet.especie][c.id][pet.estagio - 4]}</span>
                    {c.id === props.sugerido && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-bg" style={{ background: c.cor }}>
                        Combina com você
                      </span>
                    )}
                  </span>
                  <span className="block text-xs font-semibold" style={{ color: c.cor }}>
                    Caminho {c.nome.toLowerCase()} · lendária: {FORMAS[pet.especie][c.id][1]}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{c.ideia}</span>
                </span>
              </button>
            )
          })}
        </div>

        {erro && <p className="text-center text-sm text-red-300">{erro}</p>}

        <div className="space-y-2">
          <button
            onClick={confirmar}
            disabled={enviando}
            className="w-full rounded-2xl py-3 font-bold text-bg disabled:opacity-60"
            style={{ background: dadosDoCaminho(escolhido).cor }}
          >
            {enviando ? 'Seguindo…' : `Seguir o caminho ${dadosDoCaminho(escolhido).nome.toLowerCase()}`}
          </button>
          <button onClick={props.onFechar} className="w-full rounded-2xl py-2.5 text-sm font-bold text-muted hover:text-ink">
            Decidir depois
          </button>
        </div>
      </div>
    </div>
  )
}
