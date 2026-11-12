import { useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import { Pet } from './components/Pet'
import { useAuth } from './lib/auth'
import { PetProvider, usePet } from './lib/pet'
import { useOnline } from './lib/instalar'
import { Entrar } from './screens/Entrar'
import { NovaSenha } from './screens/NovaSenha'
import { EscolherPet } from './screens/EscolherPet'
import { Hoje } from './screens/Hoje'
import { Planejar } from './screens/Planejar'
import { Evoluir } from './screens/Evoluir'
import { Pets } from './screens/Pets'
import { Perfil } from './screens/Perfil'
import { AvisoPrivacidade } from './components/AvisoPrivacidade'

export default function App() {
  const { session, carregando, recuperandoSenha } = useAuth()
  const online = useOnline()

  const aviso = !online && (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] bg-gold px-4 py-1.5 text-center text-xs font-bold text-bg"
      style={{ paddingTop: 'calc(0.375rem + env(safe-area-inset-top))' }}
    >
      Sem internet. O que você fizer agora pode não ser salvo.
    </div>
  )

  // Enquanto descobre se há alguém logado, mostra só o pet (evita "piscar" a tela de login).
  if (carregando) return <Abertura />
  if (!session)
    return (
      <>
        {aviso}
        <Entrar />
      </>
    )

  // Abriu pelo link de "Esqueci minha senha": primeiro cria a senha nova.
  if (recuperandoSenha)
    return (
      <>
        {aviso}
        <NovaSenha />
      </>
    )

  return (
    <PetProvider>
      {aviso}
      <AppLogado />
    </PetProvider>
  )
}

function AppLogado() {
  const { pet, carregando, erro, escolher, recarregar } = usePet()
  const [tab, setTab] = useState<Tab>('hoje')
  const { modoSimples } = useAuth()

  if (carregando) return <Abertura />

  if (erro) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Pet size={96} />
        <p className="text-sm text-red-300">{erro}</p>
        <button onClick={recarregar} className="rounded-2xl bg-brand px-6 py-3 font-bold text-bg">
          Tentar de novo
        </button>
      </div>
    )
  }

  // Primeiro acesso: escolher o companheiro (no modo simples, não há pet).
  if (!pet && !modoSimples) return <EscolherPet onEscolher={escolher} />

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-6 pb-28">
      {tab === 'hoje' && <AvisoPrivacidade />}
      {tab === 'hoje' && <Hoje />}
      {tab === 'planejar' && <Planejar />}
      {tab === 'evoluir' && <Evoluir />}
      {tab === 'pets' && !modoSimples && <Pets />}
      {tab === 'perfil' && <Perfil />}
      <TabBar active={tab} onChange={setTab} semPets={modoSimples} />
    </div>
  )
}

function Abertura() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse">
        <Pet size={96} />
      </div>
    </div>
  )
}
