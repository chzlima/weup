import { supabase } from './supabase'
import { checar, somarDias } from './tarefas'

// O XP é registrado pelo banco (ver supabase/ciclo5.sql). Aqui o app só lê e calcula o nível.

export type TipoXP = 'tarefa_pequena' | 'tarefa_media' | 'tarefa_complexa' | 'etapa' | 'habito' | 'projeto' | 'foco'
export type Atributo = 'conhecimento' | 'saude' | 'organizacao'

export type Lancamento = {
  id: string
  tipo: TipoXP
  descricao: string
  atributo: Atributo | null
  dia: string
  xp: number
  limitado: boolean
  created_at: string
}

export type ResumoXP = { total: number; conhecimento: number; saude: number; organizacao: number }

export const RESUMO_VAZIO: ResumoXP = { total: 0, conhecimento: 0, saude: 0, organizacao: 0 }

export const NOME_TIPO: Record<TipoXP, string> = {
  tarefa_pequena: 'Tarefa pequena',
  tarefa_media: 'Tarefa média',
  tarefa_complexa: 'Tarefa complexa',
  etapa: 'Etapa de projeto',
  habito: 'Hábito',
  projeto: 'Projeto concluído',
  foco: 'Sessão de foco',
}

export const ATRIBUTOS: { id: Atributo; nome: string }[] = [
  { id: 'conhecimento', nome: 'Conhecimento' },
  { id: 'saude', nome: 'Saúde' },
  { id: 'organizacao', nome: 'Organização' },
]

// ---------- Níveis ----------
// Curva progressiva: os primeiros níveis chegam rápido; depois cada nível pede mais XP.
// XP para sair do nível n = 30 · n^1,5 (arredondado de 5 em 5): 30, 85, 155, 240, 335, …, 950 no nível 10.
export function xpParaSubir(nivel: number) {
  return Math.round((30 * Math.pow(nivel, 1.5)) / 5) * 5
}

export function calcularNivel(total: number) {
  let nivel = 1
  let resto = total
  while (resto >= xpParaSubir(nivel)) {
    resto -= xpParaSubir(nivel)
    nivel++
  }
  return { nivel, xpNoNivel: resto, xpDoNivel: xpParaSubir(nivel) }
}

// XP total necessário para chegar a um nível.
export function xpTotalDoNivel(nivel: number) {
  let total = 0
  for (let n = 1; n < nivel; n++) total += xpParaSubir(n)
  return total
}

export function tituloDoNivel(nivel: number) {
  if (nivel >= 50) return 'Mestre'
  if (nivel >= 35) return 'Experiente'
  if (nivel >= 20) return 'Persistente'
  if (nivel >= 10) return 'Dedicado'
  if (nivel >= 5) return 'Aprendiz'
  return 'Iniciante'
}

// ---------- Regras (vêm do banco: tabela xp_regras) ----------
// Quanto vale cada ação e quantas valem por dia. O app só mostra; quem aplica é o banco (conceder_xp).

export type Regra = { tipo: TipoXP; nome: string; xp: number; limite_dia: number; versao: number }

// Quantas ações deste tipo já valeram XP hoje (desfeitas não contam; as que passaram do limite também não).
export const usadasNoDia = (lancamentos: Lancamento[], tipo: TipoXP, dia: string) =>
  lancamentos.filter((l) => l.tipo === tipo && l.dia === dia && !l.limitado).length

// Texto curto do estado da regra hoje: "3 de 10 hoje" ou "limite de hoje atingido".
export function estadoDaRegra(r: Pick<Regra, 'limite_dia'>, usadas: number) {
  if (usadas >= r.limite_dia) return 'limite de hoje atingido'
  return `${usadas} de ${r.limite_dia} hoje`
}

// ---------- Banco ----------

export const DIAS_HISTORICO = 30

// Antes de rodar o supabase/ciclo28-xp-regras.sql a tabela não existe: a explicação só não aparece.
export async function buscarRegras(): Promise<Regra[]> {
  const r = await supabase.from('xp_regras').select('tipo, nome, xp, limite_dia, versao').order('xp')
  if (r.error) return []
  return r.data as Regra[]
}

export async function buscarXP() {
  const [r, l] = await Promise.all([
    supabase.from('xp_resumo').select('total, conhecimento, saude, organizacao').maybeSingle(),
    supabase
      .from('xp_transactions')
      .select('id, tipo, descricao, atributo, dia, xp, limitado, created_at')
      .is('estornado_em', null)
      .gte('dia', somarDias(-(DIAS_HISTORICO - 1)))
      .order('created_at', { ascending: false }),
  ])
  return {
    resumo: checar<ResumoXP | null>(r) ?? RESUMO_VAZIO,
    lancamentos: checar<Lancamento[]>(l),
  }
}
