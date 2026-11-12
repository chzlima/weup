// Versão da política de privacidade. A política promete: "se mudar, avisamos no app".
// SEMPRE que o texto de src/screens/Privacidade.tsx mudar, atualize as duas linhas abaixo:
// quem criou a conta antes dessa data vê o aviso uma vez em cada aparelho.
export const POLITICA_VERSAO = '2026-11-12T23:59:00-03:00'
export const POLITICA_ATUALIZADA_EM = '12 de novembro de 2026'

const CHAVE = 'weup-politica-vista'

// Avisa só quem já tinha conta quando a política mudou e ainda não viu esta versão neste aparelho.
export function deveAvisarPolitica(contaCriadaEm: string | undefined, versaoVista: string | null) {
  if (!contaCriadaEm || versaoVista === POLITICA_VERSAO) return false
  return new Date(contaCriadaEm).getTime() < new Date(POLITICA_VERSAO).getTime()
}

export function versaoVistaDaPolitica() {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return POLITICA_VERSAO // sem armazenamento não dá para lembrar: melhor não avisar do que avisar toda vez
  }
}

export function marcarPoliticaVista() {
  try {
    localStorage.setItem(CHAVE, POLITICA_VERSAO)
  } catch {
    /* sem armazenamento: o aviso some até o app ser reaberto */
  }
}
