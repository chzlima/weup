import { useState, type FormEvent } from 'react'
import { Opcoes, Rotulo, Sheet } from './Sheet'
import { CampoData } from './CampoData'
import {
  CATEGORIAS,
  DIFICULDADES,
  XP_DIFICULDADE,
  XP_ETAPA,
  hojeISO,
  type DadosTarefa,
  type Projeto,
  type Tarefa,
} from '../lib/tarefas'
import { descreverRegra, type Serie } from '../lib/series'

// Formulário para criar ou editar uma tarefa (ou etapa de projeto).
export function TarefaForm(props: {
  tarefa?: Tarefa
  inicial?: Partial<DadosTarefa>
  projetos: Projeto[]
  onSalvar: (dados: DadosTarefa) => void
  onExcluir?: () => void
  onFechar: () => void
  serie?: Serie // a tarefa veio de uma repetição
  onEditarSerie?: () => void
  onRepetir?: (dados: DadosTarefa) => void // transformar a tarefa nova numa repetição
}) {
  const base: DadosTarefa = {
    titulo: '',
    dificuldade: 'pequena',
    categoria: 'estudo',
    project_id: null,
    data: hojeISO(),
    prazo: null,
    ...props.inicial,
    ...(props.tarefa && {
      titulo: props.tarefa.titulo,
      dificuldade: props.tarefa.dificuldade,
      categoria: props.tarefa.categoria,
      project_id: props.tarefa.project_id,
      data: props.tarefa.data,
      prazo: props.tarefa.prazo ?? null,
    }),
  }
  const [d, setD] = useState<DadosTarefa>(base)
  const [erro, setErro] = useState('')
  const set = <K extends keyof DadosTarefa>(k: K, v: DadosTarefa[K]) => setD((x) => ({ ...x, [k]: v }))

  const projetosAbertos = props.projetos.filter((p) => !p.concluido_em || p.id === d.project_id)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const titulo = d.titulo.trim()
    if (!titulo) return setErro('Dê um nome para a tarefa.')
    const dados: DadosTarefa = { ...d, titulo }
    // Sem prazo numa tarefa nova: não manda o campo (assim funciona mesmo antes do ciclo15-agenda.sql).
    if (!dados.prazo && !(props.tarefa && 'prazo' in props.tarefa)) delete dados.prazo
    props.onSalvar(dados)
    props.onFechar()
  }

  return (
    <Sheet titulo={props.tarefa ? 'Editar tarefa' : 'Nova tarefa'} onFechar={props.onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>O que você vai fazer?</Rotulo>
          <input
            autoFocus
            value={d.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            maxLength={200}
            placeholder="Ex.: Revisar fisiologia renal"
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <CampoData valor={d.data} onChange={(v) => set('data', v)} permitirSemData />

        <label className="block">
          <Rotulo>Prazo (opcional): até quando precisa estar pronta</Rotulo>
          <div className="flex gap-2">
            <input
              type="date"
              value={d.prazo ?? ''}
              onChange={(e) => set('prazo', e.target.value || null)}
              aria-label="Prazo"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none [color-scheme:dark] focus:border-brand"
            />
            {d.prazo && (
              <button type="button" onClick={() => set('prazo', null)} className="rounded-xl px-3 text-sm font-semibold text-muted">
                Sem prazo
              </button>
            )}
          </div>
        </label>

        {props.serie && (
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
            Esta tarefa se repete (<span className="font-semibold text-ink">{descreverRegra(props.serie)}</span>). O que
            você mudar aqui vale só para esta.
            {props.onEditarSerie && (
              <button
                type="button"
                onClick={() => {
                  props.onFechar()
                  props.onEditarSerie!()
                }}
                className="ml-1 font-bold text-mint"
              >
                Editar repetição
              </button>
            )}
          </p>
        )}

        {props.onRepetir && !d.project_id && (
          <button
            type="button"
            onClick={() => {
              const titulo = d.titulo.trim()
              if (!titulo) return setErro('Dê um nome para a tarefa.')
              props.onFechar()
              props.onRepetir!({ ...d, titulo })
            }}
            className="text-sm font-bold text-mint"
          >
            Repetir esta tarefa…
          </button>
        )}

        <div>
          <Rotulo>Categoria</Rotulo>
          <Opcoes opcoes={CATEGORIAS} valor={d.categoria} onChange={(v) => set('categoria', v)} />
        </div>

        {projetosAbertos.length > 0 && (
          <label className="block">
            <Rotulo>Projeto (opcional)</Rotulo>
            <select
              value={d.project_id ?? ''}
              onChange={(e) => set('project_id', e.target.value || null)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
            >
              <option value="">Nenhum (tarefa avulsa)</option>
              {projetosAbertos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </label>
        )}

        {d.project_id ? (
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
            Etapa de projeto: vale <span className="font-bold text-gold">+{XP_ETAPA} XP</span>.
          </p>
        ) : (
          <div>
            <Rotulo>Tamanho</Rotulo>
            <Opcoes
              opcoes={DIFICULDADES.map((x) => ({ id: x.id, nome: `${x.nome} · ${XP_DIFICULDADE[x.id]}` }))}
              valor={d.dificuldade}
              onChange={(v) => set('dificuldade', v)}
            />
          </div>
        )}

        {erro && <p className="text-sm text-red-300">{erro}</p>}

        <button type="submit" className="w-full rounded-2xl bg-brand py-3 font-bold text-bg">
          {props.tarefa ? 'Salvar' : 'Adicionar'}
        </button>

        {props.onExcluir && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Excluir esta tarefa?')) {
                props.onExcluir!()
                props.onFechar()
              }
            }}
            className="w-full rounded-2xl py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
          >
            Excluir tarefa
          </button>
        )}
      </form>
    </Sheet>
  )
}
