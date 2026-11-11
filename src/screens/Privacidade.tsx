import type { ReactNode } from 'react'
import { CONTATO_PRIVACIDADE } from '../lib/config'

const ATUALIZADA_EM = '11 de novembro de 2026'

// Política de privacidade em linguagem simples (LGPD). Abre por cima da tela atual.
export function Privacidade({ onFechar }: { onFechar: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Privacidade" className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Privacidade</h1>
            <p className="text-xs text-muted">Atualizada em {ATUALIZADA_EM}</p>
          </div>
          <button onClick={onFechar} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink">
            Fechar
          </button>
        </header>

        <div className="space-y-5 text-sm leading-relaxed text-muted">
          <p className="text-ink">
            Em poucas palavras: o WeUp! guarda só o que precisa para funcionar para você. Não mostra anúncios, não vende
            e não compartilha seus dados, e você pode baixar ou apagar tudo quando quiser.
          </p>

          <Secao titulo="Quem somos">
            O WeUp! é um app de produtividade em fase de testes, feito por uma dupla de desenvolvedores independentes. Para
            qualquer dúvida ou pedido sobre seus dados, escreva para{' '}
            <a href={`mailto:${CONTATO_PRIVACIDADE}`} className="font-semibold text-mint underline-offset-4 hover:underline">
              {CONTATO_PRIVACIDADE}
            </a>
            .
          </Secao>

          <Secao titulo="O que guardamos">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b className="text-ink">Sua conta:</b> e-mail, o nome que você escolheu e a senha (guardada de forma
                criptografada; nem nós conseguimos vê-la).
              </li>
              <li>
                <b className="text-ink">O que você cria:</b> tarefas, projetos, hábitos e os dias em que foram feitos,
                compromissos, sessões de foco e os recomeços (com o motivo que você escolheu).
              </li>
              <li>
                <b className="text-ink">O que o app calcula:</b> XP, nível e o seu companheiro (espécie, nome e estágio).
              </li>
              <li>
                <b className="text-ink">Erros do app:</b> se o app falhar com você logado, guardamos os detalhes
                técnicos da falha (a mensagem do erro, a versão do app e o navegador) para conseguir consertar. Nada do
                que você escreveu vai junto.
              </li>
              <li>
                <b className="text-ink">No seu aparelho:</b> a sessão de login, um ajuste do relógio para o timer de foco
                e os arquivos do app (para abrir rápido e sem internet).
              </li>
            </ul>
          </Secao>

          <Secao titulo="Para que usamos">
            Só para o app funcionar para você: mostrar seu dia, calcular XP e evoluir seu pet. Não usamos rastreadores de
            terceiros, não fazemos propaganda e não vendemos nem repassamos seus dados.
          </Secao>

          <Secao titulo="Onde ficam">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b className="text-ink">Supabase:</b> banco de dados e login (é também quem envia os e-mails de
                confirmação e de senha).
              </li>
              <li>
                <b className="text-ink">Vercel:</b> hospedagem do site do app.
              </li>
              <li>
                <b className="text-ink">Google Fonts:</b> a fonte do app é carregada do Google, que recebe o acesso
                (como acontece em muitos sites).
              </li>
            </ul>
          </Secao>

          <Secao titulo="Quem vê seus dados">
            Só você. O banco tem regras de segurança que impedem uma pessoa de ver os dados de outra. Os responsáveis
            pelo app têm acesso ao painel do banco e só olham dados para resolver problemas técnicos.
          </Secao>

          <Secao titulo="Seus direitos">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b className="text-ink">Ver e levar seus dados:</b> em Perfil → <i>Baixar meus dados</i> você recebe
                tudo num arquivo.
              </li>
              <li>
                <b className="text-ink">Corrigir:</b> edite direto no app (tarefas, hábitos, nome do pet…).
              </li>
              <li>
                <b className="text-ink">Apagar tudo:</b> em Perfil → <i>Excluir minha conta</i>. A conta e todos os
                dados são apagados na hora e não dá para recuperar.
              </li>
              <li>
                <b className="text-ink">Tirar dúvidas ou fazer outros pedidos:</b> pelo e-mail acima.
              </li>
            </ul>
          </Secao>

          <Secao titulo="Um cuidado importante">
            O WeUp! é para a sua rotina. Não registre dados de pacientes nem informações sensíveis de outras pessoas nas
            suas tarefas e hábitos.
          </Secao>

          <Secao titulo="Mudanças">
            Se esta política mudar, avisamos no app. A data no topo mostra a última atualização.
          </Secao>
        </div>

        <button onClick={onFechar} className="mt-8 w-full rounded-2xl bg-brand py-3 font-bold text-bg">
          Entendi
        </button>
      </div>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-base font-bold text-ink">{titulo}</h2>
      {children}
    </section>
  )
}
