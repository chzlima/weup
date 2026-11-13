// WeUp! · Função "enviar-lembretes" (Supabase Edge Function)
// Chamada a cada minuto pelo agendamento (supabase/ciclo27-push.sql). Pega os lembretes que acabaram de chegar,
// anota cada um em push_enviados (para nunca mandar duas vezes) e envia para os aparelhos inscritos da pessoa.
//
// Chaves das notificações (VAPID): na primeira vez, a própria função gera o par e guarda em push_chaves
// (tabela que só o servidor lê). Ninguém copia nem cola a chave privada.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos no ambiente da função.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

type Devido = { user_id: string; chave: string; titulo: string; detalhe: string }
type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string }

type Chaves = { publica: string; privada: string }

// Lê as chaves; se ainda não existem, cria. Se duas chamadas criarem juntas, vale a primeira gravada.
async function chaves(db: ReturnType<typeof createClient>): Promise<Chaves> {
  const lidas = await db.from('push_chaves').select('publica, privada').eq('id', 1).maybeSingle()
  if (lidas.data) return lidas.data as Chaves
  const novas = webpush.generateVAPIDKeys()
  await db.from('push_chaves').upsert({ id: 1, publica: novas.publicKey, privada: novas.privateKey }, { onConflict: 'id', ignoreDuplicates: true })
  const gravadas = await db.from('push_chaves').select('publica, privada').eq('id', 1).single()
  if (gravadas.error) throw new Error(gravadas.error.message)
  return gravadas.data as Chaves
}

Deno.serve(async () => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  let par: Chaves
  try {
    par = await chaves(db)
  } catch (e) {
    return Response.json({ erro: (e as Error).message }, { status: 500 })
  }
  webpush.setVapidDetails('https://weup-rose.vercel.app', par.publica, par.privada)

  const { data: devidos, error } = await db.rpc('lembretes_devidos')
  if (error) return Response.json({ erro: error.message }, { status: 500 })

  let enviados = 0
  for (const l of (devidos ?? []) as Devido[]) {
    // Anota antes de enviar: se outra chamada chegar junto, só uma consegue anotar e só ela envia.
    const anotou = await db.from('push_enviados').insert({ chave: l.chave, user_id: l.user_id }).select('chave')
    if (anotou.error || !anotou.data?.length) continue

    const { data: inscricoes } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', l.user_id)
    const corpo = JSON.stringify({ titulo: l.titulo, detalhe: l.detalhe, tag: l.chave })
    for (const i of (inscricoes ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, corpo, { TTL: 900 })
        enviados++
      } catch (e) {
        // 404/410: o aparelho cancelou a inscrição (desinstalou, limpou dados). Remove para não tentar de novo.
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('id', i.id)
      }
    }
  }

  // Limpeza: o registro de envios só precisa dos últimos 2 dias.
  await db.from('push_enviados').delete().lt('enviado_em', new Date(Date.now() - 2 * 86_400_000).toISOString())

  return Response.json({ devidos: devidos?.length ?? 0, enviados })
})
