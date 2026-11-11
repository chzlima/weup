import type { Dados } from '../../lib/useDados'
import { descreverDias, DIAS_SEMANA, type Habito } from '../../lib/habitos'
import { diaDaSemana, hojeISO, nomeCategoria, somarDias } from '../../lib/tarefas'
import { IconCheck, IconMais } from '../../components/Icons'
import { Vazio } from './Vazio'
import { nomeDoDia } from './Agenda'

// Aba Hábitos: cada hábito com os últimos 7 dias (dá para marcar um dia que você esqueceu de registrar).
export function ListaHabitos({ dados, onEditar, onNovo }: { dados: Dados; onEditar: (h: Habito) => void; onNovo: () => void }) {
  if (dados.habitos.length === 0) {
    return (
      <Vazio>
        Hábitos são coisas que se repetem, como <i>"Beber 2 L de água"</i> ou <i>"Revisar flashcards"</i>. Cada dia feito
        vale +10 XP, e pular um dia não tira nada.
        <button onClick={onNovo} className="mt-3 block w-full font-bold text-mint">
          Criar primeiro hábito
        </button>
      </Vazio>
    )
  }

  const ultimos7 = Array.from({ length: 7 }, (_, i) => somarDias(i - 6))

  return (
    <ul className="space-y-3">
      {dados.habitos.map((h) => {
        const feitos = ultimos7.filter((d) => dados.feitoNoDia(h.id, d)).length
        return (
          <li key={h.id} className="rounded-3xl border border-line bg-surface p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{h.titulo}</p>
                <p className="text-xs text-muted">
                  {descreverDias(h.dias)} · {nomeCategoria(h.categoria)} · {feitos}× nos últimos 7 dias
                </p>
              </div>
              <button
                onClick={() => onEditar(h)}
                aria-label={`Editar "${h.titulo}"`}
                className="rounded-xl p-1.5 text-muted hover:text-ink"
              >
                <IconMais className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex justify-between">
              {ultimos7.map((d) => {
                const feito = dados.feitoNoDia(h.id, d)
                const programado = h.dias.includes(diaDaSemana(d))
                const hoje = d === hojeISO()
                return (
                  <button
                    key={d}
                    onClick={() => dados.alternarHabito(h, d)}
                    aria-label={`${feito ? 'Desmarcar' : 'Marcar'} ${h.titulo} em ${nomeDoDia(d)}`}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        feito
                          ? 'border-brand bg-brand text-bg'
                          : programado
                            ? 'border-line'
                            : 'border-dashed border-line/60'
                      }`}
                    >
                      {feito && <IconCheck className="h-4 w-4" />}
                    </span>
                    <span className={`text-[11px] font-bold ${hoje ? 'text-mint' : 'text-muted'}`}>
                      {hoje ? 'Hoje' : DIAS_SEMANA[diaDaSemana(d)]}
                    </span>
                  </button>
                )
              })}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
