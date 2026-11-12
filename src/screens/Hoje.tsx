import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Pet } from '../components/Pet'
import { HabitoItem, TarefaItem } from '../components/TarefaItem'
import { TarefaForm } from '../components/TarefaForm'
import { HabitoForm } from '../components/HabitoForm'
import { CompromissoForm } from '../components/CompromissoForm'
import { Foco } from '../components/Foco'
import { Recomecar } from '../components/Recomecar'
import { OfertaRevisao } from '../components/OfertaRevisao'
import { acaoPendente, limparAcaoPendente } from '../lib/atalhos'
import { CheckinEnergia } from '../components/CheckinEnergia'
import { EntradaRevisao } from '../components/RevisaoSemanal'
import { expressaoDoMomento } from '../pets/humor'
import { momentoDoDia } from '../pets/momento'
import { META_DIA_LEVE, ordenarPorEnergia, progressoDoDia, separarDiaLeve, usePlanoDeHoje } from '../lib/energia'
import {
  MAX_PRIORIDADES, alternarPrioridade, moverPrioridade, prazoChegando, separarPrioridades,
} from '../lib/prioridades'
import { descreverRevisao } from '../lib/revisoes'
import { IconPlus, IconRecomecar } from '../components/Icons'
import { useAuth } from '../lib/auth'
import { usePet } from '../lib/pet'
import { useDados } from '../lib/useDados'
import {
  amanhaISO, concluidaHoje, descreverAnterior, diaDaSemana, hojeISO, separarPendentes, somarDias, type DadosTarefa,
  type Tarefa,
} from '../lib/tarefas'
import type { Habito } from '../lib/habitos'
import { calcularNivel } from '../lib/xp'
import { ordemCompromisso, type Compromisso } from '../lib/agenda'
import { Aviso } from './planejar/Vazio'
import { LinhaCompromisso } from './planejar/Agenda'

function BotaoReagendar({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-ink"
    >
      {children}
    </button>
  )
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Hoje() {
  const { nome, modoSimples } = useAuth()
  const { pet, acompanharNivel } = usePet()
  const dados = useDados()
  const [editando, setEditando] = useState<Tarefa | null>(null)
  const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null)
  const [compromissoEditando, setCompromissoEditando] = useState<Compromisso | null>(null)
  const [rapida, setRapida] = useState('')
  const [recomecando, setRecomecando] = useState(false)
  // Atalho do ícone ou algo compartilhado de outro app: abre a tarefa nova ou o foco uma vez só.
  const [acao] = useState(acaoPendente)
  const [novaTarefa, setNovaTarefa] = useState<Partial<DadosTarefa> | null>(
    acao?.tipo === 'nova-tarefa' ? { titulo: acao.titulo, data: hojeISO() } : null,
  )
  useEffect(() => limparAcaoPendente(), [])
  const plano = usePlanoDeHoje()
  const energia = plano.energia
  const [verTodas, setVerTodas] = useState(false) // dia leve: mostrar também as tarefas guardadas
  const [verAnteriores, setVerAnteriores] = useState(false) // dia leve: abrir "De dias anteriores"

  const hoje = hojeISO()
  // Para hoje = o que está planejado para hoje + o que foi concluído hoje.
  // O que ficou de dias anteriores aparece numa seção própria e não pesa no progresso do dia.
  const { deHoje, anteriores } = separarPendentes(dados.tarefas, hoje)
  const pendentes = [...deHoje, ...anteriores]
  const feitasHoje = dados.tarefas.filter(concluidaHoje)

  // Hábitos programados para hoje (os já feitos vão para o fim).
  const habitosHoje = dados.habitos
    .filter((h) => h.dias.includes(diaDaSemana(hoje)))
    .sort((a, b) => Number(dados.feitoNoDia(a.id, hoje)) - Number(dados.feitoNoDia(b.id, hoje)))
  const habitosFeitos = habitosHoje.filter((h) => dados.feitoNoDia(h.id, hoje)).length
  const ultimos7 = Array.from({ length: 7 }, (_, i) => somarDias(i - 6))
  const vezes = (h: Habito) => ultimos7.filter((d) => dados.feitoNoDia(h.id, d)).length

  // Compromissos de hoje e amanhã.
  const proximos = dados.compromissos
    .filter((c) => c.data >= hoje && c.data <= somarDias(1))
    .sort(ordemCompromisso)
    .slice(0, 4)

  const total = deHoje.length + feitasHoje.length + habitosHoje.length
  const feitos = feitasHoje.length + habitosFeitos

  // Prioridades do dia: até 3 tarefas do dia, numa seção própria e na ordem escolhida.
  const doDia = [...deHoje, ...feitasHoje]
  const { prioridades } = separarPrioridades(doDia, plano.prioridades)
  const idsPrioridades = prioridades.map((t) => t.id)
  const ehPrioridade = (t: Tarefa) => idsPrioridades.includes(t.id)
  const prioridadesAbertas = prioridades.filter((t) => !t.concluida_em).length
  const estrela = (t: Tarefa) =>
    plano.temPrioridades
      ? {
          prioridade: ehPrioridade(t),
          podeMarcar: idsPrioridades.length < MAX_PRIORIDADES,
          onPrioridade: () => plano.definirPrioridades(alternarPrioridade(idsPrioridades, t.id)),
        }
      : {}
  const mover = (t: Tarefa, delta: -1 | 1) => plano.definirPrioridades(moverPrioridade(idsPrioridades, t.id, delta))

  // Prazo até amanhã em tarefas planejadas para outro dia (ou sem data).
  const chegando = prazoChegando(dados.tarefas, hoje)

  // Check-in de energia: baixa = dia leve (só 3 coisas, menores primeiro); alta = maiores primeiro.
  // No dia leve, as prioridades abertas já ocupam vagas das 3.
  const ordenadas = ordenarPorEnergia(deHoje.filter((t) => !ehPrioridade(t)), energia)
  const { visiveis, guardadas } = separarDiaLeve(ordenadas, energia, feitos + prioridadesAbertas)
  const lista = [...(verTodas ? ordenadas : visiveis), ...feitasHoje.filter((t) => !ehPrioridade(t))]
  const escondidas = verTodas ? [] : guardadas
  const progresso = progressoDoDia(feitos, total, energia)
  const anterioresRecolhidas = energia === 'baixa' && !verAnteriores
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
        {!modoSimples && (
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-gold">
            Nível {nivel}
          </span>
        )}
      </header>

      {subiu && !modoSimples && (
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
        {!modoSimples && <Pet
          especie={pet?.especie}
          estagio={pet?.estagio}
          caminho={pet?.caminho}
          visual={pet ?? undefined}
          expressao={dados.carregando ? 'feliz' : expressaoDoMomento(momentoDoDia(dados, plano))}
          size={88}
          nome={pet?.nome}
        />}
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Progresso de hoje</p>
          <p className="mt-1 text-lg font-bold">
            {progresso.texto}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progresso.pct}%` }} />
          </div>
          {!modoSimples && <p className="mt-2 text-sm text-mint">+{xpHoje} XP hoje</p>}
          {bateuLimite && !modoSimples && (
            <p className="mt-1 text-[11px] text-muted">Algumas conclusões passaram do limite diário de XP.</p>
          )}
        </div>
      </section>

      {dados.erro && <Aviso>{dados.erro}</Aviso>}

      {/* Check-in de energia (opcional, um toque por dia) */}
      {/* Domingo e segunda: lembrete da revisão da semana (some depois de feita) */}
      {!dados.carregando && <EntradaRevisao />}

      {plano.disponivel && !dados.carregando && <CheckinEnergia energia={energia} onEscolher={plano.escolher} />}
      {plano.erro && <Aviso>{plano.erro}</Aviso>}

      {/* Prioridades do dia: até 3, na ordem escolhida */}
      {plano.temPrioridades && !dados.carregando && doDia.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-muted">
            Prioridades de hoje · {prioridades.length}/{MAX_PRIORIDADES}
          </h2>
          {prioridades.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
              Toque na ☆ de até 3 tarefas para marcar o que mais importa hoje.
            </p>
          ) : (
            <ul className="space-y-2">
              {prioridades.map((t, i) => (
                <TarefaItem
                  key={t.id}
                  tarefa={t}
                  projeto={nomeProjeto(t.project_id)}
                  nota={t.series_id ? 'repete' : descreverRevisao(t)}
                  onAlternar={() => dados.alternarTarefa(t)}
                  onEditar={() => setEditando(t)}
                  {...estrela(t)}
                  acoes={
                    prioridades.length > 1 ? (
                      <>
                        {i > 0 && <BotaoReagendar onClick={() => mover(t, -1)}>↑ Subir</BotaoReagendar>}
                        {i < prioridades.length - 1 && <BotaoReagendar onClick={() => mover(t, 1)}>↓ Descer</BotaoReagendar>}
                      </>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}

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
        ) : doDia.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
            Nada planejado para hoje. Que tal uma tarefa pequena?
          </p>
        ) : lista.length === 0 ? null : (
          <ul className="space-y-2">
            {lista.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                projeto={nomeProjeto(t.project_id)}
                nota={t.series_id ? 'repete' : descreverRevisao(t)}
                onAlternar={() => dados.alternarTarefa(t)}
                onEditar={() => setEditando(t)}
                {...estrela(t)}
              />
            ))}
          </ul>
        )}

        {/* Dia leve: o resto fica guardado, nunca some */}
        {!dados.carregando && escondidas.length > 0 && (
          <button
            onClick={() => setVerTodas(true)}
            className="mt-2 w-full rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:text-ink"
          >
            {feitos >= META_DIA_LEVE ? 'Dia leve cumprido. Quer fazer mais? ' : 'O dia leve guardou o resto. '}
            <span className="font-bold text-mint">
              Ver mais {escondidas.length} {escondidas.length === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </button>
        )}
      </section>

      {/* Prazo chegando: planejadas para outro dia (ou sem data), mas o prazo é até amanhã */}
      {!dados.carregando && chegando.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-bold text-muted">Prazo chegando · {chegando.length}</h2>
          <p className="mb-2 text-xs text-muted">Planejadas para outro dia ou sem data, mas o prazo é até amanhã.</p>
          <ul className="space-y-2">
            {chegando.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                projeto={nomeProjeto(t.project_id)}
                mostrarData
                onAlternar={() => dados.alternarTarefa(t)}
                onEditar={() => setEditando(t)}
                acoes={<BotaoReagendar onClick={() => dados.reagendarTarefas([t.id], hoje)}>Fazer hoje</BotaoReagendar>}
              />
            ))}
          </ul>
        </section>
      )}

      {/* O que ficou de dias anteriores: a pessoa decide o que fazer, sem cobrança */}
      {!dados.carregando && anteriores.length > 0 && anterioresRecolhidas && (
        <section className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3">
          <p className="text-sm text-muted">
            {anteriores.length} {anteriores.length === 1 ? 'tarefa' : 'tarefas'} de dias anteriores. Hoje é dia leve:
            pode esperar.
          </p>
          <button onClick={() => setVerAnteriores(true)} className="shrink-0 text-xs font-bold text-mint">
            Ver
          </button>
        </section>
      )}
      {!dados.carregando && anteriores.length > 0 && !anterioresRecolhidas && (
        <section>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold text-muted">De dias anteriores · {anteriores.length}</h2>
            {anteriores.length > 1 && (
              <button
                onClick={() => dados.reagendarTarefas(anteriores.map((t) => t.id), hoje)}
                className="text-xs font-bold text-mint"
              >
                Trazer tudo para hoje
              </button>
            )}
          </div>
          <p className="mb-2 text-xs text-muted">Sem pressa: traga para hoje, deixe para amanhã ou conclua direto.</p>
          <ul className="space-y-2">
            {anteriores.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                projeto={nomeProjeto(t.project_id)}
                nota={descreverAnterior(t.data!, hoje)}
                onAlternar={() => dados.alternarTarefa(t)}
                onEditar={() => setEditando(t)}
                acoes={
                  <>
                    <BotaoReagendar onClick={() => dados.reagendarTarefas([t.id], hoje)}>Hoje</BotaoReagendar>
                    <BotaoReagendar onClick={() => dados.reagendarTarefas([t.id], amanhaISO())}>Amanhã</BotaoReagendar>
                    <BotaoReagendar onClick={() => dados.reagendarTarefas([t.id], null)}>Sem data</BotaoReagendar>
                  </>
                }
              />
            ))}
          </ul>
        </section>
      )}

      {/* Timer de foco */}
      {!dados.carregando && (
        <Foco
          tarefas={pendentes}
          sessoesHoje={lancHoje.filter((l) => l.tipo === 'foco').length}
          onConcluiu={dados.recarregarXP}
          abrir={acao?.tipo === 'foco'}
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
              <LinhaCompromisso
                key={c.id}
                c={c}
                mostrarData
                tarefa={dados.tarefas.find((t) => t.id === c.task_id)?.titulo}
                onEditar={() => setCompromissoEditando(c)}
              />
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

      {novaTarefa && (
        <TarefaForm
          inicial={novaTarefa}
          projetos={dados.projetos}
          onSalvar={(d) => dados.salvarTarefa(d)}
          onFechar={() => setNovaTarefa(null)}
        />
      )}

      {editando && (
        <TarefaForm
          tarefa={editando}
          projetos={dados.projetos}
          onSalvar={(d) => dados.salvarTarefa(d, editando.id)}
          onExcluir={() => dados.excluirTarefa(editando.id)}
          onFechar={() => setEditando(null)}
          serie={dados.series.find((s) => s.id === editando.series_id)}
        />
      )}

      {recomecando && <Recomecar dados={dados} onFechar={() => setRecomecando(false)} />}

      <OfertaRevisao dados={dados} />

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
          tarefas={dados.tarefas}
          onSalvar={(d) => dados.salvarCompromisso(d, compromissoEditando.id)}
          onExcluir={() => dados.excluirCompromisso(compromissoEditando.id)}
          onFechar={() => setCompromissoEditando(null)}
        />
      )}
    </div>
  )
}
