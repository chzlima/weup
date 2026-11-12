import { supabase } from './supabase'
import { checar, diaISO, somarDias, type Categoria, type Dificuldade } from './tarefas'

// Tarefas que se repetem. A série guarda a REGRA; no dia em que ela cai, o banco cria uma tarefa comum
// (função gerar_ocorrencias). Editar ou apagar essa tarefa não mexe na série.

export type TipoSerie = 'diaria' | 'semanal' | 'mensal'

export type Regra = {
  tipo: TipoSerie
  dias: number[] | null // semanal: 0 = domingo … 6 = sábado
  dia_mes: number | null // mensal: 1 a 31 (31 num mês menor cai no último dia)
}

export type Serie = Regra & {
  id: string
  titulo: string
  dificuldade: Dificuldade
  categoria: Categoria
  inicio: string
  gerado_ate: string | null
  created_at: string
}

export type DadosSerie = Pick<Serie, 'titulo' | 'dificuldade' | 'categoria'> & Regra

export const TIPOS_SERIE: { id: TipoSerie; nome: string }[] = [
  { id: 'diaria', nome: 'Todo dia' },
  { id: 'semanal', nome: 'Na semana' },
  { id: 'mensal', nome: 'No mês' },
]

const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const dataDe = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

// A regra cai neste dia? (Mesma conta da função serie_cai_em do banco.)
export function serieCaiEm(r: Regra, iso: string) {
  const d = dataDe(iso)
  if (r.tipo === 'diaria') return true
  if (r.tipo === 'semanal') return (r.dias ?? []).includes(d.getDay())
  const ultimoDiaDoMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return d.getDate() === Math.min(r.dia_mes ?? 0, ultimoDiaDoMes)
}

// Próximo dia em que a regra cai, a partir de "desde" (inclusive). Usado para mostrar "próxima: …".
export function proximaOcorrencia(r: Regra, desde = diaISO()) {
  const base = dataDe(desde)
  for (let i = 0; i < 400; i++) {
    const dia = somarDias(i, base)
    if (serieCaiEm(r, dia)) return dia
  }
  return null
}

// Todos os dias em que a regra cai dentro de um intervalo (inclusive). Base para o calendário.
export function ocorrenciasEntre(r: Regra, de: string, ate: string) {
  const dias: string[] = []
  const base = dataDe(de)
  for (let i = 0; i < 400; i++) {
    const dia = somarDias(i, base)
    if (dia > ate) break
    if (serieCaiEm(r, dia)) dias.push(dia)
  }
  return dias
}

export function descreverRegra(r: Regra) {
  if (r.tipo === 'diaria') return 'Todo dia'
  if (r.tipo === 'mensal') return `Todo dia ${r.dia_mes} do mês`
  const d = [...(r.dias ?? [])].sort()
  if (d.length === 7) return 'Todo dia'
  if (d.join() === '1,2,3,4,5') return 'Dias úteis'
  if (d.join() === '0,6') return 'Fins de semana'
  return `Toda ${d.map((i) => NOMES_DIAS[i]).join(', ')}`
}

// Confere a regra antes de salvar. Devolve a mensagem de erro, ou '' se está tudo certo.
export function validarRegra(r: Regra) {
  if (r.tipo === 'semanal' && !(r.dias ?? []).length) return 'Escolha pelo menos um dia da semana.'
  if (r.tipo === 'mensal' && !(Number.isInteger(r.dia_mes) && r.dia_mes! >= 1 && r.dia_mes! <= 31))
    return 'Escolha um dia do mês entre 1 e 31.'
  return ''
}

// Guarda só os campos que fazem sentido para o tipo escolhido.
export const limparRegra = (r: Regra): Regra => ({
  tipo: r.tipo,
  dias: r.tipo === 'semanal' ? [...(r.dias ?? [])].sort() : null,
  dia_mes: r.tipo === 'mensal' ? r.dia_mes : null,
})

// ---------- Banco ----------

// Antes de rodar o supabase/ciclo12-recorrencia.sql a tabela não existe: o app segue funcionando sem repetições.
const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || e.code === 'PGRST202' || /could not find/i.test(e.message))

export async function buscarSeries() {
  const res = await supabase.from('task_series').select('*').order('created_at')
  if (faltaOBanco(res.error)) return { series: [] as Serie[], disponivel: false }
  return { series: checar<Serie[]>(res), disponivel: true }
}

// Pede ao banco para criar as tarefas de hoje. Chamado toda vez que os dados são carregados.
export async function gerarOcorrencias() {
  const res = await supabase.rpc('gerar_ocorrencias')
  if (faltaOBanco(res.error)) return 0
  return checar<number>(res)
}

export async function inserirSerie(dados: DadosSerie) {
  return checar<Serie>(
    await supabase.from('task_series').insert({ ...dados, ...limparRegra(dados) }).select().single(),
  )
}

// Mudar a série vale para as próximas tarefas; as que já foram criadas ficam como estão.
// "gerado_ate: null" faz o banco conferir hoje de novo com a regra nova.
export async function editarSerie(id: string, dados: DadosSerie) {
  return checar<Serie>(
    await supabase
      .from('task_series')
      .update({ ...dados, ...limparRegra(dados), gerado_ate: null })
      .eq('id', id)
      .select()
      .single(),
  )
}

// Parar de repetir: a série some, as tarefas que já existem ficam.
export async function apagarSerie(id: string) {
  checar(await supabase.from('task_series').delete().eq('id', id))
}
