import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { formatFullName } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── Vocabulário completo para correção ortográfica ───────────────────────────
const VOCABULARIO: string[] = [
  'LIMPEZA', 'LIMPEZAS', 'LIMPAR', 'LIMPANDO', 'LIMPEI', 'LIMPO',
  'VARREDURA', 'VARRER', 'VARRENDO', 'VARRI',
  'VASSOURA', 'VASSOURAS',
  'HIGIENIZAÇÃO', 'HIGIENIZAR', 'HIGIENIZANDO', 'HIGIENIZEI',
  'DESINFECÇÃO', 'DESINFETAR', 'DESINFETANDO', 'DESINFETEI',
  'ESTERILIZAÇÃO', 'ESTERILIZAR', 'ESTERILIZANDO',
  'LAVAGEM', 'LAVAR', 'LAVANDO', 'LAVEI',
  'FAXINA', 'FAXINANDO',
  'DESCARTE', 'DESCARTANDO', 'DESCARTAR', 'DESCARTEI',
  'RESÍDUO', 'RESÍDUOS', 'LIXO',
  'ORGANIZAÇÃO', 'ORGANIZAR', 'ORGANIZANDO', 'ORGANIZEI',
  'ARRUMAÇÃO', 'ARRUMAR', 'ARRUMANDO', 'ARRUMEI',
  'ORDENAÇÃO', 'ORDENAR', 'ORDENANDO', 'ORDENEI',
  'SEPARAÇÃO', 'SEPARAR', 'SEPARANDO', 'SEPAREI',
  'SELEÇÃO', 'SELECIONAR', 'SELECIONANDO', 'SELECIONEI',
  'MONTAGEM', 'MONTAR', 'MONTANDO', 'MONTEI',
  'DESMONTAGEM', 'DESMONTAR', 'DESMONTANDO', 'DESMONTEI',
  'EMPILHAMENTO', 'EMPILHAR', 'EMPILHANDO',
  'ARMAZENAMENTO', 'ARMAZENAR', 'ARMAZENANDO', 'ARMAZENEI',
  'DISPOSIÇÃO', 'DISPOR',
  'RECEPÇÃO', 'RECEPCIONAR', 'RECEPCIONANDO', 'RECEPCIONEI',
  'ATENDIMENTO', 'ATENDER', 'ATENDENDO', 'ATENDI',
  'ACOLHIMENTO', 'ACOLHER', 'ACOLHENDO',
  'TRIAGEM', 'TRIAR', 'TRIANDO',
  'ORIENTAÇÃO', 'ORIENTAR', 'ORIENTANDO', 'ORIENTEI',
  'ENCAMINHAMENTO', 'ENCAMINHAR', 'ENCAMINHANDO', 'ENCAMINHEI',
  'SUPORTE', 'APOIO',
  'DOCUMENTO', 'DOCUMENTOS', 'DOCUMENTAÇÃO', 'DOCUMENTAR', 'DOCUMENTANDO',
  'ARQUIVAMENTO', 'ARQUIVAR', 'ARQUIVANDO', 'ARQUIVEI',
  'ARQUIVO', 'ARQUIVOS',
  'DIGITAÇÃO', 'DIGITAR', 'DIGITANDO', 'DIGITEI',
  'IMPRESSÃO', 'IMPRIMIR', 'IMPRIMINDO', 'IMPRIMI',
  'CATALOGAÇÃO', 'CATALOGAR', 'CATALOGANDO', 'CATALOGUEI',
  'PROTOCOLO', 'PROTOCOLANDO', 'PROTOCOLAR', 'PROTOCOLEI',
  'PLANILHA', 'PLANILHAS', 'PLANILHAR',
  'RELATÓRIO', 'RELATÓRIOS',
  'FORMULÁRIO', 'FORMULÁRIOS',
  'FICHA', 'FICHAS',
  'CADASTRO', 'CADASTROS', 'CADASTRAR', 'CADASTRANDO', 'CADASTREI',
  'PREENCHIMENTO', 'PREENCHER', 'PREENCHENDO', 'PREENCHEI',
  'VERIFICAÇÃO', 'VERIFICAR', 'VERIFICANDO', 'VERIFIQUEI',
  'CONFERÊNCIA', 'CONFERIR', 'CONFERINDO', 'CONFERI',
  'CLASSIFICAÇÃO', 'CLASSIFICAR', 'CLASSIFICANDO', 'CLASSIFIQUEI',
  'RECEBIMENTO', 'RECEBER', 'RECEBENDO', 'RECEBI',
  'ENTREGA', 'ENTREGAR', 'ENTREGANDO', 'ENTREGEI', 'ENTREGUE',
  'ENVIO', 'ENVIAR', 'ENVIANDO', 'ENVIEI',
  'EMISSÃO', 'EMITIR', 'EMITINDO', 'EMITI',
  'CONTROLE', 'CONTROLAR', 'CONTROLANDO', 'CONTROLEI',
  'REGISTRO', 'REGISTROS', 'REGISTRAR', 'REGISTRANDO', 'REGISTREI',
  'ASSINATURA', 'ASSINAR', 'ASSINANDO', 'ASSINEI',
  'CÓPIA', 'CÓPIAS', 'COPIAR', 'COPIANDO', 'COPIEI',
  'XEROX', 'XEROCAR',
  'DIGITALIZAÇÃO', 'DIGITALIZAR', 'DIGITALIZANDO', 'DIGITALIZEI',
  'ESCANEAMENTO', 'ESCANEAR', 'ESCANEANDO', 'ESCANEEI',
  'REUNIÃO', 'REUNIÕES', 'REUNIR', 'REUNINDO', 'REUNI',
  'TREINAMENTO', 'TREINAMENTOS', 'TREINAR', 'TREINANDO', 'TREINEI',
  'CAPACITAÇÃO', 'CAPACITAR', 'CAPACITANDO', 'CAPACITEI',
  'CURSO', 'CURSOS',
  'PALESTRA', 'PALESTRAS',
  'APRESENTAÇÃO', 'APRESENTAR', 'APRESENTANDO', 'APRESENTEI',
  'WORKSHOP',
  'INSTRUÇÃO', 'INSTRUIR', 'INSTRUINDO',
  'MONITORAMENTO', 'MONITORAR', 'MONITORANDO', 'MONITOREI',
  'ACOMPANHAMENTO', 'ACOMPANHAR', 'ACOMPANHANDO', 'ACOMPANHEI',
  'SUPERVISÃO', 'SUPERVISIONAR', 'SUPERVISIONANDO',
  'COLABORAÇÃO', 'COLABORAR', 'COLABORANDO', 'COLABOREI',
  'AUXILIAR', 'AUXILIANDO', 'AUXILIEI',
  'AJUDAR', 'AJUDANDO', 'AJUDEI',
  'APOIAR', 'APOIANDO', 'APOIEI',
  'ESTOQUE', 'ESTOCAR', 'ESTOCANDO', 'ESTOQUEI',
  'MATERIAL', 'MATERIAIS',
  'SUPRIMENTO', 'SUPRIMENTOS',
  'INSUMO', 'INSUMOS',
  'INVENTÁRIO', 'INVENTARIAR', 'INVENTARIANDO',
  'REQUISIÇÃO', 'REQUISITAR', 'REQUISITANDO', 'REQUISITEI',
  'COMPRAS', 'COMPRAR', 'COMPRANDO', 'COMPREI',
  'REPOSIÇÃO', 'REPOR', 'REPONDO', 'REPUS',
  'ETIQUETAGEM', 'ETIQUETAR', 'ETIQUETANDO', 'ETIQUETEI',
  'ETIQUETA', 'ETIQUETAS',
  'CONTAGEM', 'CONTAR', 'CONTANDO', 'CONTEI',
  'INFORMÁTICA',
  'COMPUTADOR', 'COMPUTADORES',
  'SISTEMA', 'SISTEMAS',
  'IMPRESSORA', 'IMPRESSORAS',
  'EQUIPAMENTO', 'EQUIPAMENTOS',
  'MANUTENÇÃO', 'MANUTENÇÕES', 'MANTER', 'MANTENDO', 'MANTIVE',
  'INSTALAÇÃO', 'INSTALAR', 'INSTALANDO', 'INSTALEI',
  'CONFIGURAÇÃO', 'CONFIGURAR', 'CONFIGURANDO', 'CONFIGUREI',
  'ATUALIZAÇÃO', 'ATUALIZAR', 'ATUALIZANDO', 'ATUALIZEI',
  'AGENDAMENTO', 'AGENDAR', 'AGENDANDO', 'AGENDEI',
  'ACESSO', 'ACESSAR', 'ACESSANDO', 'ACESSEI',
  'CADASTRAMENTO',
  'BACKUP', 'BACKUPS',
  'REDE', 'REDES',
  'HARDWARE', 'SOFTWARE',
  'LABORATÓRIO', 'LABORATÓRIOS',
  'ANÁLISE', 'ANÁLISES', 'ANALISAR', 'ANALISANDO', 'ANALISEI',
  'AMOSTRA', 'AMOSTRAS',
  'EXPERIMENTO', 'EXPERIMENTOS', 'EXPERIMENTAR', 'EXPERIMENTANDO',
  'PESQUISA', 'PESQUISAS', 'PESQUISAR', 'PESQUISANDO', 'PESQUISEI',
  'COLETA', 'COLETAR', 'COLETANDO', 'COLETEI',
  'MEDIÇÃO', 'MEDIR', 'MEDINDO', 'MEDI',
  'PESAGEM', 'PESAR', 'PESANDO', 'PESEI',
  'CALIBRAÇÃO', 'CALIBRAR', 'CALIBRANDO', 'CALIBREI',
  'PREPARAÇÃO', 'PREPARAR', 'PREPARANDO', 'PREPAREI',
  'PREPARO',
  'MISTURA', 'MISTURAR', 'MISTURANDO', 'MISTUREI',
  'SOLUÇÃO', 'SOLUÇÕES',
  'REAGENTE', 'REAGENTES',
  'VIDRARIA', 'VIDRARIAS',
  'RESULTADO', 'RESULTADOS',
  'LAUDO', 'LAUDOS',
  'EXAME', 'EXAMES',
  'INSPEÇÃO', 'INSPECIONAR', 'INSPECIONANDO', 'INSPECIONEI',
  'VISTORIA', 'VISTORIAR', 'VISTORIANDO', 'VISTORIEI',
  'REALIZAR', 'REALIZANDO', 'REALIZEI', 'REALIZAÇÃO',
  'EXECUTAR', 'EXECUTANDO', 'EXECUTEI', 'EXECUÇÃO',
  'DESENVOLVER', 'DESENVOLVENDO', 'DESENVOLVI', 'DESENVOLVIMENTO',
  'ELABORAR', 'ELABORANDO', 'ELABOREI', 'ELABORAÇÃO',
  'FINALIZAR', 'FINALIZANDO', 'FINALIZEI', 'FINALIZAÇÃO',
  'CONCLUIR', 'CONCLUINDO', 'CONCLUÍ', 'CONCLUSÃO',
  'INICIAR', 'INICIANDO', 'INICIEI', 'INÍCIO',
  'COMEÇAR', 'COMEÇANDO', 'COMECEI',
  'PARTICIPAR', 'PARTICIPANDO', 'PARTICIPEI', 'PARTICIPAÇÃO',
  'EFETUAR', 'EFETUANDO', 'EFETUEI',
  'REVISAR', 'REVISANDO', 'REVISEI', 'REVISÃO',
  'CORRIGIR', 'CORRIGINDO', 'CORRIGI', 'CORREÇÃO',
  'AJUSTAR', 'AJUSTANDO', 'AJUSTEI', 'AJUSTE', 'AJUSTES',
  'TESTAR', 'TESTANDO', 'TESTEI', 'TESTE', 'TESTES',
  'VALIDAR', 'VALIDANDO', 'VALIDEI', 'VALIDAÇÃO',
  'APROVAR', 'APROVANDO', 'APROVEI', 'APROVAÇÃO',
  'LEVANTAR', 'LEVANTANDO', 'LEVANTEI', 'LEVANTAMENTO',
  'MAPEAR', 'MAPEANDO', 'MAPEEI', 'MAPEAMENTO',
  'IDENTIFICAR', 'IDENTIFICANDO', 'IDENTIFIQUEI',
  'SOLICITAR', 'SOLICITANDO', 'SOLICITEI', 'SOLICITAÇÃO',
  'COMUNICAR', 'COMUNICANDO', 'COMUNIQUEI', 'COMUNICAÇÃO',
  'INFORMAR', 'INFORMANDO', 'INFORMEI', 'INFORMAÇÃO',
  'CONTATAR', 'CONTATANDO', 'CONTATEI',
  'RESPONDER', 'RESPONDENDO', 'RESPONDI', 'RESPOSTA',
  'REDIGIR', 'REDIGINDO', 'REDIGI',
  'INSERIR', 'INSERINDO', 'INSERI',
  'LANÇAR', 'LANÇANDO', 'LANCEI',
  'REPARAR', 'REPARANDO', 'REPAREI', 'REPARO',
  'CONSERTAR', 'CONSERTANDO', 'CONSERTEI', 'CONSERTO',
  'SUBSTITUIR', 'SUBSTITUINDO', 'SUBSTITUÍ',
  'MOVIMENTAR', 'MOVIMENTANDO', 'MOVIMENTEI',
  'TRANSPORTAR', 'TRANSPORTANDO', 'TRANSPORTEI',
  'PROVIDENCIAR', 'PROVIDENCIANDO', 'PROVIDENCIEI',
  'CHECAR', 'CHECANDO', 'CHEQUEI',
  'ANOTAR', 'ANOTANDO', 'ANOTEI', 'ANOTAÇÃO',
  'LEITURA', 'LER', 'LENDO',
  'ESTUDAR', 'ESTUDANDO', 'ESTUDEI', 'ESTUDO',
  'SECRETARIA',
  'ADMINISTRATIVO', 'ADMINISTRATIVA',
  'GERÊNCIA', 'GERENCIAR', 'GERENCIANDO',
  'COORDENAÇÃO', 'COORDENAR', 'COORDENANDO',
  'SETOR', 'SETORES', 'SALA', 'SALAS',
  'ÁREA', 'ÁREAS', 'COPA', 'COZINHA',
  'CORREDOR', 'CORREDORES', 'BANHEIRO', 'BANHEIROS',
  'ALMOXARIFADO', 'ESCRITÓRIO', 'DEPÓSITO',
  'MANHÃ', 'TARDE', 'NOITE',
  'DIA', 'DIAS', 'SEMANA', 'SEMANAS',
  'TURNO', 'TURNOS', 'PERÍODO', 'PERÍODOS',
  'E', 'O', 'A', 'OS', 'AS',
  'DE', 'DO', 'DA', 'DOS', 'DAS',
  'EM', 'NO', 'NA', 'NOS', 'NAS',
  'COM', 'PARA', 'POR', 'AO', 'AOS',
  'UM', 'UMA', 'UNS', 'UMAS',
  'SE', 'QUE', 'NÃO', 'SIM',
  'FOI', 'FUI', 'ERA', 'FORAM', 'SER', 'ESTAR', 'TEM', 'TINHA',
  'MEU', 'MINHA', 'MEUS', 'MINHAS',
  'SEU', 'SUA', 'SEUS', 'SUAS',
  'TODO', 'TODA', 'TODOS', 'TODAS',
  'OUTRO', 'OUTRA', 'OUTROS', 'OUTRAS',
  'NOVO', 'NOVA', 'NOVOS', 'NOVAS',
  'LOCAL', 'MESA',
]

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

const VOCAB_SET = new Set(VOCABULARIO)

function corrigirPalavra(palavra: string): string {
  if (palavra.length <= 2) return palavra
  if (VOCAB_SET.has(palavra)) return palavra
  const limite = palavra.length <= 5 ? 1 : palavra.length <= 8 ? 2 : 3
  let melhor = palavra, menorDist = Infinity
  for (const ref of VOCABULARIO) {
    if (Math.abs(ref.length - palavra.length) > limite) continue
    const d = levenshtein(palavra, ref)
    if (d < menorDist) { menorDist = d; melhor = ref }
    if (d === 0) break
  }
  return menorDist <= limite ? melhor : palavra
}

function corrigirOrtografia(texto: string): string {
  const upper = texto.toUpperCase()
  return upper.split(/(\s+|[^A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]+)/).map(token => {
    if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]+$/.test(token)) return corrigirPalavra(token)
    return token
  }).join('')
}

// ── Tarefas de manutenção ────────────────────────────────────────────────────

async function fixActivitiesSpelling(db: ReturnType<typeof createSupabaseServiceClient>) {
  const { data: activities } = await db.from('activities').select('id, description')
  if (!activities?.length) return 0
  const toUpdate = activities
    .map(a => ({ id: a.id, corrected: corrigirOrtografia(a.description.trim()) }))
    .filter(a => a.corrected !== a.description)
  if (!toUpdate.length) return 0
  await Promise.all(toUpdate.map(({ id, corrected }) =>
    db.from('activities').update({ description: corrected }).eq('id', id)
  ))
  return toUpdate.length
}

async function normalizeProfileNames(db: ReturnType<typeof createSupabaseServiceClient>) {
  const { data: profiles } = await db.from('profiles').select('id, full_name')
  if (!profiles?.length) return 0
  const toUpdate = profiles
    .map(p => ({ id: p.id, formatted: formatFullName(p.full_name) }))
    .filter(p => p.formatted !== p.full_name)
  if (!toUpdate.length) return 0
  await Promise.all(toUpdate.map(({ id, formatted }) =>
    db.from('profiles').update({ full_name: formatted }).eq('id', id)
  ))
  return toUpdate.length
}

// ── Handler do cron ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createSupabaseServiceClient()

    const [spellingFixed, namesFixed] = await Promise.all([
      fixActivitiesSpelling(db),
      normalizeProfileNames(db),
    ])

    console.log(`[cron/maintenance] spellingFixed=${spellingFixed} namesFixed=${namesFixed}`)

    return NextResponse.json({
      ok: true,
      spellingFixed,
      namesFixed,
      runAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/maintenance]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
