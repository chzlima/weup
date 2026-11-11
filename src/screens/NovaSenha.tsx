import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { traduzErro, useAuth } from '../lib/auth'
import { Campo, Moldura } from './Entrar'

// Aparece quando a pessoa abre o link de "Esqueci minha senha" que chegou por e-mail.
export function NovaSenha() {
  const { user, terminarRecuperacao } = useAuth()
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [pronto, setPronto] = useState(false)

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== repetir) return setErro('As duas senhas não são iguais.')
    setSalvando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) return setErro(traduzErro(error.message))
      setPronto(true)
    } catch (err) {
      setErro(traduzErro(err instanceof Error ? err.message : String(err)))
    } finally {
      setSalvando(false)
    }
  }

  if (pronto) {
    return (
      <Moldura>
        <div className="space-y-4 rounded-3xl border border-line bg-surface p-6 text-center">
          <h2 className="text-xl font-extrabold">Senha nova salva!</h2>
          <p className="text-sm text-muted">Da próxima vez, entre com ela.</p>
          <button onClick={terminarRecuperacao} className="w-full rounded-2xl bg-brand py-3 font-bold text-bg">
            Continuar
          </button>
        </div>
      </Moldura>
    )
  }

  return (
    <Moldura>
      <form onSubmit={salvar} className="space-y-3 rounded-3xl border border-line bg-surface p-5" noValidate>
        <h2 className="text-lg font-extrabold">Criar senha nova</h2>
        {user?.email && (
          <p className="text-sm text-muted">
            Para a conta <span className="font-semibold text-ink">{user.email}</span>.
          </p>
        )}
        <Campo
          label="Senha nova"
          type="password"
          value={senha}
          onChange={setSenha}
          autoComplete="new-password"
          dica="Mínimo de 6 caracteres."
        />
        <Campo label="Repita a senha nova" type="password" value={repetir} onChange={setRepetir} autoComplete="new-password" />
        {erro && (
          <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="w-full rounded-2xl bg-brand py-3 font-bold text-bg transition-opacity disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : 'Salvar senha nova'}
        </button>
        <button
          type="button"
          onClick={terminarRecuperacao}
          className="w-full py-1 text-center text-sm font-semibold text-muted hover:text-ink"
        >
          Agora não
        </button>
      </form>
    </Moldura>
  )
}
