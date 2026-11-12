import { Pet } from '../components/Pet'
import { ESPECIES, ESTAGIOS } from '../lib/pets'
import { EXPRESSOES } from './arte'

// Galeria só de desenvolvimento (npm run dev → http://localhost:5173/?galeria):
// todas as espécies, estágios e expressões lado a lado, para conferir a arte. Não vai para o app publicado.
export function Galeria() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <h1 className="text-2xl font-extrabold">Galeria dos pets</h1>
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
            {EXPRESSOES.map((x) => (
              <figure key={x.id} className="flex flex-col items-center rounded-2xl bg-surface p-3">
                <Pet especie={e.id} estagio={3} expressao={x.id} size={96} />
                <figcaption className="mt-1 text-xs text-muted">{x.nome}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
