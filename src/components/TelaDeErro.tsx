import { Component, type ReactNode } from 'react'
import { registrarErro } from '../lib/erros'

// Se uma tela quebrar, em vez de ficar tudo em branco a pessoa vê um aviso e um botão para voltar.
// Os dados não se perdem: tudo o que foi salvo está no banco.
export class TelaDeErro extends Component<{ children: ReactNode }, { quebrou: boolean }> {
  state = { quebrou: false }

  static getDerivedStateFromError() {
    return { quebrou: true }
  }

  componentDidCatch(erro: unknown) {
    void registrarErro('tela', erro)
  }

  render() {
    if (!this.state.quebrou) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-4xl" aria-hidden>
          🌱
        </p>
        <h1 className="text-xl font-bold text-ink">Algo não saiu como esperado</h1>
        <p className="max-w-xs text-sm text-muted">
          O que você já salvou continua guardado. Recarregue o app para continuar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-bg"
        >
          Recarregar
        </button>
      </div>
    )
  }
}
