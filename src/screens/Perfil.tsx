import { useEffect, useState, type FormEvent } from 'react'
import { checkServer } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useInstalacao } from '../lib/instalar'
import { baixarMeusDados, excluirMinhaConta } from '../lib/conta'
import { Rotulo, Sheet } from '../components/Sheet'
import { EmBreve } from './EmBreve'
import { Privacidade } from './Privacidade'

type Status = 'testando' | 'ok' | 'erro'

// Seus dados (LGPD): política de privacidade, baixar tudo e excluir a conta.
function SeusDados() {
  const [vendoPrivacidade, setVendoPrivacidade] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')

  const baixar = async () => {
    setBaixando(true)
    setErro('')
    try {
      await baixarMeusDados()
    } catch {
      setErro('Não foi possível baixar agora. Verifique a internet e tente de novo.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Seus dados</p>
      <button
        onClick={() => setVendoPrivacidade(true)}
        className="block w-full rounded-xl py-2 text-left text-sm font-semibold hover:text-mint"
      >
        Como cuidamos dos seus dados →
      </button>
      <button
        onClick={baixar}
        disabled={baixando}
        className="block w-full rounded-xl py-2 text-left text-sm font-semibold hover:text-mint disabled:opacity-60"
      >
        {baixando ? 'Preparando arquivo…' : 'Baixar meus dados (.json)'}
      </button>
      <button
        onClick={() => setExcluindo(true)}
        className="block w-full rounded-xl py-2 text-left text-sm font-semibold text-red-300 hover:text-red-200"
      >
        Excluir minha conta
      </button>
      {erro && <p className="text-sm text-red-300">{erro}</p>}

      {vendoPrivacidade && <Privacidade onFechar={() => setVendoPrivacidade(false)} />}
      {excluindo && <ExcluirConta onFechar={() => setExcluindo(false)} />}
    </section>
  )
}

const PALAVRA = 'EXCLUIR'

function ExcluirConta({ onFechar }: { onFechar: () => void }) {
  const [texto, setTexto] = useState('')
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState('')
  const confirmado = texto.trim().toUpperCase() === PALAVRA

  const apagar = async (e: FormEvent) => {
    e.preventDefault()
    if (!confirmado) return
    setApagando(true)
    setErro('')
    try {
      await excluirMinhaConta()
      // Ao sair, o app volta sozinho para a tela de login (que avisa que a conta foi apagada).
    } catch {
      setErro('Não foi possível excluir agora. Verifique a internet e tente de novo.')
      setApagando(false)
    }
  }

  return (
    <Sheet titulo="Excluir minha conta" onFechar={apagando ? () => {} : onFechar}>
      <form onSubmit={apagar} className="space-y-4">
        <div className="space-y-2 text-sm text-muted">
          <p>
            Isto apaga <b className="text-ink">na hora e para sempre</b> a sua conta e tudo o que está nela: tarefas,
            projetos, hábitos, compromissos, XP, nível, sessões de foco e o seu companheiro.
          </p>
          <p>Não dá para desfazer. Se quiser guardar uma cópia, use antes "Baixar meus dados".</p>
        </div>
        <label className="block">
          <Rotulo>
            Para confirmar, digite <b className="text-ink">{PALAVRA}</b>
          </Rotulo>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-red-400"
          />
        </label>
        {erro && <p className="text-sm text-red-300">{erro}</p>}
        <button
          type="submit"
          disabled={!confirmado || apagando}
          className="w-full rounded-2xl bg-red-500 py-3 font-bold text-white transition-opacity disabled:opacity-40"
        >
          {apagando ? 'Apagando…' : 'Apagar tudo para sempre'}
        </button>
        <button
          type="button"
          onClick={onFechar}
          disabled={apagando}
          className="w-full py-1 text-sm font-semibold text-muted hover:text-ink"
        >
          Cancelar
        </button>
      </form>
    </Sheet>
  )
}

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
      aviso="Notificações e aparência chegam numa próxima versão."
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

      <SeusDados />

      <button
        onClick={clicarSair}
        disabled={saindo}
        className="w-full rounded-2xl border border-line py-3 font-bold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
      >
        {saindo ? 'Saindo…' : 'Sair da conta'}
      </button>

      <p className="text-center text-xs text-muted">
        WeUp! versão {__APP_VERSION__} · {import.meta.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}
      </p>
    </EmBreve>
  )
}
