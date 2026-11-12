import { useEffect, useState, type FormEvent } from 'react'
import { checkServer } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useInstalacao } from '../lib/instalar'
import { baixarMeusDados, excluirMinhaConta } from '../lib/conta'
import { avisoDoSistemaSuportado, pedirAvisoDoSistema } from '../lib/lembretes'
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
      aviso="Notificações com o app fechado e aparência chegam numa próxima versão."
    >
      <section className="space-y-1 rounded-2xl border border-line bg-surface px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sua conta</p>
        <p className="font-bold">{nome}</p>
        <p className="text-sm text-muted">{user?.email}</p>
      </section>

      <ModoSimples />

      <AvisosDoSistema />

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

// Lembretes como aviso do sistema. Nesta versão só chegam com o app aberto (mesmo em outra aba ou minimizado);
// com o app fechado, vêm na próxima parte (notificações push).
function AvisosDoSistema() {
  const suportado = avisoDoSistemaSuportado()
  const [permissao, setPermissao] = useState<string>(suportado ? Notification.permission : 'unsupported')

  const pedir = async () => setPermissao(await pedirAvisoDoSistema())

  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="font-bold">Avisos dos lembretes</p>
      <p className="text-xs text-muted">
        Os lembretes de tarefas e compromissos aparecem na tela Hoje. Permitindo, também chegam como aviso do sistema
        enquanto o app estiver aberto.
      </p>
      {permissao === 'granted' ? (
        <p className="mt-2 text-sm font-semibold text-mint">Avisos do sistema ligados ✓</p>
      ) : permissao === 'denied' ? (
        <p className="mt-2 text-sm text-muted">
          Os avisos foram bloqueados neste aparelho. Para ligar, libere as notificações do WeUp! nas configurações do navegador.
        </p>
      ) : permissao === 'unsupported' ? (
        <p className="mt-2 text-sm text-muted">Este navegador não mostra avisos do sistema. Os lembretes continuam na tela Hoje.</p>
      ) : (
        <button onClick={pedir} className="mt-2 rounded-xl border border-line px-3 py-2 text-sm font-bold text-mint">
          Permitir avisos do sistema
        </button>
      )}
    </section>
  )
}

// Gamificação opcional: no modo simples o app fica só de produtividade (sem pet, XP nem comemorações).
// Nada é apagado: o XP continua contando por baixo e o pet continua lá para quando desligar.
function ModoSimples() {
  const { modoSimples, definirModoSimples } = useAuth()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const alternar = async () => {
    setSalvando(true)
    setErro('')
    try {
      await definirModoSimples(!modoSimples)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold">Modo simples</p>
          <p className="text-xs text-muted">
            Esconde o pet, o XP e as comemorações. Nada é apagado: desligue quando quiser e tudo volta.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={modoSimples}
          aria-label="Modo simples"
          onClick={alternar}
          disabled={salvando}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${modoSimples ? 'bg-brand' : 'bg-surface-2'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-ink transition-all ${modoSimples ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      {erro && <p className="mt-2 text-sm text-red-300">{erro}</p>}
    </section>
  )
}
