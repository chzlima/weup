import { supabase } from './supabase'
import { checar, hojeISO, somarDias } from './tarefas'

// Revisão semanal: os fatos da semana (calculados na hora), uma carta do pet e quatro perguntas opcionais.
// Fatos e interpretação ficam separados: os números são só números; a carta nunca cobra o que faltou.

const dataDe = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

// Segunda-feira da semana de um dia.
export function segundaDaSemana(iso: string) {
  const d = dataDe(iso)
  const dow = d.getDay()
  return somarDias(dow === 0 ? -6 : 1 - dow, d)
}

export const fimDaSemana = (segunda: string) => somarDias(6, dataDe(segunda))

// Qual semana revisar hoje: no domingo, a semana que está terminando; na segunda, a que acabou ontem;
// nos outros dias, a semana atual até agora.
export const semanaRevisada = (hoje = hojeISO()) => segundaDaSemana(somarDias(-1, dataDe(hoje)))

// O lembrete aparece no domingo e na segunda.
export const diaDeRevisar = (hoje = hojeISO()) => [0, 1].includes(dataDe(hoje).getDay())

export function descreverSemana(segunda: string) {
  const ini = dataDe(segunda)
  const fim = dataDe(fimDaSemana(segunda))
  const mes = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return ini.getMonth() === fim.getMonth()
    ? `${ini.getDate()} a ${fim.getDate()} de ${mes(fim)}`
    : `${ini.getDate()} de ${mes(ini)} a ${fim.getDate()} de ${mes(fim)}`
}

export function formatarMinutos(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export type Fatos = {
  tarefas: number
  habitos: number
  sessoesFoco: number
  minutosFoco: number
  xp: number
  diasEnergiaBaixa: number
  recomecos: number
}

const vezes = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
const juntar = (partes: string[]) =>
  partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`

// A carta do pet: só reconhece o que aconteceu e acolhe. Nunca fala do que faltou.
export function cartaDoPet(f: Fatos, nome: string, nomePet: string) {
  const paragrafos = [`Oi, ${nome}!`]
  const feitos = [
    f.tarefas ? vezes(f.tarefas, 'tarefa concluída', 'tarefas concluídas') : '',
    f.habitos ? `hábitos feitos ${vezes(f.habitos, 'vez', 'vezes')}` : '',
    f.minutosFoco ? `${formatarMinutos(f.minutosFoco)} de foco` : '',
  ].filter(Boolean)
  paragrafos.push(
    feitos.length
      ? `Nesta semana você teve ${juntar(feitos)}. Cada uma dessas coisas contou.`
      : 'Esta semana foi mais quieta por aqui, e tudo bem. Descansar também faz parte de evoluir.',
  )
  if (f.diasEnergiaBaixa) paragrafos.push('Teve dia de energia baixa, e você respeitou o seu ritmo. Isso também é cuidado.')
  if (f.recomecos) paragrafos.push(`Você recomeçou ${vezes(f.recomecos, 'vez', 'vezes')}. Voltar é o que importa.`)
  paragrafos.push('Seja como for a próxima semana, estou aqui com você.')
  paragrafos.push(`— ${nomePet}`)
  return paragrafos
}

// ---------- Banco ----------

export type Respostas = { avancou: string; travou: string; muda: string; prioridades: string }

export const PERGUNTAS: { id: keyof Respostas; pergunta: string; exemplo: string }[] = [
  { id: 'avancou', pergunta: 'O que avançou?', exemplo: 'Ex.: terminei o resumo de cardio' },
  { id: 'travou', pergunta: 'O que travou?', exemplo: 'Ex.: não consegui começar farmaco' },
  { id: 'muda', pergunta: 'O que você muda na próxima semana?', exemplo: 'Ex.: estudar de manhã, antes do estágio' },
  { id: 'prioridades', pergunta: 'Prioridades da próxima semana', exemplo: 'Ex.: prova de anatomia, revisar renal' },
]

const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /could not find/i.test(e.message))

// A revisão já feita desta semana (para editar), e se a tabela existe (antes do ciclo18 a revisão não aparece).
export async function buscarRevisao(semana: string) {
  const res = await supabase.from('weekly_reviews').select('avancou, travou, muda, prioridades').eq('semana', semana).maybeSingle()
  if (faltaOBanco(res.error)) return { disponivel: false, revisao: null }
  const linha = checar<Partial<Record<keyof Respostas, string | null>> | null>(res)
  return { disponivel: true, revisao: linha }
}

export async function salvarRevisao(semana: string, r: Respostas) {
  const { data } = await supabase.auth.getSession()
  const user_id = data.session?.user.id
  if (!user_id) throw new Error('Entre de novo para continuar.')
  const limpo = (t: string) => t.trim().slice(0, 1000) || null
  checar(
    await supabase.from('weekly_reviews').upsert(
      {
        user_id,
        semana,
        avancou: limpo(r.avancou),
        travou: limpo(r.travou),
        muda: limpo(r.muda),
        prioridades: limpo(r.prioridades),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,semana' },
    ),
  )
}

// Os números da semana, calculados na hora a partir dos dados (nada disso é guardado à parte).
export async function buscarFatos(segunda: string): Promise<Fatos> {
  const fim = fimDaSemana(segunda)
  const ini = dataDe(segunda).toISOString()
  const depois = dataDe(somarDias(1, dataDe(fim))).toISOString()
  const [t, h, f, e, x, r] = await Promise.all([
    supabase.from('tasks').select('id', { count: 'exact', head: true }).gte('concluida_em', ini).lt('concluida_em', depois),
    supabase.from('habit_logs').select('id', { count: 'exact', head: true }).gte('dia', segunda).lte('dia', fim),
    supabase.from('focus_sessions').select('minutos').gte('concluida_em', ini).lt('concluida_em', depois),
    supabase.from('daily_checkins').select('energia').gte('dia', segunda).lte('dia', fim),
    supabase.from('xp_transactions').select('xp').gte('dia', segunda).lte('dia', fim).is('estornado_em', null),
    supabase.from('restarts').select('id', { count: 'exact', head: true }).gte('created_at', ini).lt('created_at', depois),
  ])
  for (const res of [t, h, f, x, r]) checar(res as { data: unknown; error: { message: string; code?: string } | null })
  const sessoes = (f.data ?? []) as { minutos: number }[]
  const energias = e.error ? [] : ((e.data ?? []) as { energia: string | null }[])
  return {
    tarefas: t.count ?? 0,
    habitos: h.count ?? 0,
    sessoesFoco: sessoes.length,
    minutosFoco: sessoes.reduce((s, x) => s + x.minutos, 0),
    xp: ((x.data ?? []) as { xp: number }[]).reduce((s, l) => s + l.xp, 0),
    diasEnergiaBaixa: energias.filter((x) => x.energia === 'baixa').length,
    recomecos: r.count ?? 0,
  }
}
