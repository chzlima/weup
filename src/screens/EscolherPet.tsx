import { useState, type FormEvent } from 'react'
import { Pet } from '../components/Pet'
import { ESPECIES, type Especie, type MeuPet } from '../lib/pets'
import { Rotulo } from '../components/Sheet'

// Escolha do companheiro: aparece uma vez, logo depois do primeiro login (e quando a pessoa quer trocar).
export function EscolherPet(props: {
  atual?: MeuPet | null
  onEscolher: (especie: Especie, nome: string) => Promise<void>
  onCancelar?: () => void
}) {
  const [esp, setEsp] = useState<Especie>(props.atual?.especie ?? 'broto')
  const nomePadrao = (e: Especie) => ESPECIES.find((x) => x.id === e)!.nome
  const [nome, setNome] = useState(props.atual?.nome ?? nomePadrao('broto'))
  const [nomeEditado, setNomeEditado] = useState(!!props.atual)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const escolherEspecie = (e: Especie) => {
    setEsp(e)
    if (!nomeEditado) setNome(nomePadrao(e))
  }

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!nome.trim()) return setErro('Dê um nome para o seu companheiro.')
    setSalvando(true)
    try {
      await props.onEscolher(esp, nome.trim())
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold">{props.atual ? 'Trocar companheiro' : 'Escolha seu companheiro'}</h1>
        <p className="mt-1 text-sm text-muted">
          Ele cresce junto com você e evolui nos níveis 5 e 10. Nunca morre e nunca regride.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Espécie">
        {ESPECIES.map((e) => {
          const on = e.id === esp
          return (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => escolherEspecie(e.id)}
              className={`flex flex-col items-center rounded-3xl border p-3 transition-colors ${
                on ? 'border-brand bg-brand/10' : 'border-line bg-surface hover:bg-surface-2'
              }`}
            >
              <Pet especie={e.id} estagio={1} feliz={on} size={72} />
              <span className="mt-1 font-bold">{e.nome}</span>
            </button>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted">{ESPECIES.find((e) => e.id === esp)!.descricao}</p>

      <form onSubmit={enviar} className="space-y-3 rounded-3xl border border-line bg-surface p-5">
        <label className="block">
          <Rotulo>Nome do companheiro</Rotulo>
          <input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              setNomeEditado(true)
            }}
            maxLength={30}
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        {erro && <p className="text-sm text-red-300">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="w-full rounded-2xl bg-brand py-3 font-bold text-bg disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : props.atual ? 'Salvar' : 'Começar a jornada'}
        </button>
        {props.onCancelar && (
          <button type="button" onClick={props.onCancelar} className="w-full py-1 text-sm font-semibold text-muted">
            Cancelar
          </button>
        )}
      </form>
    </div>
  )
}
