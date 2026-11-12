import { useEffect, useState } from 'react'
import { Pet } from '../components/Pet'
import type { MeuPet } from '../lib/pets'
import { buscarMemorias } from './memorias'
import { ESPACOS, desbloqueados, itensDo, type Espaco, type Visual as V } from './visual'

// Aba Visual: experimente os itens no pet antes de usar. Itens bloqueados mostram como se desbloqueiam.
export function AbaVisual({ pet, onVestir }: { pet: MeuPet; onVestir: (v: V) => Promise<void> }) {
  const atual: V = { chapeu: pet.chapeu, acessorio: pet.acessorio, efeito: pet.efeito }
  const [previa, setPrevia] = useState<V>(atual)
  const [liberados, setLiberados] = useState<Set<string> | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarMemorias()
      .then((m) => setLiberados(desbloqueados((m ?? []).map((x) => x.chave))))
      .catch(() => setLiberados(new Set()))
  }, [])

  const mudou = ESPACOS.some((e) => previa[e.id] !== atual[e.id])
  const escolher = (espaco: Espaco, id: string | null) => setPrevia((p) => ({ ...p, [espaco]: p[espaco] === id ? null : id }))

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      await onVestir(previa)
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col items-center rounded-3xl bg-surface py-4">
        <Pet especie={pet.especie} estagio={pet.estagio} caminho={pet.caminho} visual={previa} expressao="feliz" size={150} />
        <div className="mt-2 flex gap-2">
          <button
            onClick={salvar}
            disabled={!mudou || salvando}
            className="rounded-2xl bg-brand px-5 py-2 text-sm font-bold text-bg disabled:opacity-40"
          >
            {salvando ? 'Salvando…' : mudou ? 'Usar este visual' : 'É o visual atual'}
          </button>
          {mudou && (
            <button onClick={() => setPrevia(atual)} className="rounded-2xl px-3 py-2 text-sm font-bold text-muted">
              Desfazer
            </button>
          )}
        </div>
        {erro && <p className="mt-2 text-sm text-red-300">{erro}</p>}
      </div>

      {!liberados ? (
        <p className="text-center text-sm text-muted">Abrindo o armário…</p>
      ) : (
        ESPACOS.map((e) => (
          <div key={e.id}>
            <h3 className="mb-2 text-sm font-bold text-muted">{e.nome}</h3>
            <div className="grid grid-cols-4 gap-2">
              {itensDo(e.id).map((item) => {
                const livre = liberados.has(item.id)
                const usando = previa[e.id] === item.id
                return (
                  <button
                    key={item.id}
                    onClick={livre ? () => escolher(e.id, item.id) : undefined}
                    disabled={!livre}
                    aria-pressed={usando}
                    aria-label={livre ? item.nome : `${item.nome}, bloqueado: ${item.dica}`}
                    className={`flex flex-col items-center rounded-2xl border px-1 py-2 transition-colors ${
                      usando ? 'border-brand bg-brand/15' : livre ? 'border-line bg-surface hover:bg-surface-2' : 'border-dashed border-line'
                    }`}
                  >
                    <span className={livre ? '' : 'opacity-40 grayscale'}>
                      <Pet especie={pet.especie} estagio={pet.estagio} caminho={pet.caminho} visual={{ [e.id]: item.id }} parado size={52} />
                    </span>
                    <span className={`mt-1 text-center text-[11px] font-semibold leading-tight ${livre ? '' : 'text-muted'}`}>
                      {livre ? item.nome : `🔒 ${item.dica}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}
      <p className="text-center text-xs text-muted">Os itens chegam com as memórias do diário. Nada aqui se compra.</p>
    </section>
  )
}
