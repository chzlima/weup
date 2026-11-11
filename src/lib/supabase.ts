import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config'

// Cliente único do Supabase, usado pelo app inteiro.
// A sessão de login fica salva no navegador, então o usuário continua logado ao reabrir o app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// Testa se o servidor do Supabase está respondendo.
export async function checkServer(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    })
    return res.ok
  } catch {
    return false
  }
}
