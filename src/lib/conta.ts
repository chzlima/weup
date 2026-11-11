import { supabase } from './supabase'

// Direitos do titular (LGPD): ver/baixar os próprios dados e apagar a conta.

const TABELAS = [
  'tasks',
  'projects',
  'habits',
  'habit_logs',
  'events',
  'xp_transactions',
  'user_pets',
  'focus_sessions',
  'restarts',
  'app_errors',
] as const

// Junta tudo o que o WeUp! guarda sobre a pessoa num arquivo .json e baixa.
export async function baixarMeusDados() {
  const { data: u } = await supabase.auth.getUser()
  const dados: Record<string, unknown> = {
    exportado_em: new Date().toISOString(),
    conta: {
      email: u.user?.email,
      nome: u.user?.user_metadata?.nome,
      criada_em: u.user?.created_at,
    },
  }
  for (const t of TABELAS) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw new Error(error.message)
    dados[t] = data
  }

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `weup-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const CHAVE_EXCLUIDA = 'weup-conta-excluida'

// Apaga a conta e TODOS os dados (função excluir_minha_conta no banco). Não tem volta.
export async function excluirMinhaConta() {
  const { error } = await supabase.rpc('excluir_minha_conta')
  if (error) throw new Error(error.message)
  try {
    sessionStorage.setItem(CHAVE_EXCLUIDA, '1')
  } catch {
    /* sem armazenamento: só não mostra o aviso */
  }
  await supabase.auth.signOut({ scope: 'local' })
}

// A tela de login usa isto para avisar "sua conta foi apagada" (uma vez só).
export function acabouDeExcluirConta() {
  try {
    const sim = sessionStorage.getItem(CHAVE_EXCLUIDA) === '1'
    sessionStorage.removeItem(CHAVE_EXCLUIDA)
    return sim
  } catch {
    return false
  }
}
