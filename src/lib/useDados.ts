import { useCallback, useEffect, useState } from 'react'
import * as db from './tarefas'
import * as hb from './habitos'
import * as ag from './agenda'
import * as xp from './xp'
import * as sr from './series'
import type { DadosSerie, Serie } from './series'
import type { DadosTarefa, Projeto, Tarefa } from './tarefas'
import type { Lancamento, ResumoXP } from './xp'
import type { DadosHabito, Habito, Registro } from './habitos'
import type { Compromisso, DadosCompromisso } from './agenda'

// Carrega os dados do usuário (tarefas, projetos, hábitos, compromissos) e oferece as ações para mudá-los.
// A tela muda na hora (antes da resposta do servidor); se o servidor recusar, recarrega e mostra o erro.
export function useDados() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [habitos, setHabitos] = useState<Habito[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [series, setSeries] = useState<Serie[]>([])
  const [temRepeticoes, setTemRepeticoes] = useState(false) // false enquanto o SQL da recorrência não foi rodado
  const [resumoXP, setResumoXP] = useState<ResumoXP>(xp.RESUMO_VAZIO)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    try {
      // Primeiro o banco cria as tarefas de hoje das séries; depois tudo é lido. Se isso falhar, o resto carrega igual.
      await sr.gerarOcorrencias().catch(() => 0)
      const [t, h, c, x, s] = await Promise.all([
        db.buscarTudo(),
        hb.buscarHabitos(),
        ag.buscarCompromissos(),
        xp.buscarXP(),
        sr.buscarSeries(),
      ])
      setSeries(s.series)
      setTemRepeticoes(s.disponivel)
      setTarefas(t.tarefas)
      setProjetos(t.projetos)
      setHabitos(h.habitos)
      setRegistros(h.registros)
      setCompromissos(c)
      setResumoXP(x.resumo)
      setLancamentos(x.lancamentos)
      setErro('')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const tentar = async (acao: () => Promise<void>) => {
    try {
      await acao()
      setErro('')
    } catch (e) {
      setErro((e as Error).message)
      await recarregar()
    }
  }

  // O banco registra o XP sozinho; depois de concluir/desmarcar algo, o app só relê o resultado.
  const atualizarXP = async () => {
    const x = await xp.buscarXP()
    setResumoXP(x.resumo)
    setLancamentos(x.lancamentos)
  }

  const trocar = <T extends { id: string }>(set: (f: (l: T[]) => T[]) => void, item: T) =>
    set((l) => l.map((x) => (x.id === item.id ? item : x)))

  const feitoNoDia = (habit_id: string, dia: string) => registros.some((r) => r.habit_id === habit_id && r.dia === dia)

  return {
    tarefas,
    projetos,
    habitos,
    registros,
    compromissos,
    series,
    temRepeticoes,
    resumoXP,
    lancamentos,
    carregando,
    erro,
    feitoNoDia,
    recarregarXP: () => tentar(atualizarXP),

    // ---- Tarefas ----
    alternarTarefa: (t: Tarefa) =>
      tentar(async () => {
        const concluida_em = t.concluida_em ? null : new Date().toISOString()
        trocar(setTarefas, { ...t, concluida_em })
        trocar(setTarefas, await db.editarTarefa(t.id, { concluida_em }))
        await atualizarXP()
      }),

    salvarTarefa: (dados: DadosTarefa, id?: string) =>
      tentar(async () => {
        if (id) trocar(setTarefas, await db.editarTarefa(id, dados))
        else {
          const nova = await db.inserirTarefa(dados)
          setTarefas((l) => [...l, nova])
        }
      }),

    // Muda o dia de uma ou mais tarefas de uma vez ("trazer para hoje", "deixar para amanhã").
    reagendarTarefas: (ids: string[], data: string | null) =>
      tentar(async () => {
        setTarefas((l) => l.map((t) => (ids.includes(t.id) ? { ...t, data } : t)))
        for (const id of ids) trocar(setTarefas, await db.editarTarefa(id, { data }))
      }),

    // Cria e devolve a tarefa (o Recomeçar precisa dela para marcar como feita depois).
    criarTarefa: async (dados: DadosTarefa): Promise<Tarefa | null> => {
      try {
        const nova = await db.inserirTarefa(dados)
        setTarefas((l) => [...l, nova])
        return nova
      } catch (e) {
        setErro((e as Error).message)
        return null
      }
    },

    excluirTarefa: (id: string) =>
      tentar(async () => {
        setTarefas((l) => l.filter((x) => x.id !== id))
        await db.apagarTarefa(id)
      }),

    // ---- Tarefas que se repetem ----
    // Depois de criar ou mudar uma série, o banco confere hoje de novo e a lista de tarefas é relida.
    salvarSerie: (dados: DadosSerie, id?: string) =>
      tentar(async () => {
        const salva = id ? await sr.editarSerie(id, dados) : await sr.inserirSerie(dados)
        setSeries((l) => (id ? l.map((x) => (x.id === id ? salva : x)) : [...l, salva]))
        await sr.gerarOcorrencias()
        setTarefas((await db.buscarTudo()).tarefas)
      }),

    excluirSerie: (id: string) =>
      tentar(async () => {
        setSeries((l) => l.filter((x) => x.id !== id))
        setTarefas((l) => l.map((t) => (t.series_id === id ? { ...t, series_id: null } : t)))
        await sr.apagarSerie(id)
      }),

    // ---- Projetos ----
    criarProjeto: (titulo: string) =>
      tentar(async () => {
        const novo = await db.inserirProjeto(titulo)
        setProjetos((l) => [...l, novo])
      }),

    alternarProjeto: (p: Projeto) =>
      tentar(async () => {
        const concluido_em = p.concluido_em ? null : new Date().toISOString()
        trocar(setProjetos, { ...p, concluido_em })
        trocar(setProjetos, await db.editarProjeto(p.id, { concluido_em }))
        await atualizarXP()
      }),

    excluirProjeto: (id: string) =>
      tentar(async () => {
        setProjetos((l) => l.filter((x) => x.id !== id))
        setTarefas((l) => l.filter((x) => x.project_id !== id))
        await db.apagarProjeto(id)
      }),

    // ---- Hábitos ----
    salvarHabito: (dados: DadosHabito, id?: string) =>
      tentar(async () => {
        if (id) trocar(setHabitos, await hb.editarHabito(id, dados))
        else {
          const novo = await hb.inserirHabito(dados)
          setHabitos((l) => [...l, novo])
        }
      }),

    excluirHabito: (id: string) =>
      tentar(async () => {
        setHabitos((l) => l.filter((x) => x.id !== id))
        setRegistros((l) => l.filter((x) => x.habit_id !== id))
        await hb.apagarHabito(id)
      }),

    alternarHabito: (h: Habito, dia = db.hojeISO()) =>
      tentar(async () => {
        if (feitoNoDia(h.id, dia)) {
          setRegistros((l) => l.filter((r) => !(r.habit_id === h.id && r.dia === dia)))
          await hb.desmarcarHabito(h.id, dia)
        } else {
          const temp = { id: `temp-${h.id}-${dia}`, habit_id: h.id, dia }
          setRegistros((l) => [...l, temp])
          const salvo = await hb.marcarHabito(h.id, dia)
          setRegistros((l) => l.map((r) => (r.id === temp.id ? salvo : r)))
        }
        await atualizarXP()
      }),

    // ---- Compromissos ----
    salvarCompromisso: (dados: DadosCompromisso, id?: string) =>
      tentar(async () => {
        if (id) trocar(setCompromissos, await ag.editarCompromisso(id, dados))
        else {
          const novo = await ag.inserirCompromisso(dados)
          setCompromissos((l) => [...l, novo])
        }
      }),

    excluirCompromisso: (id: string) =>
      tentar(async () => {
        setCompromissos((l) => l.filter((x) => x.id !== id))
        await ag.apagarCompromisso(id)
      }),
  }
}

export type Dados = ReturnType<typeof useDados>
