import { supabase } from './supabase'

export type Dificuldade = 'pequena' | 'media' | 'complexa'
export type Categoria = 'estudo' | 'treino' | 'rotina'

export type Tarefa = {
  id: string
  titulo: string
  dificuldade: Dificuldade
  categoria: Categoria
  project_id: string | null
  data: string | null // 'AAAA-MM-DD'
  concluida_em: string | null
  created_at: string
  series_id?: string | null // veio de uma tarefa que se repete (ver series.ts)
  ocorrencia?: string | null // de qual dia da série ela é
}

export type Projeto = {
  id: string
  titulo: string
  concluido_em: string | null
  created_at: string
}

export type DadosTarefa = Pick<Tarefa, 'titulo' | 'dificuldade' | 'categoria' | 'project_id' | 'data'>

// XP sugerido no blueprint (ainda só exibido; passa a valer de verdade no Ciclo 5).
export const XP_DIFICULDADE: Record<Dificuldade, number> = { pequena: 5, media: 15, complexa: 30 }
export const XP_ETAPA = 25
export const xpDaTarefa = (t: Pick<Tarefa, 'project_id' | 'dificuldade'>) =>
  t.project_id ? XP_ETAPA : XP_DIFICULDADE[t.dificuldade]

export const DIFICULDADES: { id: Dificuldade; nome: string }[] = [
  { id: 'pequena', nome: 'Pequena' },
  { id: 'media', nome: 'Média' },
  { id: 'complexa', nome: 'Complexa' },
]

// Categoria → atributo (automático, como decidido na V1.1).
export const CATEGORIAS: { id: Categoria; nome: string; atributo: string }[] = [
  { id: 'estudo', nome: 'Estudo', atributo: 'Conhecimento' },
  { id: 'treino', nome: 'Treino', atributo: 'Saúde' },
  { id: 'rotina', nome: 'Rotina', atributo: 'Organização' },
]
export const nomeCategoria = (c: Categoria) => CATEGORIAS.find((x) => x.id === c)?.nome ?? c

// Datas no fuso do celular, no formato que o banco usa (AAAA-MM-DD).
export function diaISO(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const hojeISO = () => diaISO()
export function somarDias(n: number, base = new Date()) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return diaISO(d)
}
export const amanhaISO = () => somarDias(1)
// Dia da semana (0 = domingo … 6 = sábado) de uma data 'AAAA-MM-DD'.
export function diaDaSemana(iso: string) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).getDay()
}
export const concluidaHoje = (t: Tarefa) => !!t.concluida_em && diaISO(new Date(t.concluida_em)) === hojeISO()

// Tarefas abertas e com data: as de hoje e as que ficaram de dias anteriores (as mais antigas primeiro).
export function separarPendentes(tarefas: Tarefa[], hoje = hojeISO()) {
  const abertas = tarefas.filter((t) => !t.concluida_em && t.data)
  return {
    deHoje: abertas.filter((t) => t.data === hoje),
    anteriores: abertas.filter((t) => t.data! < hoje).sort((a, b) => a.data!.localeCompare(b.data!)),
  }
}

// Quantos dias há entre duas datas 'AAAA-MM-DD' (positivo se "ate" vem depois de "de").
export function diasEntre(de: string, ate: string) {
  const dia = (iso: string) => {
    const [a, m, d] = iso.split('-').map(Number)
    return new Date(a, m - 1, d).getTime()
  }
  return Math.round((dia(ate) - dia(de)) / 86_400_000)
}

// De quando é uma tarefa que ficou para trás. Sem cobrança: só informa.
export function descreverAnterior(data: string, hoje = hojeISO()) {
  const n = diasEntre(data, hoje)
  if (n === 1) return 'de ontem'
  if (n < 7) return `de ${n} dias atrás`
  const [a, m, d] = data.split('-').map(Number)
  return `de ${new Date(a, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
}

export function formatarData(iso: string | null) {
  if (!iso) return 'Sem data'
  if (iso === hojeISO()) return 'Hoje'
  if (iso === amanhaISO()) return 'Amanhã'
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// ---------- Acesso ao banco ----------

export function checar<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new Error(mensagemErro(res.error))
  return res.data as T
}

function mensagemErro(e: { message: string; code?: string }) {
  if (e.code === '42P01' || e.code === 'PGRST205' || e.message.includes('Could not find the table'))
    return 'Faltam tabelas no Supabase. Rode os arquivos da pasta supabase/ no SQL Editor.'
  if (e.message.toLowerCase().includes('failed to fetch')) return 'Sem conexão com o servidor. Verifique sua internet.'
  return 'Não foi possível salvar. Tente de novo.'
}

export async function buscarTudo() {
  const [t, p] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at'),
    supabase.from('projects').select('*').order('created_at'),
  ])
  return { tarefas: checar<Tarefa[]>(t), projetos: checar<Projeto[]>(p) }
}

export async function inserirTarefa(dados: DadosTarefa) {
  return checar<Tarefa>(await supabase.from('tasks').insert(dados).select().single())
}

export async function editarTarefa(id: string, mudancas: Partial<Tarefa>) {
  return checar<Tarefa>(await supabase.from('tasks').update(mudancas).eq('id', id).select().single())
}

export async function apagarTarefa(id: string) {
  checar(await supabase.from('tasks').delete().eq('id', id))
}

export async function inserirProjeto(titulo: string) {
  return checar<Projeto>(await supabase.from('projects').insert({ titulo }).select().single())
}

export async function editarProjeto(id: string, mudancas: Partial<Projeto>) {
  return checar<Projeto>(await supabase.from('projects').update(mudancas).eq('id', id).select().single())
}

export async function apagarProjeto(id: string) {
  checar(await supabase.from('projects').delete().eq('id', id))
}
