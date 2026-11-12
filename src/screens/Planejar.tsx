import { useState, type FormEvent } from 'react'
import { useDados, type Dados } from '../lib/useDados'
import { amanhaISO, formatarData, hojeISO, type DadosTarefa, type Projeto, type Tarefa } from '../lib/tarefas'
import type { Habito } from '../lib/habitos'
import type { Compromisso } from '../lib/agenda'
import { descreverRegra, proximaOcorrencia, type DadosSerie, type Serie } from '../lib/series'
import { SerieForm } from '../components/SerieForm'
import { OfertaRevisao } from '../components/OfertaRevisao'
import { descreverRevisao } from '../lib/revisoes'
import { TarefaItem } from '../components/TarefaItem'
import { TarefaForm } from '../components/TarefaForm'
import { HabitoForm } from '../components/HabitoForm'
import { CompromissoForm } from '../components/CompromissoForm'
import { ProvaForm } from '../components/ProvaForm'
import type { Prova } from '../lib/provas'
import { Opcoes, Rotulo, Sheet } from '../components/Sheet'
import { IconCheck, IconChevron, IconPlus } from '../components/Icons'
import { ListaHabitos } from './planejar/Habitos'
import { Agenda } from './planejar/Agenda'
import { Aviso, Vazio } from './planejar/Vazio'

type Aba = 'tarefas' | 'projetos' | 'habitos' | 'agenda'
type Editor = { tarefa?: Tarefa; inicial?: Partial<DadosTarefa> }
type EditorSerie = { serie?: Serie; inicial?: Partial<DadosSerie> }

const BOTAO_NOVO: Record<Aba, string> = {
  tarefas: 'Tarefa',
  projetos: 'Projeto',
  habitos: 'Hábito',
  agenda: 'Compromisso',
}

export function Planejar() {
  const dados = useDados()
  const [aba, setAba] = useState<Aba>('tarefas')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [novoProjeto, setNovoProjeto] = useState(false)
  const [editorSerie, setEditorSerie] = useState<EditorSerie | null>(null)
  // undefined = fechado · null = criando um novo · objeto = editando
  const [habito, setHabito] = useState<Habito | null | undefined>(undefined)
  const [compromisso, setCompromisso] = useState<Compromisso | null | undefined>(undefined)
  const [dataNova, setDataNova] = useState<string | undefined>(undefined) // dia escolhido no calendário
  const [prova, setProva] = useState<{ prova?: Prova; data?: string } | null>(null) // modo prova

  const criarNovo = () => {
    if (aba === 'tarefas') setEditor({})
    if (aba === 'projetos') setNovoProjeto(true)
    if (aba === 'habitos') setHabito(null)
    if (aba === 'agenda') setCompromisso(null)
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Planejar</h1>
          <p className="text-sm text-muted">Organize sua semana.</p>
        </div>
        <button
          onClick={criarNovo}
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-bg"
        >
          <IconPlus className="h-4 w-4" />
          {BOTAO_NOVO[aba]}
        </button>
      </header>

      <Opcoes
        valor={aba}
        onChange={setAba}
        opcoes={[
          { id: 'tarefas', nome: 'Tarefas' },
          { id: 'projetos', nome: 'Projetos' },
          { id: 'habitos', nome: 'Hábitos' },
          { id: 'agenda', nome: 'Agenda' },
        ]}
      />

      {dados.erro && <Aviso>{dados.erro}</Aviso>}

      {dados.carregando ? (
        <p className="py-10 text-center text-sm text-muted">Carregando…</p>
      ) : aba === 'tarefas' ? (
        <ListaTarefas dados={dados} onEditar={setEditor} onEditarSerie={setEditorSerie} />
      ) : aba === 'projetos' ? (
        <ListaProjetos dados={dados} onEditar={setEditor} />
      ) : aba === 'habitos' ? (
        <ListaHabitos dados={dados} onEditar={setHabito} onNovo={() => setHabito(null)} />
      ) : (
        <Agenda
          dados={dados}
          onEditarCompromisso={setCompromisso}
          onEditarTarefa={(t) => setEditor({ tarefa: t })}
          onEditarSerie={(s) => setEditorSerie({ serie: s })}
          onNovo={(data) => {
            setDataNova(data)
            setCompromisso(null)
          }}
          onNovaProva={(data) => setProva({ data })}
          onVerProva={(p) => setProva({ prova: p })}
        />
      )}

      {editor && (
        <TarefaForm
          tarefa={editor.tarefa}
          inicial={editor.inicial}
          projetos={dados.projetos}
          onSalvar={(d) => dados.salvarTarefa(d, editor.tarefa?.id)}
          onExcluir={editor.tarefa ? () => dados.excluirTarefa(editor.tarefa!.id) : undefined}
          onFechar={() => setEditor(null)}
          serie={dados.series.find((s) => s.id === editor.tarefa?.series_id)}
          onEditarSerie={() => setEditorSerie({ serie: dados.series.find((s) => s.id === editor.tarefa?.series_id) })}
          onRepetir={
            dados.temRepeticoes && !editor.tarefa
              ? (d) => setEditorSerie({ inicial: { titulo: d.titulo, categoria: d.categoria, dificuldade: d.dificuldade } })
              : undefined
          }
        />
      )}

      {editorSerie && (
        <SerieForm
          serie={editorSerie.serie}
          inicial={editorSerie.inicial}
          onSalvar={(d) => dados.salvarSerie(d, editorSerie.serie?.id)}
          onExcluir={editorSerie.serie ? () => dados.excluirSerie(editorSerie.serie!.id) : undefined}
          onFechar={() => setEditorSerie(null)}
        />
      )}

      {prova && (
        <ProvaForm
          prova={prova.prova}
          dataInicial={prova.data}
          tarefas={dados.tarefas}
          onCriar={dados.criarProva}
          onExcluir={prova.prova ? () => dados.excluirProva(prova.prova!.id) : undefined}
          onFechar={() => setProva(null)}
        />
      )}

      {novoProjeto && <ProjetoForm onSalvar={dados.criarProjeto} onFechar={() => setNovoProjeto(false)} />}

      <OfertaRevisao dados={dados} />

      {habito !== undefined && (
        <HabitoForm
          habito={habito ?? undefined}
          onSalvar={(d) => dados.salvarHabito(d, habito?.id)}
          onExcluir={habito ? () => dados.excluirHabito(habito.id) : undefined}
          onFechar={() => setHabito(undefined)}
        />
      )}

      {compromisso !== undefined && (
        <CompromissoForm
          compromisso={compromisso ?? undefined}
          dataInicial={dataNova}
          tarefas={dados.tarefas}
          onSalvar={(d) => dados.salvarCompromisso(d, compromisso?.id)}
          onExcluir={compromisso ? () => dados.excluirCompromisso(compromisso.id) : undefined}
          onFechar={() => {
            setCompromisso(undefined)
            setDataNova(undefined)
          }}
        />
      )}
    </div>
  )
}

// ---------- Aba Tarefas ----------

function ListaTarefas(props: { dados: Dados; onEditar: (e: Editor) => void; onEditarSerie: (e: EditorSerie) => void }) {
  const { dados, onEditar, onEditarSerie } = props
  const [verFeitas, setVerFeitas] = useState(false)
  const hoje = hojeISO()
  const nomeProjeto = (id: string | null) => dados.projetos.find((p) => p.id === id)?.titulo

  const abertas = dados.tarefas.filter((t) => !t.concluida_em)
  const porData = (a: Tarefa, b: Tarefa) => (a.data ?? '').localeCompare(b.data ?? '')
  const grupos: { titulo: string; itens: Tarefa[] }[] = [
    { titulo: 'De dias anteriores', itens: abertas.filter((t) => t.data && t.data < hoje).sort(porData) },
    { titulo: 'Para hoje', itens: abertas.filter((t) => t.data === hoje) },
    { titulo: 'Próximos dias', itens: abertas.filter((t) => t.data && t.data > hoje).sort(porData) },
    { titulo: 'Sem data', itens: abertas.filter((t) => !t.data) },
  ]
  const feitas = dados.tarefas
    .filter((t) => t.concluida_em)
    .sort((a, b) => b.concluida_em!.localeCompare(a.concluida_em!))

  // Tarefas que se repetem: a regra de cada uma e quando aparece a próxima.
  const repeticoes = dados.temRepeticoes && (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-muted">Repetições{dados.series.length > 0 && ` · ${dados.series.length}`}</h2>
        <button onClick={() => onEditarSerie({})} className="text-xs font-bold text-mint">
          Nova repetição
        </button>
      </div>
      {dados.series.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Tem algo que você faz toda semana ou todo mês? Crie uma repetição e a tarefa aparece sozinha no dia certo.
        </p>
      ) : (
        <ul className="space-y-2">
          {dados.series.map((s) => {
            // Se o banco já conferiu hoje, a tarefa de hoje já foi criada (ou apagada): a próxima é de amanhã em diante.
            const proxima = proximaOcorrencia(s, s.gerado_ate && s.gerado_ate >= hoje ? amanhaISO() : hoje)
            return (
              <li key={s.id}>
                <button
                  onClick={() => onEditarSerie({ serie: s })}
                  aria-label={`Editar repetição "${s.titulo}"`}
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="block truncate font-semibold">{s.titulo}</span>
                  <span className="block truncate text-xs text-muted">
                    {descreverRegra(s)}
                    {proxima && ` · próxima: ${formatarData(proxima).toLowerCase()}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )

  if (dados.tarefas.length === 0) {
    return (
      <div className="space-y-5">
        <Vazio>
          Nenhuma tarefa ainda. Comece com algo pequeno, como <i>"Revisar 10 páginas"</i>.
          <button onClick={() => onEditar({})} className="mt-3 block w-full font-bold text-mint">
            Criar primeira tarefa
          </button>
        </Vazio>
        {repeticoes}
      </div>
    )
  }

  const item = (t: Tarefa) => (
    <TarefaItem
      key={t.id}
      tarefa={t}
      projeto={nomeProjeto(t.project_id)}
      mostrarData
      nota={t.series_id ? 'repete' : descreverRevisao(t)}
      onAlternar={() => dados.alternarTarefa(t)}
      onEditar={() => onEditar({ tarefa: t })}
    />
  )

  return (
    <div className="space-y-5">
      {grupos
        .filter((g) => g.itens.length > 0)
        .map((g) => (
          <section key={g.titulo}>
            <h2 className="mb-2 text-sm font-bold text-muted">{g.titulo}</h2>
            <ul className="space-y-2">{g.itens.map(item)}</ul>
          </section>
        ))}

      {abertas.length === 0 && <Vazio>Tudo feito por aqui. Bom trabalho! 🌱</Vazio>}

      {repeticoes}

      {feitas.length > 0 && (
        <section>
          <button
            onClick={() => setVerFeitas((v) => !v)}
            className="mb-2 flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
          >
            <IconChevron className={`h-4 w-4 transition-transform ${verFeitas ? 'rotate-90' : ''}`} />
            Concluídas ({feitas.length})
          </button>
          {verFeitas && <ul className="space-y-2">{feitas.slice(0, 30).map(item)}</ul>}
        </section>
      )}
    </div>
  )
}

// ---------- Aba Projetos ----------

function ListaProjetos({ dados, onEditar }: { dados: Dados; onEditar: (e: Editor) => void }) {
  const [aberto, setAberto] = useState<string | null>(null)

  if (dados.projetos.length === 0) {
    return (
      <Vazio>
        Projetos são objetivos maiores divididos em etapas, como <i>"Dominar fisiologia renal"</i>. Cada etapa
        concluída vale +25 XP.
      </Vazio>
    )
  }

  const ordenados = [...dados.projetos].sort((a, b) => Number(!!a.concluido_em) - Number(!!b.concluido_em))

  return (
    <ul className="space-y-3">
      {ordenados.map((p) => (
        <CartaoProjeto
          key={p.id}
          projeto={p}
          etapas={dados.tarefas.filter((t) => t.project_id === p.id)}
          aberto={aberto === p.id}
          onAbrir={() => setAberto((x) => (x === p.id ? null : p.id))}
          dados={dados}
          onEditar={onEditar}
        />
      ))}
    </ul>
  )
}

function CartaoProjeto(props: {
  projeto: Projeto
  etapas: Tarefa[]
  aberto: boolean
  onAbrir: () => void
  dados: Dados
  onEditar: (e: Editor) => void
}) {
  const { projeto: p, etapas, dados } = props
  const feitas = etapas.filter((t) => t.concluida_em).length
  const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0
  const concluido = !!p.concluido_em
  const podeConcluir = etapas.length > 0 && feitas === etapas.length

  const ordenadas = [...etapas].sort((a, b) => Number(!!a.concluida_em) - Number(!!b.concluida_em))

  return (
    <li className={`rounded-3xl border border-line bg-surface ${concluido ? 'opacity-70' : ''}`}>
      <button onClick={props.onAbrir} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-bold">{p.titulo}</span>
            {concluido && (
              <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-mint">
                <IconCheck className="h-3 w-3" /> Concluído
              </span>
            )}
          </span>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </span>
          <span className="mt-1.5 block text-xs text-muted">
            {etapas.length === 0 ? 'Nenhuma etapa ainda' : `${feitas} de ${etapas.length} etapas`}
          </span>
        </span>
        <IconChevron className={`h-5 w-5 shrink-0 text-muted transition-transform ${props.aberto ? 'rotate-90' : ''}`} />
      </button>

      {props.aberto && (
        <div className="space-y-3 border-t border-line p-4">
          {ordenadas.length > 0 && (
            <ul className="space-y-2">
              {ordenadas.map((t) => (
                <TarefaItem
                  key={t.id}
                  tarefa={t}
                  mostrarData
                  onAlternar={() => dados.alternarTarefa(t)}
                  onEditar={() => props.onEditar({ tarefa: t })}
                />
              ))}
            </ul>
          )}

          {!concluido && (
            <button
              onClick={() => props.onEditar({ inicial: { project_id: p.id, data: null } })}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-2.5 text-sm font-bold text-mint hover:bg-surface-2"
            >
              <IconPlus className="h-4 w-4" /> Adicionar etapa
            </button>
          )}

          <div className="flex gap-2">
            {(podeConcluir || concluido) && (
              <button
                onClick={() => dados.alternarProjeto(p)}
                className="flex-1 rounded-2xl bg-brand/15 py-2.5 text-sm font-bold text-mint hover:bg-brand/25"
              >
                {concluido ? 'Reabrir projeto' : 'Concluir projeto 🎉'}
              </button>
            )}
            <button
              onClick={() => {
                const aviso = etapas.length
                  ? `Excluir "${p.titulo}" e suas ${etapas.length} etapas?`
                  : `Excluir "${p.titulo}"?`
                if (confirm(aviso)) dados.excluirProjeto(p.id)
              }}
              className="rounded-2xl px-4 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/10"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

function ProjetoForm({ onSalvar, onFechar }: { onSalvar: (titulo: string) => void; onFechar: () => void }) {
  const [titulo, setTitulo] = useState('')
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    onSalvar(titulo.trim())
    onFechar()
  }
  return (
    <Sheet titulo="Novo projeto" onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>Qual é o objetivo?</Rotulo>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Dominar fisiologia renal"
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <p className="text-sm text-muted">Depois de criar, abra o projeto para adicionar as etapas.</p>
        <button
          type="submit"
          disabled={!titulo.trim()}
          className="w-full rounded-2xl bg-brand py-3 font-bold text-bg disabled:opacity-50"
        >
          Criar projeto
        </button>
      </form>
    </Sheet>
  )
}

