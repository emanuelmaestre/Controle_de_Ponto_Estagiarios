import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

const PONTOS_POR_ATIVIDADE = 5

// ── Vocabulário correto de referência ────────────────────────────────────────
// Cada palavra aqui é a forma CERTA. O algoritmo fuzzy encontra a mais próxima.
const VOCABULARIO: string[] = [
  // Limpeza / higiene
  'LIMPEZA', 'VARREDURA', 'VASSOURA', 'HIGIENIZAÇÃO', 'DESINFECÇÃO',
  'LAVAGEM', 'LIMPANDO', 'LIMPAR', 'VARRENDO',
  // Organização
  'ORGANIZAÇÃO', 'ORGANIZANDO', 'ORGANIZAR', 'ARRUMAÇÃO', 'ARRUMANDO',
  // Recepção / atendimento
  'RECEPÇÃO', 'ATENDIMENTO', 'ATENDENDO', 'ATENDER',
  // Documentos / administrativo
  'DOCUMENTO', 'DOCUMENTOS', 'ARQUIVAMENTO', 'ARQUIVANDO', 'ARQUIVAR',
  'DIGITAÇÃO', 'DIGITANDO', 'DIGITAR', 'IMPRESSÃO', 'IMPRIMINDO',
  'SEPARAÇÃO', 'SEPARANDO', 'CATALOGAÇÃO', 'PROTOCOLO', 'PROTOCOLANDO',
  'PLANILHA', 'PLANILHAS', 'RELATÓRIO', 'RELATÓRIOS',
  'PREENCHIMENTO', 'PREENCHENDO', 'PREENCHER',
  'VERIFICAÇÃO', 'VERIFICANDO', 'VERIFICAR', 'CONFERÊNCIA', 'CONFERINDO',
  'CLASSIFICAÇÃO', 'CLASSIFICANDO', 'TRIAGEM',
  'RECEBIMENTO', 'RECEBENDO', 'RECEBER', 'ENTREGA', 'ENTREGANDO', 'ENTREGUE',
  'ENVIO', 'ENVIANDO', 'ENVIAR',
  // Reunião / treinamento
  'REUNIÃO', 'REUNINDO', 'TREINAMENTO', 'TREINANDO',
  // Monitoramento / suporte
  'MONITORAMENTO', 'MONITORANDO', 'SUPORTE', 'AUXILIANDO', 'AUXILIAR',
  'COLABORAÇÃO', 'COLABORANDO', 'COLABORAR',
  // Estoque / materiais
  'ESTOQUE', 'ETIQUETAGEM', 'ETIQUETANDO', 'SUPRIMENTOS',
  // Tecnologia / sistema
  'INFORMÁTICA', 'AGENDAMENTO', 'AGENDANDO', 'ATUALIZAÇÃO', 'ATUALIZANDO',
  // Secretaria / admin
  'SECRETARIA', 'ADMINISTRATIVO', 'ADMINISTRATIVA', 'XEROX',
  // Palavras comuns que NÃO devem ser corrigidas (passam direto)
  'E', 'O', 'A', 'OS', 'AS', 'DE', 'DO', 'DA', 'DOS', 'DAS',
  'EM', 'NO', 'NA', 'NOS', 'NAS', 'COM', 'PARA', 'POR', 'AO',
  'UM', 'UMA', 'AOS', 'SE', 'QUE', 'NA', 'AS',
  'FOI', 'FUI', 'ERA', 'FORAM', 'SER', 'ESTAR', 'TEM', 'TINHA',
  'SETOR', 'LOCAL', 'SALA', 'ÁREA', 'MESA', 'COPA',
  'MANHÃ', 'TARDE', 'DIA', 'SEMANA',
]

// Distância de Levenshtein (edição mínima entre duas strings)
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

// Corrige uma única palavra por correspondência aproximada
function corrigirPalavra(palavra: string): string {
  if (palavra.length <= 2) return palavra          // artigos/preposições: não mexe
  if (VOCAB_SET.has(palavra)) return palavra       // já está correta

  // Limite de diferença proporcional ao tamanho da palavra
  const limite = palavra.length <= 5 ? 1 : palavra.length <= 8 ? 2 : 3

  let melhor = palavra
  let menorDist = Infinity

  for (const ref of VOCABULARIO) {
    // Poda rápida por diferença de tamanho
    if (Math.abs(ref.length - palavra.length) > limite) continue
    const d = levenshtein(palavra, ref)
    if (d < menorDist) { menorDist = d; melhor = ref }
    if (d === 0) break // perfeito
  }

  return menorDist <= limite ? melhor : palavra
}

// Remove acentos para normalizar antes de comparar no split, mas preserva acentuação final
function corrigirOrtografia(texto: string): string {
  const upper = texto.toUpperCase()
  // Split preservando separadores (espaços, pontuação)
  return upper.split(/(\s+|[^A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]+)/).map(token => {
    if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]+$/.test(token)) return corrigirPalavra(token)
    return token
  }).join('')
}

const schemaPost = z.object({
  recordId:    z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

const schemaPatch = z.object({
  activityId:  z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

const schemaDelete = z.object({
  activityId: z.string().uuid(),
})

function normalizar(texto: string): string {
  return corrigirOrtografia(texto.trim())
}

async function getInternId(user: { id: string }, db: ReturnType<typeof createSupabaseServiceClient>) {
  return user.id
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schemaPost.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { recordId, description } = parsed.data
  const db = createSupabaseServiceClient()

  const { data: record, error: recErr } = await db
    .from('time_records')
    .select('id, clock_out, intern_id')
    .eq('id', recordId)
    .eq('intern_id', user.id)
    .maybeSingle()

  if (recErr || !record) {
    return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
  }

  if (!record.clock_out) {
    return NextResponse.json({ error: 'Só é possível adicionar atividade após registrar a saída' }, { status: 400 })
  }

  const { data: activity, error } = await db
    .from('activities')
    .insert({ time_record_id: recordId, description: normalizar(description) })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Concede +5 pontos ao aluno
  const { data: profile } = await db.from('profiles').select('points').eq('id', user.id).maybeSingle()
  if (profile) {
    await db.from('profiles').update({ points: (profile.points ?? 0) + PONTOS_POR_ATIVIDADE }).eq('id', user.id)
  }

  return NextResponse.json({ activity })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schemaPatch.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { activityId, description } = parsed.data
  const db = createSupabaseServiceClient()

  const { data: existing, error: findErr } = await db
    .from('activities')
    .select('id, time_record_id, time_records!inner(intern_id)')
    .eq('id', activityId)
    .maybeSingle()

  if (findErr || !existing) {
    return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existing.time_records as any)?.intern_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { data: activity, error } = await db
    .from('activities')
    .update({ description: normalizar(description) })
    .eq('id', activityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ activity })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schemaDelete.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { activityId } = parsed.data
  const db = createSupabaseServiceClient()

  const { data: existing, error: findErr } = await db
    .from('activities')
    .select('id, time_record_id, time_records!inner(intern_id)')
    .eq('id', activityId)
    .maybeSingle()

  if (findErr || !existing) {
    return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existing.time_records as any)?.intern_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { error } = await db.from('activities').delete().eq('id', activityId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduz -5 pontos ao excluir
  const { data: profile } = await db.from('profiles').select('points').eq('id', user.id).maybeSingle()
  if (profile) {
    await db.from('profiles').update({ points: Math.max(0, (profile.points ?? 0) - PONTOS_POR_ATIVIDADE) }).eq('id', user.id)
  }

  return NextResponse.json({ ok: true, pontosDebitados: PONTOS_POR_ATIVIDADE })
}
