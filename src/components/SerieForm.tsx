import { useState, type FormEvent } from 'react'
import { Opcoes, Rotulo, Sheet } from './Sheet'
import { CATEGORIAS, DIFICULDADES, XP_DIFICULDADE, diaISO } from '../lib/tarefas'
import { DIAS_SEMANA } from '../lib/habitos'
import { TIPOS_SERIE, descreverRegra, proximaOcorrencia, validarRegra, type DadosSerie, type Serie } from '../lib/series'

const NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Formulário de uma tarefa que se repete (a "série"): o quê, e em quais dias.
export function SerieForm(props: {
  serie?: Serie
  inicial?: Partial<DadosSerie>
  onSalvar: (dados: DadosSerie) => void
  onExcluir?: () => void
  onFechar: () => void
}) {
  const hoje = new Date()
  const [d, setD] = useState<DadosSerie>({
    titulo: '',
    dificuldade: 'pequena',
    categoria: 'estudo',
    tipo: 'semanal',
    dias: [hoje.getDay()],
    dia_mes: hoje.getDate(),
    ...props.inicial,
    ...(props.serie && {
      titulo: props.serie.titulo,
      dificuldade: props.serie.dificuldade,
      categoria: props.serie.categoria,
      tipo: props.serie.tipo,
      dias: props.serie.dias ?? [hoje.getDay()],
      dia_mes: props.serie.dia_mes ?? hoje.getDate(),
    }),
  })
  const [erro, setErro] = useState('')
  const set = <K extends keyof DadosSerie>(k: K, v: DadosSerie[K]) => setD((x) => ({ ...x, [k]: v }))

  const alternarDia = (i: number) => {
    const dias = d.dias ?? []
    set('dias', dias.includes(i) ? dias.filter((x) => x !== i) : [...dias, i].sort())
  }

  const problema = validarRegra(d)
  const proxima = problema ? null : proximaOcorrencia(d)
  const quando =
    proxima === diaISO()
      ? 'A primeira aparece hoje.'
      : proxima
        ? `A próxima aparece ${new Date(`${proxima}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.`
        : ''

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const titulo = d.titulo.trim()
    if (!titulo) return setErro('Dê um nome para a tarefa.')
    if (problema) return setErro(problema)
    props.onSalvar({ ...d, titulo })
    props.onFechar()
  }

  return (
    <Sheet titulo={props.serie ? 'Editar repetição' : 'Tarefa que se repete'} onFechar={props.onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>O que você vai fazer?</Rotulo>
          <input
            autoFocus={!d.titulo}
            value={d.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            maxLength={200}
            placeholder="Ex.: Revisar as anotações da semana"
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <div>
          <Rotulo>Repete</Rotulo>
          <Opcoes opcoes={TIPOS_SERIE} valor={d.tipo} onChange={(v) => set('tipo', v)} />
        </div>

        {d.tipo === 'semanal' && (
          <div>
            <Rotulo>Em quais dias?</Rotulo>
            <div className="flex justify-between gap-1.5">
              {DIAS_SEMANA.map((letra, i) => {
                const on = (d.dias ?? []).includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => alternarDia(i)}
                    aria-pressed={on}
                    aria-label={NOMES[i]}
                    className={`h-10 flex-1 rounded-xl border text-sm font-bold transition-colors ${
                      on ? 'border-brand bg-brand/15 text-mint' : 'border-line text-muted'
                    }`}
                  >
                    {letra}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {d.tipo === 'mensal' && (
          <label className="block">
            <Rotulo>Em qual dia do mês?</Rotulo>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={d.dia_mes ?? ''}
              onChange={(e) => set('dia_mes', e.target.value ? Number(e.target.value) : null)}
              aria-label="Dia do mês"
              className="w-24 rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
            />
            {(d.dia_mes ?? 0) > 28 && (
              <span className="mt-1 block text-xs text-muted">Nos meses mais curtos, cai no último dia do mês.</span>
            )}
          </label>
        )}

        <div>
          <Rotulo>Categoria</Rotulo>
          <Opcoes opcoes={CATEGORIAS} valor={d.categoria} onChange={(v) => set('categoria', v)} />
        </div>

        <div>
          <Rotulo>Tamanho</Rotulo>
          <Opcoes
            opcoes={DIFICULDADES.map((x) => ({ id: x.id, nome: `${x.nome} · ${XP_DIFICULDADE[x.id]}` }))}
            valor={d.dificuldade}
            onChange={(v) => set('dificuldade', v)}
          />
        </div>

        <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
          {!problema && <span className="font-semibold text-ink">{descreverRegra(d)}. </span>}
          {quando} A tarefa aparece no dia certo; se você ficar uns dias sem abrir o app, nada se acumula.
        </p>

        {erro && <p className="text-sm text-red-300">{erro}</p>}

        <button type="submit" className="w-full rounded-2xl bg-brand py-3 font-bold text-bg">
          {props.serie ? 'Salvar' : 'Criar repetição'}
        </button>
        {props.serie && (
          <p className="text-center text-xs text-muted">Vale para as próximas. As tarefas já criadas ficam como estão.</p>
        )}

        {props.onExcluir && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Parar de repetir? As tarefas que já existem continuam.')) {
                props.onExcluir!()
                props.onFechar()
              }
            }}
            className="w-full rounded-2xl py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
          >
            Parar de repetir
          </button>
        )}
      </form>
    </Sheet>
  )
}
