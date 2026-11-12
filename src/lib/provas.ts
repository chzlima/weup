import { supabase } from './supabase'
import { checar, diasEntre, somarDias, type DadosTarefa, type Tarefa } from './tarefas'

// Modo prova: nome e data da prova + assuntos. O app distribui uma tarefa de estudo por assunto
// de hoje até a antevéspera, deixa a véspera para uma revisão geral e mostra a contagem regressiva.
// As tarefas são comuns (XP normal, sem bônus) e lembram de qual prova vieram (exam_id).

export type Prova = {
  id: string
  titulo: string
  data: string // 'AAAA-MM-DD'
  created_at: string
}

export const MAX_ASSUNTOS = 15

const dataDe = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

// Um assunto por linha (vírgula e ponto e vírgula também separam). Sem repetidos, sem linhas vazias.
export function lerAssuntos(texto: string) {
  const vistos = new Set<string>()
  const lista: string[] = []
  for (const parte of texto.split(/[\n,;]/)) {
    const a = parte.trim().slice(0, 100)
    const chave = a.toLowerCase()
    if (!a || vistos.has(chave)) continue
    vistos.add(chave)
    lista.push(a)
  }
  return lista
}

export type Estudo = { titulo: string; data: string }

// Plano de estudo. Com 2 dias ou mais até a prova, a véspera fica só para a revisão geral;
// os assuntos se espalham por igual nos dias de antes, começando hoje.
export function distribuirEstudo(prova: string, assuntos: string[], hoje: string): Estudo[] {
  const dias = diasEntre(hoje, prova) // dias de estudo: de hoje até a véspera
  if (dias <= 0) throw new Error('A prova precisa ser depois de hoje.')
  if (assuntos.length === 0) throw new Error('Escreva pelo menos um assunto.')
  if (assuntos.length > MAX_ASSUNTOS) throw new Error(`No máximo ${MAX_ASSUNTOS} assuntos por prova.`)
  const comRevisao = dias >= 2
  const diasDeAssunto = comRevisao ? dias - 1 : dias
  const base = dataDe(hoje)
  const plano = assuntos.map((a, i) => ({
    titulo: `Estudar ${a}`,
    data: somarDias(Math.floor((i * diasDeAssunto) / assuntos.length), base),
  }))
  if (comRevisao) plano.push({ titulo: 'Revisão geral', data: somarDias(dias - 1, base) })
  return plano
}

// "Faltam 12 dias", "A prova é amanhã", "A prova é hoje".
export function contagemRegressiva(prova: string, hoje: string) {
  const n = diasEntre(hoje, prova)
  if (n < 0) return 'A prova já passou'
  if (n === 0) return 'A prova é hoje. Boa prova! 🍀'
  if (n === 1) return 'A prova é amanhã'
  return `Faltam ${n} dias`
}

// Provas de hoje em diante, a mais próxima primeiro.
export const proximasProvas = (provas: Prova[], hoje: string) =>
  provas.filter((p) => p.data >= hoje).sort((a, b) => a.data.localeCompare(b.data))

// Quantas tarefas da prova já foram feitas.
export function progressoDaProva(prova: Pick<Prova, 'id'>, tarefas: Tarefa[]) {
  const daProva = tarefas.filter((t) => t.exam_id === prova.id)
  return { feitas: daProva.filter((t) => t.concluida_em).length, total: daProva.length }
}

// ---------- Banco ----------

// Antes de rodar o supabase/ciclo25-provas.sql a tabela não existe: o modo prova só não aparece.
const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /could not find/i.test(e.message))

export async function buscarProvas() {
  const r = await supabase.from('exams').select('*').order('data')
  if (faltaOBanco(r.error)) return { provas: [] as Prova[], disponivel: false }
  return { provas: checar<Prova[]>(r), disponivel: true }
}

// Cria a prova e as tarefas de estudo. Se as tarefas falharem, a prova é desfeita (nada fica pela metade).
export async function criarProva(titulo: string, data: string, assuntos: string[], hoje: string) {
  const plano = distribuirEstudo(data, assuntos, hoje)
  const prova = checar<Prova>(await supabase.from('exams').insert({ titulo, data }).select().single())
  const linhas: (DadosTarefa & { exam_id: string })[] = plano.map((e) => ({
    titulo: `${e.titulo} · ${titulo}`.slice(0, 200),
    dificuldade: 'media',
    categoria: 'estudo',
    project_id: null,
    data: e.data,
    prazo: data,
    exam_id: prova.id,
  }))
  const r = await supabase.from('tasks').insert(linhas).select()
  if (r.error) {
    await supabase.from('exams').delete().eq('id', prova.id)
    checar(r)
  }
  return { prova, tarefas: (r.data ?? []) as Tarefa[] }
}

// Apaga a prova e as tarefas dela que ainda estão abertas. As concluídas ficam (com o XP).
export async function apagarProva(id: string) {
  checar(await supabase.from('tasks').delete().eq('exam_id', id).is('concluida_em', null))
  checar(await supabase.from('exams').delete().eq('id', id))
}
