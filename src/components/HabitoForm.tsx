import { useState, type FormEvent } from 'react'
import { Opcoes, Rotulo, Sheet } from './Sheet'
import { CATEGORIAS, type Categoria } from '../lib/tarefas'
import { DIAS_SEMANA, TODOS_OS_DIAS, XP_HABITO, type DadosHabito, type Habito } from '../lib/habitos'

export function HabitoForm(props: {
  habito?: Habito
  onSalvar: (dados: DadosHabito) => void
  onExcluir?: () => void
  onFechar: () => void
}) {
  const [titulo, setTitulo] = useState(props.habito?.titulo ?? '')
  const [categoria, setCategoria] = useState<Categoria>(props.habito?.categoria ?? 'rotina')
  const [dias, setDias] = useState<number[]>(props.habito?.dias ?? TODOS_OS_DIAS)
  const [erro, setErro] = useState('')

  const alternarDia = (i: number) =>
    setDias((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return setErro('Dê um nome para o hábito.')
    if (dias.length === 0) return setErro('Escolha pelo menos um dia da semana.')
    props.onSalvar({ titulo: titulo.trim(), categoria, dias })
    props.onFechar()
  }

  return (
    <Sheet titulo={props.habito ? 'Editar hábito' : 'Novo hábito'} onFechar={props.onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>Qual hábito?</Rotulo>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Ler 20 minutos"
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <div>
          <Rotulo>Em quais dias?</Rotulo>
          <div className="flex justify-between gap-1.5">
            {DIAS_SEMANA.map((letra, i) => {
              const on = dias.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => alternarDia(i)}
                  aria-pressed={on}
                  aria-label={['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i]}
                  className={`h-10 flex-1 rounded-xl border text-sm font-bold transition-colors ${
                    on ? 'border-brand bg-brand/15 text-mint' : 'border-line text-muted'
                  }`}
                >
                  {letra}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex gap-3 text-xs font-semibold">
            <button type="button" onClick={() => setDias(TODOS_OS_DIAS)} className="text-mint">
              Todo dia
            </button>
            <button type="button" onClick={() => setDias([1, 2, 3, 4, 5])} className="text-mint">
              Dias úteis
            </button>
          </div>
        </div>

        <div>
          <Rotulo>Categoria</Rotulo>
          <Opcoes opcoes={CATEGORIAS} valor={categoria} onChange={setCategoria} />
        </div>

        <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
          Cada dia feito vale <span className="font-bold text-gold">+{XP_HABITO} XP</span>. Pular um dia não tira nada.
        </p>

        {erro && <p className="text-sm text-red-300">{erro}</p>}

        <button type="submit" className="w-full rounded-2xl bg-brand py-3 font-bold text-bg">
          {props.habito ? 'Salvar' : 'Criar hábito'}
        </button>

        {props.onExcluir && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Excluir este hábito? O XP que ele já rendeu continua com você.')) {
                props.onExcluir!()
                props.onFechar()
              }
            }}
            className="w-full rounded-2xl py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
          >
            Excluir hábito
          </button>
        )}
      </form>
    </Sheet>
  )
}
