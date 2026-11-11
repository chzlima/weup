import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config'

// Lido ANTES de criar o cliente: o Supabase limpa o endereço depois de processar o link do e-mail.
const hashInicial = new URLSearchParams(window.location.hash.slice(1))
// Abriu o app pelo link de "Esqueci minha senha"?
export const veioDoLinkDeSenha = hashInicial.get('type') === 'recovery'
// O link do e-mail venceu ou já foi usado?
export const linkDoEmailInvalido = hashInicial.has('error_code')

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
