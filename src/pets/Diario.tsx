import { useEffect, useState } from 'react'
import { Pet } from '../components/Pet'
import type { Estagio, MeuPet } from '../lib/pets'
import { agruparPorMes, buscarMemorias, ordenarMemorias, textoDaMemoria, type Memoria } from './memorias'

// Aba Diário: as memórias da jornada, do mais recente para o mais antigo, agrupadas por mês.
export function Diario({ pet }: { pet: MeuPet }) {
  const [memorias, setMemorias] = useState<Memoria[] | null | undefined>(undefined)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarMemorias()
      .then(setMemorias)
      .catch((e) => setErro((e as Error).message))
  }, [])

  if (erro) return <p className="text-sm text-red-300">{erro}</p>
  if (memorias === undefined) return <p className="py-8 text-center text-sm text-muted">Abrindo o diário…</p>
  if (memorias === null) return <p className="py-8 text-center text-sm text-muted">O diário chega em breve.</p>
  if (memorias.length === 0)
    return (
      <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
        O diário de {pet.nome} ainda está em branco. As primeiras memórias aparecem com as primeiras coisas feitas.
      </p>
    )

  return (
    <div className="space-y-5">
      {agruparPorMes(ordenarMemorias(memorias)).map((g) => (
        <section key={g.mes}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{g.mes}</h3>
          <ol className="space-y-2">
            {g.itens.map((m) => {
              const t = textoDaMemoria(m, pet)
              const [a, mm, d] = m.dia.split('-').map(Number)
              return (
                <li key={m.chave} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                  {m.tipo === 'evolucao' ? (
                    <span className="shrink-0">
                      <Pet especie={pet.especie} estagio={(m.valor ?? 2) as Estagio} caminho={pet.caminho} parado size={40} />
                    </span>
                  ) : (
                    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl">
                      {t.emoji}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{t.titulo}</span>
                    <span className="block text-xs text-muted">{t.texto}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(a, mm - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
