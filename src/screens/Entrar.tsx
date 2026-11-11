import { useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { traduzErro } from '../lib/auth'
import { Pet } from '../components/Pet'

type Modo = 'entrar' | 'cadastrar' | 'confirmar'

// Tela de entrada: login e cadastro com e-mail e senha.
export function Entrar() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cadastro = modo === 'cadastrar'

  const trocarModo = (novo: Modo) => {
    setModo(novo)
    setErro('')
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')

    if (cadastro && nome.trim().length < 2) return setErro('Diga como você quer ser chamado.')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')

    setEnviando(true)
    try {
      if (cadastro) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() }, emailRedirectTo: window.location.origin },
        })
        if (error) return setErro(traduzErro(error.message))
        // Sem sessão = o Supabase pediu confirmação por e-mail.
        if (!data.session) setModo('confirmar')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) return setErro(traduzErro(error.message))
      }
      // Se deu certo, o AuthProvider percebe a nova sessão e abre o app sozinho.
    } catch (err) {
      setErro(traduzErro(err instanceof Error ? err.message : String(err)))
    } finally {
      setEnviando(false)
    }
  }

  if (modo === 'confirmar') {
    return (
      <Moldura>
        <div className="space-y-4 rounded-3xl border border-line bg-surface p-6 text-center">
          <h2 className="text-xl font-extrabold">Confira seu e-mail</h2>
          <p className="text-sm text-muted">
            Mandamos um link de confirmação para <span className="font-semibold text-ink">{email.trim()}</span>.
            Abra o link e depois volte aqui para entrar.
          </p>
          <button onClick={() => trocarModo('entrar')} className="w-full rounded-2xl bg-brand py-3 font-bold text-bg">
            Ir para o login
          </button>
        </div>
      </Moldura>
    )
  }

  return (
    <Moldura>
      <form onSubmit={enviar} className="space-y-3 rounded-3xl border border-line bg-surface p-5" noValidate>
        <h2 className="text-lg font-extrabold">{cadastro ? 'Criar sua conta' : 'Entrar'}</h2>

        {cadastro && (
          <Campo label="Como quer ser chamado?" value={nome} onChange={setNome} autoComplete="given-name" />
        )}
        <Campo label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Campo
          label="Senha"
          type="password"
          value={senha}
          onChange={setSenha}
          autoComplete={cadastro ? 'new-password' : 'current-password'}
          dica={cadastro ? 'Mínimo de 6 caracteres.' : undefined}
        />

        {erro && (
          <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-2xl bg-brand py-3 font-bold text-bg transition-opacity disabled:opacity-60"
        >
          {enviando ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {cadastro ? 'Já tem conta? ' : 'Ainda não tem conta? '}
        <button
          type="button"
          onClick={() => trocarModo(cadastro ? 'entrar' : 'cadastrar')}
          className="font-bold text-mint underline-offset-4 hover:underline"
        >
          {cadastro ? 'Entrar' : 'Criar conta'}
        </button>
      </p>
    </Moldura>
  )
}

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <Pet size={96} />
        <h1 className="mt-2 text-3xl font-extrabold">
          WeUp<span className="text-brand">!</span>
        </h1>
        <p className="text-sm text-muted">Evolua no seu ritmo.</p>
      </div>
      {children}
    </div>
  )
}

function Campo(props: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  dica?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{props.label}</span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required
        className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-ink outline-none transition-colors focus:border-brand"
      />
      {props.dica && <span className="mt-1 block text-xs text-muted">{props.dica}</span>}
    </label>
  )
}
