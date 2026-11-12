import { useState } from 'react'
import { Pet } from '../components/Pet'
import { ESPECIES, ESTAGIOS, type MeuPet } from '../lib/pets'
import { EXPRESSOES } from './arte'
import { CAMINHOS, FORMAS } from './caminhos'
import { EscolherCaminho } from './EscolherCaminho'
import { ITENS } from './visual'
import { Transformacao } from './Transformacao'

// Galeria só de desenvolvimento (npm run dev → http://localhost:5173/?galeria):
// todas as espécies, estágios, caminhos e expressões, e prévias das cenas. Não vai para o app publicado.
export function Galeria() {
  const [cena, setCena] = useState<null | 'caminho' | 'transformacao'>(null)
  const exemplo: MeuPet = { especie: 'gota', nome: 'Gota', estagio: 4, caminho: null, chapeu: null, acessorio: null, efeito: null }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold">Galeria dos pets</h1>
        <button onClick={() => setCena('caminho')} className="rounded-xl border border-line px-3 py-2 text-sm font-bold">
          Prévia: escolher caminho
        </button>
        <button onClick={() => setCena('transformacao')} className="rounded-xl border border-line px-3 py-2 text-sm font-bold">
          Prévia: transformação
        </button>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Itens do visual</h2>
        {ESPECIES.map((e) => (
          <div key={e.id} className="grid grid-cols-6 gap-2 lg:grid-cols-12">
            {ITENS.map((i) => (
              <figure key={i.id} className="flex flex-col items-center rounded-2xl bg-surface p-2">
                <Pet especie={e.id} estagio={e.id === 'faisca' ? 3 : 2} visual={{ [i.espaco]: i.id }} expressao="feliz" size={72} />
                <figcaption className="text-center text-[10px] text-muted">{i.nome}</figcaption>
              </figure>
            ))}
          </div>
        ))}
      </section>

      {ESPECIES.map((e) => (
        <section key={e.id} className="space-y-4">
          <h2 className="text-lg font-bold">{e.nome}</h2>
          <div className="grid grid-cols-5 gap-3">
            {ESTAGIOS.map((estagio) => (
              <figure key={estagio} className="flex flex-col items-center rounded-2xl bg-surface p-3">
                <Pet especie={e.id} estagio={estagio} expressao="feliz" size={120} />
                <figcaption className="mt-1 text-center text-xs text-muted">
                  {estagio} · {e.estagios[estagio - 1]}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-3">
            {CAMINHOS.flatMap((c) =>
              ([4, 5] as const).map((estagio) => (
                <figure key={`${c.id}-${estagio}`} className="flex flex-col items-center rounded-2xl bg-surface p-3">
                  <Pet especie={e.id} estagio={estagio} caminho={c.id} expressao="orgulhoso" size={96} />
                  <figcaption className="mt-1 text-center text-xs text-muted">{FORMAS[e.id][c.id][estagio - 4]}</figcaption>
                </figure>
              )),
            )}
          </div>
          <div className="grid grid-cols-6 gap-3">
            {EXPRESSOES.map((x) => (
              <figure key={x.id} className="flex flex-col items-center rounded-2xl bg-surface p-3">
                <Pet especie={e.id} estagio={3} expressao={x.id} size={96} />
                <figcaption className="mt-1 text-xs text-muted">{x.nome}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      {cena === 'caminho' && (
        <EscolherCaminho pet={exemplo} sugerido="saude" onEscolher={async () => {}} onFechar={() => setCena(null)} />
      )}
      {cena === 'transformacao' && (
        <Transformacao
          antes={{ ...exemplo, estagio: 3 }}
          depois={{ ...exemplo, caminho: 'conhecimento' }}
          onFechar={() => setCena(null)}
        />
      )}
    </div>
  )
}
