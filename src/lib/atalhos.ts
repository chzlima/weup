// Atalhos do ícone do app ("Nova tarefa", "Iniciar foco") e "Compartilhar → WeUp!" (Android).
// Os dois chegam como um endereço com parâmetros (ver "shortcuts" e "share_target" no vite.config.ts).
// O app lê esses parâmetros uma vez, limpa o endereço e a tela Hoje abre o que foi pedido.

export type Acao = { tipo: 'nova-tarefa'; titulo: string } | { tipo: 'foco' }

const CHAVE = 'weup-acao-pendente'

const limpar = (t: string) => t.replace(/\s+/g, ' ').trim().slice(0, 200)

// Lê o pedido no endereço. Compartilhado de outro app vira uma tarefa com o texto como título.
export function lerAcao(search: string): Acao | null {
  const q = new URLSearchParams(search)
  const acao = q.get('acao')
  if (acao === 'foco') return { tipo: 'foco' }
  if (acao === 'nova-tarefa') return { tipo: 'nova-tarefa', titulo: '' }
  // Do navegador costuma vir título + link; do WhatsApp, só o texto. Junta o que vier, sem repetir.
  const partes = [q.get('title'), q.get('text'), q.get('url')]
    .map((x) => limpar(x ?? ''))
    .filter((x, i, todas) => x && todas.indexOf(x) === i)
  if (partes.length) return { tipo: 'nova-tarefa', titulo: limpar(partes.join(' ')) }
  return null
}

// Guardado também na sessão: se a pessoa precisar entrar na conta antes, o pedido não se perde.
let pendente: Acao | null = null
try {
  pendente = lerAcao(window.location.search)
  if (pendente) {
    sessionStorage.setItem(CHAVE, JSON.stringify(pendente))
    // Tira os parâmetros do endereço (o "#" fica: o login por link de e-mail usa ele).
    history.replaceState(null, '', window.location.pathname + window.location.hash)
  } else {
    const salvo = sessionStorage.getItem(CHAVE)
    if (salvo) pendente = JSON.parse(salvo) as Acao
  }
} catch {
  /* sem navegador ou sem armazenamento: segue sem atalho */
}

export const acaoPendente = () => pendente

// Chamado quando a tela Hoje já pegou o pedido: não abre de novo ao trocar de aba.
export function limparAcaoPendente() {
  pendente = null
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    /* nada a fazer */
  }
}
