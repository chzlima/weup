import { supabase } from './supabase'

// Registro de erros: quando o app quebra no aparelho de alguém, guarda o que aconteceu na tabela app_errors.
// Só detalhes técnicos (mensagem, onde no código, versão, navegador). Só funciona com a pessoa logada.
// Sem serviço de terceiros: fica no mesmo banco do app.

export type OrigemErro = 'erro' | 'promessa' | 'tela'

export type RegistroErro = {
  origem: OrigemErro
  mensagem: string
  detalhe: string | null
  versao: string
  commit: string
  navegador: string | null
}

const MAXIMO_POR_ABERTURA = 5

// Coisas que não são defeito do app: internet caiu, extensão do navegador, aviso inofensivo de layout.
const IGNORAR = [/failed to fetch/i, /networkerror/i, /load failed/i, /resizeobserver loop/i, /^script error\.?$/i, /extension:\/\//i]

export function deveIgnorar(mensagem: string, detalhe?: string | null) {
  return IGNORAR.some((r) => r.test(mensagem) || (!!detalhe && r.test(detalhe)))
}

// Tira do texto qualquer coisa que possa identificar alguém ou dar acesso à conta.
export function limpar(texto: string, maximo: number) {
  return texto
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-mail]')
    .replace(/eyJ[\w-]{10,}\.[\w-]+\.[\w-]+/g, '[chave]')
    .replace(/([?#&](access_token|refresh_token|token|code)=)[^&\s"')]+/gi, '$1[chave]')
    .slice(0, maximo)
}

export function montarRegistro(origem: OrigemErro, erro: unknown, navegador: string | null = null): RegistroErro | null {
  const e = erro instanceof Error ? erro : null
  const mensagem = (e ? `${e.name}: ${e.message}` : String(erro ?? '')).trim()
  const detalhe = e?.stack ?? null
  if (!mensagem || deveIgnorar(mensagem, detalhe)) return null
  return {
    origem,
    mensagem: limpar(mensagem, 500),
    detalhe: detalhe ? limpar(detalhe, 4000) : null,
    versao: __APP_VERSION__,
    commit: import.meta.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    navegador: navegador ? navegador.slice(0, 300) : null,
  }
}

const jaEnviados = new Set<string>()

// Nunca lança erro: se não der para registrar, só desiste.
export async function registrarErro(origem: OrigemErro, erro: unknown) {
  try {
    const registro = montarRegistro(origem, erro, navigator.userAgent)
    if (!registro) return
    if (jaEnviados.has(registro.mensagem) || jaEnviados.size >= MAXIMO_POR_ABERTURA) return
    jaEnviados.add(registro.mensagem)
    if (import.meta.env.DEV) return // rodando no PC: o erro já aparece no console
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    await supabase.from('app_errors').insert(registro)
  } catch {
    /* registrar erro nunca pode causar outro erro */
  }
}

export function escutarErros() {
  window.addEventListener('error', (ev) => void registrarErro('erro', ev.error ?? ev.message))
  window.addEventListener('unhandledrejection', (ev) => void registrarErro('promessa', ev.reason))
}
