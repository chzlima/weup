import { useEffect, useState } from 'react'
import { contarRecomecos } from '../lib/recomecar'
import { useDados } from '../lib/useDados'
import { ATRIBUTOS, NOME_TIPO, calcularNivel, tituloDoNivel, type Lancamento } from '../lib/xp'
import { diaDaSemana, formatarData, hojeISO, somarDias } from '../lib/tarefas'
import { DIAS_SEMANA } from '../lib/habitos'
import { Aviso } from './planejar/Vazio'
import { EntradaRevisao } from '../components/RevisaoSemanal'

const fmt = (n: number) => n.toLocaleString('pt-BR')

export function Evoluir() {
  const dados = useDados()
  const { resumoXP: r, lancamentos } = dados
  const [recomecos, setRecomecos] = useState(0)
  useEffect(() => {
    contarRecomecos().then(setRecomecos).catch(() => {})
  }, [])
  const { nivel, xpNoNivel, xpDoNivel } = calcularNivel(r.total)
  const pct = Math.round((xpNoNivel / xpDoNivel) * 100)

  const ultimos7 = Array.from({ length: 7 }, (_, i) => somarDias(i - 6))
  const xpPorDia = ultimos7.map((dia) => ({
    dia,
    xp: lancamentos.filter((l) => l.dia === dia).reduce((s, l) => s + l.xp, 0),
  }))
  const xpSemana = xpPorDia.reduce((s, d) => s + d.xp, 0)

  const tarefasFeitas = dados.tarefas.filter((t) => t.concluida_em).length
  const habitosSemana = dados.registros.filter((x) => x.dia >= ultimos7[0]).length
  const projetosFeitos = dados.projetos.filter((p) => p.concluido_em).length
  const focoSemana = lancamentos.filter((l) => l.tipo === 'foco' && l.dia >= ultimos7[0]).length

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">Evoluir</h1>
        <p className="text-sm text-muted">Olhe para trás e veja o quanto caminhou.</p>
      </header>

      {dados.erro && <Aviso>{dados.erro}</Aviso>}

      <EntradaRevisao sempre />

      {dados.carregando ? (
        <p className="py-10 text-center text-sm text-muted">Carregando…</p>
      ) : (
        <>
          {/* Nível */}
          <section className="rounded-3xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Nível {nivel} · {tituloDoNivel(nivel)}
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {fmt(r.total)} <span className="text-lg text-gold">XP</span>
            </p>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand/20"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={xpDoNivel}
              aria-valuenow={xpNoNivel}
              aria-label={`Progresso para o nível ${nivel + 1}`}
            >
              <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">
              {fmt(xpDoNivel - xpNoNivel)} XP para o nível {nivel + 1}
            </p>
          </section>

          {/* Números rápidos */}
          <section className="grid grid-cols-2 gap-2">
            <Numero rotulo="XP nos últimos 7 dias" valor={xpSemana} largo />
            <Numero rotulo="Tarefas concluídas" valor={tarefasFeitas} />
            <Numero rotulo="Projetos concluídos" valor={projetosFeitos} />
            <Numero rotulo="Hábitos feitos (7 dias)" valor={habitosSemana} />
            <Numero rotulo="Sessões de foco (7 dias)" valor={focoSemana} />
          </section>

          {recomecos > 0 && (
            <section className="flex items-center gap-3 rounded-3xl border border-brand/40 bg-brand/10 p-4">
              <span className="text-2xl" aria-hidden="true">🌱</span>
              <div>
                <p className="font-bold">
                  {recomecos} {recomecos === 1 ? 'recomeço' : 'recomeços'}
                </p>
                <p className="text-xs text-muted">Cada vez que você retomou o ritmo. Isso também é evolução.</p>
              </div>
            </section>
          )}

          <GraficoSemana dias={xpPorDia} />

          <Atributos resumo={r} />

          <Historico lancamentos={lancamentos} />
        </>
      )}
    </div>
  )
}

function Numero({ rotulo, valor, largo }: { rotulo: string; valor: number; largo?: boolean }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-4 ${largo ? 'col-span-2' : ''}`}>
      <p className="text-xs text-muted">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold">{fmt(valor)}</p>
    </div>
  )
}

// Colunas de XP por dia (uma série só, então sem legenda; o título diz o que é).
function GraficoSemana({ dias }: { dias: { dia: string; xp: number }[] }) {
  const [foco, setFoco] = useState<string | null>(null)
  const max = Math.max(...dias.map((d) => d.xp), 1)
  const maior = dias.reduce((a, b) => (b.xp > a.xp ? b : a), dias[0])
  const ALTURA = 120

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-sm font-bold">XP por dia</h2>
      <p className="text-xs text-muted">Últimos 7 dias</p>

      <div className="relative mt-4" style={{ height: ALTURA + 24 }}>
        <div className="absolute inset-x-0 border-t border-line" style={{ top: ALTURA }} />
        <div className="absolute inset-x-0 top-0 flex" style={{ height: ALTURA }}>
          {dias.map((d) => {
            const h = d.xp ? Math.max(4, Math.round((d.xp / max) * (ALTURA - 20))) : 0
            const ativo = foco === d.dia
            const mostrarValor = ativo || (d === maior && d.xp > 0 && !foco)
            const nome = d.dia === hojeISO() ? 'Hoje' : formatarData(d.dia)
            return (
              <button
                key={d.dia}
                type="button"
                onMouseEnter={() => setFoco(d.dia)}
                onMouseLeave={() => setFoco(null)}
                onFocus={() => setFoco(d.dia)}
                onBlur={() => setFoco(null)}
                onClick={() => setFoco((f) => (f === d.dia ? null : d.dia))}
                aria-label={`${nome}: ${d.xp} XP`}
                className="relative flex h-full flex-1 flex-col items-center justify-end outline-none"
              >
                {mostrarValor && <span className="mb-1 text-xs font-bold text-ink">{d.xp}</span>}
                <span
                  className={`w-full max-w-6 rounded-t transition-all ${ativo ? 'bg-mint' : 'bg-brand'}`}
                  style={{ height: h }}
                />
              </button>
            )
          })}
        </div>
        <div className="absolute inset-x-0 flex" style={{ top: ALTURA + 6 }}>
          {dias.map((d) => (
            <span
              key={d.dia}
              className={`flex-1 text-center text-[11px] font-bold ${d.dia === hojeISO() ? 'text-ink' : 'text-muted'}`}
            >
              {d.dia === hojeISO() ? 'Hoje' : DIAS_SEMANA[diaDaSemana(d.dia)]}
            </span>
          ))}
        </div>
      </div>

      {/* Mesmos dados em tabela, para leitores de tela */}
      <table className="sr-only">
        <caption>XP por dia nos últimos 7 dias</caption>
        <tbody>
          {dias.map((d) => (
            <tr key={d.dia}>
              <th scope="row">{formatarData(d.dia)}</th>
              <td>{d.xp} XP</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// XP acumulado por atributo (barras horizontais; o radar chega na Etapa 2).
function Atributos({ resumo }: { resumo: Record<string, number> }) {
  const max = Math.max(...ATRIBUTOS.map((a) => resumo[a.id]), 1)
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-sm font-bold">Atributos</h2>
      <p className="text-xs text-muted">Vêm da categoria: Estudo → Conhecimento, Treino → Saúde, Rotina → Organização</p>
      <ul className="mt-4 space-y-3">
        {ATRIBUTOS.map((a) => (
          <li key={a.id}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold">{a.nome}</span>
              <span className="text-muted">{fmt(resumo[a.id])} XP</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{ width: `${(resumo[a.id] / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Historico({ lancamentos }: { lancamentos: Lancamento[] }) {
  if (lancamentos.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
        Conclua uma tarefa ou um hábito para ganhar seu primeiro XP.
      </p>
    )
  }
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-muted">Últimos ganhos</h2>
      <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
        {lancamentos.slice(0, 15).map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{l.descricao}</span>
              <span className="block text-xs text-muted">
                {NOME_TIPO[l.tipo]} · {formatarData(l.dia)}
              </span>
            </span>
            {l.limitado ? (
              <span className="shrink-0 text-right text-xs text-muted">
                0 XP
                <span className="block">limite do dia</span>
              </span>
            ) : (
              <span className="shrink-0 text-sm font-bold text-gold">+{l.xp}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
