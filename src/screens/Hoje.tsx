import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Pet } from '../components/Pet'
import { HabitoItem, TarefaItem } from '../components/TarefaItem'
import { TarefaForm } from '../components/TarefaForm'
import { HabitoForm } from '../components/HabitoForm'
import { CompromissoForm } from '../components/CompromissoForm'
import { Foco } from '../components/Foco'
import { Recomecar } from '../components/Recomecar'
import { IconPlus, IconRecomecar } from '../components/Icons'
import { useAuth } from '../lib/auth'
import { usePet } from '../lib/pet'
import { useDados } from '../lib/useDados'
import { concluidaHoje, diaDaSemana, hojeISO, somarDias, type Tarefa } from '../lib/tarefas'
import type { Habito } from '../lib/habitos'
import { calcularNivel } from '../lib/xp'
import { ordemCompromisso, type Compromisso } from '../lib/agenda'
import { Aviso } from './planejar/Vazio'
import { LinhaCompromisso } from './planejar/Agenda'

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Hoje() {
  const { nome } = useAuth()
  const { pet, acompanharNivel } = usePet()
  const dados = useDados()
  const [editando, setEditando] = useState<Tarefa | null>(null)
  const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null)
  const [compromissoEditando, setCompromissoEditando] = useState<Compromisso | null>(null)
  const [rapida, setRapida] = useState('')
  const [recomecando, setRecomecando] = useState(false)

  const hoje = hojeISO()
  // Para hoje = o que está planejado até hoje e ainda não foi feito + o que foi concluído hoje.
  const pendentes = dados.tarefas
    .filter((t) => !t.concluida_em && t.data && t.data <= hoje)
    .sort((a, b) => a.data!.localeCompare(b.data!))
  const feitasHoje = dados.tarefas.filter(concluidaHoje)
  const lista = [...pendentes, ...feitasHoje]

  // Hábitos programados para hoje (os já feitos vão para o fim).
  const habitosHoje = dados.habitos
    .filter((h) => h.dias.includes(diaDaSemana(hoje)))
    .sort((a, b) => Number(dados.feitoNoDia(a.id, hoje)) - Number(dados.feitoNoDia(b.id, hoje)))
  const habitosFeitos = habitosHoje.filter((h) => dados.feitoNoDia(h.id, hoje)).length
  const ultimos7 = Array.from({ length: 7 }, (_, i) => somarDias(i - 6))
  const vezes = (h: Habito) => ultimos7.filter((d) => dados.feitoNoDia(h.id, d)).length

  // Compromissos de hoje e amanhã.
  const proximos = dados.compromissos.filter((c) => c.data <= somarDias(1)).sort(ordemCompromisso).slice(0, 4)

  const total = lista.length + habitosHoje.length
  const feitos = feitasHoje.length + habitosFeitos
  const pct = total ? Math.round((feitos / total) * 100) : 0
  const nomeProjeto = (id: string | null) => dados.projetos.find((p) => p.id === id)?.titulo

  // XP de verdade, vindo do registro do banco.
  const lancHoje = dados.lancamentos.filter((l) => l.dia === hoje)
  const xpHoje = lancHoje.reduce((s, l) => s + l.xp, 0)
  const bateuLimite = lancHoje.some((l) => l.limitado)
  const { nivel } = calcularNivel(dados.resumoXP.total)

  // Aviso de subida de nível (só quando sobe enquanto a tela está aberta).
  const nivelAnterior = useRef<number | null>(null)
  const [subiu, setSubiu] = useState<number | null>(null)
  useEffect(() => {
    if (dados.carregando) return
    if (nivelAnterior.current !== null && nivel > nivelAnterior.current) {
      setSubiu(nivel)
      const t = setTimeout(() => setSubiu(null), 4000)
      nivelAnterior.current = nivel
      return () => clearTimeout(t)
    }
    nivelAnterior.current = nivel
  }, [nivel, dados.carregando])

  // O pet evolui quando o nível chega a 5 e a 10.
  useEffect(() => {
    if (!dados.carregando) acompanharNivel(nivel)
  }, [nivel, dados.carregando, acompanharNivel])

  const adicionarRapida = (e: FormEvent) => {
    e.preventDefault()
    const titulo = rapida.trim()
    if (!titulo) return
    dados.salvarTarefa({ titulo, dificuldade: 'pequena', categoria: 'estudo', project_id: null, data: hoje })
    setRapida('')
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{saudacao()},</p>
          <h1 className="text-2xl font-extrabold">{nome}</h1>
        </div>
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-gold">
          Nível {nivel}
        </span>
      </header>

      {subiu && (
        <div
          role="status"
          className="fixed inset-x-4 top-4 z-40 mx-auto max-w-sm rounded-2xl border border-gold/40 bg-surface px-4 py-3 text-center shadow-lg"
        >
          <p className="font-extrabold text-gold">Subiu para o nível {subiu}! 🎉</p>
          <p className="text-xs text-muted">{pet?.nome ?? 'Seu companheiro'} comemorou junto com você.</p>
        </div>
      )}

      {/* Pet ativo + progresso do dia */}
      <section className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
        <Pet especie={pet?.especie} estagio={pet?.estagio} feliz={feitos > 0} size={88} nome={pet?.nome} />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Progresso de hoje</p>
          <p className="mt-1 text-lg font-bold">
            {total === 0 ? 'Dia livre por enquanto' : `${feitos} de ${total} concluídos`}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-mint">+{xpHoje} XP hoje</p>
          {bateuLimite && (
            <p className="mt-1 text-[11px] text-muted">Algumas conclusões passaram do limite diário de XP.</p>
          )}
        </div>
      </section>

      {dados.erro && <Aviso>{dados.erro}</Aviso>}

      {/* Tarefas do dia */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted">O que fazer agora</h2>

        <form onSubmit={adicionarRapida} className="mb-2 flex gap-2">
          <input
            value={rapida}
            onChange={(e) => setRapida(e.target.value)}
            maxLength={200}
            placeholder="Adicionar tarefa para hoje…"
            aria-label="Nova tarefa para hoje"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 outline-none placeholder:text-muted focus:border-brand"
          />
          <button
            type="submit"
            disabled={!rapida.trim()}
            aria-label="Adicionar"
            className="rounded-2xl bg-brand px-4 text-bg disabled:opacity-40"
          >
            <IconPlus className="h-5 w-5" />
          </button>
        </form>

        {dados.carregando ? (
          <p className="py-6 text-center text-sm text-muted">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
            Nada planejado para hoje. Que tal uma tarefa pequena?
          </p>
        ) : (
          <ul className="space-y-2">
            {lista.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                projeto={nomeProjeto(t.project_id)}
                onAlternar={() => dados.alternarTarefa(t)}
                onEditar={() => setEditando(t)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Timer de foco */}
      {!dados.carregando && (
        <Foco
          tarefas={pendentes}
          sessoesHoje={lancHoje.filter((l) => l.tipo === 'foco').length}
          onConcluiu={dados.recarregarXP}
        />
      )}

      {/* Hábitos de hoje */}
      {!dados.carregando && habitosHoje.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-muted">
            Hábitos de hoje · {habitosFeitos}/{habitosHoje.length}
          </h2>
          <ul className="space-y-2">
            {habitosHoje.map((h) => (
              <HabitoItem
                key={h.id}
                habito={h}
                feito={dados.feitoNoDia(h.id, hoje)}
                vezesNaSemana={vezes(h)}
                onAlternar={() => dados.alternarHabito(h)}
                onEditar={() => setHabitoEditando(h)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Próximos compromissos */}
      {!dados.carregando && proximos.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-muted">Próximos compromissos</h2>
          <ul className="space-y-2">
            {proximos.map((c) => (
              <LinhaCompromisso key={c.id} c={c} mostrarData onEditar={() => setCompromissoEditando(c)} />
            ))}
          </ul>
        </section>
      )}

      {/* Modo Recomeçar */}
      <button
        onClick={() => setRecomecando(true)}
        disabled={dados.carregando}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand/50 px-4 py-3 text-left transition-colors hover:bg-brand/10"
      >
        <IconRecomecar className="h-6 w-6 text-mint" />
        <span>
          <span className="block font-bold text-mint">Recomeçar</span>
          <span className="text-xs text-muted">Travou? Um passo pequeno de cada vez.</span>
        </span>
      </button>

      {editando && (
        <TarefaForm
          tarefa={editando}
          projetos={dados.projetos}
          onSalvar={(d) => dados.salvarTarefa(d, editando.id)}
          onExcluir={() => dados.excluirTarefa(editando.id)}
          onFechar={() => setEditando(null)}
        />
      )}

      {recomecando && <Recomecar dados={dados} onFechar={() => setRecomecando(false)} />}

      {habitoEditando && (
        <HabitoForm
          habito={habitoEditando}
          onSalvar={(d) => dados.salvarHabito(d, habitoEditando.id)}
          onExcluir={() => dados.excluirHabito(habitoEditando.id)}
          onFechar={() => setHabitoEditando(null)}
        />
      )}

      {compromissoEditando && (
        <CompromissoForm
          compromisso={compromissoEditando}
          onSalvar={(d) => dados.salvarCompromisso(d, compromissoEditando.id)}
          onExcluir={() => dados.excluirCompromisso(compromissoEditando.id)}
          onFechar={() => setCompromissoEditando(null)}
        />
      )}
    </div>
  )
}
