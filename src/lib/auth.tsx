import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, veioDoLinkDeSenha } from './supabase'

type AuthState = {
  session: Session | null
  user: User | null
  carregando: boolean
  nome: string
  sair: () => Promise<void>
  // true quando a pessoa abriu o link de "Esqueci minha senha" e precisa criar a senha nova.
  recuperandoSenha: boolean
  terminarRecuperacao: () => void
}

const AuthContext = createContext<AuthState | null>(null)

// Guarda quem está logado e avisa o app inteiro quando isso muda.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperandoSenha, setRecuperandoSenha] = useState(veioDoLinkDeSenha)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((evento, nova) => {
      setSession(nova)
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null
  const nome = (user?.user_metadata?.nome as string | undefined)?.trim() || user?.email?.split('@')[0] || ''

  const sair = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        carregando,
        nome,
        sair,
        recuperandoSenha,
        terminarRecuperacao: () => setRecuperandoSenha(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

// Traduz as mensagens de erro do Supabase para português.
export function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('user already registered')) return 'Já existe uma conta com este e-mail. Tente entrar.'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('different from the old password')) return 'A senha nova precisa ser diferente da antiga.'
  if (m.includes('auth session missing') || m.includes('session_not_found'))
    return 'O link expirou. Peça um novo em "Esqueci minha senha".'
  if (m.includes('unable to validate email') || m.includes('invalid format') || m.includes('is invalid'))
    return 'Este e-mail não parece válido.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas seguidas. Espere um pouco e tente de novo.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com o servidor. Verifique sua internet.'
  return 'Algo deu errado. Tente novamente.'
}
