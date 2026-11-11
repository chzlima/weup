import { useEffect, useState } from 'react'
import { checkServer } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useInstalacao } from '../lib/instalar'
import { EmBreve } from './EmBreve'

type Status = 'testando' | 'ok' | 'erro'

// Instalar o app na tela inicial do celular.
function InstalarApp() {
  const { instalado, podeInstalar, iphone, instalar } = useInstalacao()

  return (
    <section className="space-y-2 rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">App no celular</p>
      {instalado ? (
        <p className="text-sm">
          <span className="font-bold text-mint">✓ Instalado.</span> Você está usando o WeUp! como app.
        </p>
      ) : podeInstalar ? (
        <>
          <p className="text-sm text-muted">Coloque o WeUp! na tela inicial: abre em tela cheia e mais rápido.</p>
          <button onClick={instalar} className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-bg">
            Instalar o WeUp!
          </button>
        </>
      ) : iphone ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>
            Abra este site no <b className="text-ink">Safari</b>.
          </li>
          <li>
            Toque em <b className="text-ink">Compartilhar</b> (o quadrado com a seta para cima).
          </li>
          <li>
            Escolha <b className="text-ink">Adicionar à Tela de Início</b>.
          </li>
        </ol>
      ) : (
        <p className="text-sm text-muted">
          No menu do navegador (⋮), escolha <b className="text-ink">Instalar app</b> ou{' '}
          <b className="text-ink">Adicionar à tela inicial</b>.
        </p>
      )}
    </section>
  )
}

export function Perfil() {
  const { user, nome, sair } = useAuth()
  const [status, setStatus] = useState<Status>('testando')
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    checkServer().then((ok) => setStatus(ok ? 'ok' : 'erro'))
  }, [])

  const info = {
    testando: { cor: 'bg-gold', texto: 'Testando conexão…' },
    ok: { cor: 'bg-brand', texto: 'Conectado ao servidor' },
    erro: { cor: 'bg-red-500', texto: 'Sem conexão com o servidor' },
  }[status]

  const clicarSair = async () => {
    setSaindo(true)
    await sair()
  }

  return (
    <EmBreve
      title="Perfil"
      desc="Conta, preferências e privacidade."
      aviso="Notificações, aparência e privacidade chegam numa próxima versão."
    >
      <section className="space-y-1 rounded-2xl border border-line bg-surface px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sua conta</p>
        <p className="font-bold">{nome}</p>
        <p className="text-sm text-muted">{user?.email}</p>
      </section>

      <InstalarApp />

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span className={`h-2.5 w-2.5 rounded-full ${info.cor}`} />
        <span className="text-sm font-semibold">{info.texto}</span>
      </div>

      <button
        onClick={clicarSair}
        disabled={saindo}
        className="w-full rounded-2xl border border-line py-3 font-bold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
      >
        {saindo ? 'Saindo…' : 'Sair da conta'}
      </button>
    </EmBreve>
  )
}
