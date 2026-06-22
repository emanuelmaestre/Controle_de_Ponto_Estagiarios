import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

const PONTOS_POR_ATIVIDADE = 5

// Dicionário de erros comuns em português brasileiro
// Chave = forma errada (maiúscula), valor = forma correta (maiúscula)
const CORRECOES: Record<string, string> = {
  // Limpeza / manutenção
  'LIMPESA':        'LIMPEZA',
  'LIMPEZA':        'LIMPEZA',
  'LINPEZA':        'LIMPEZA',
  'VASOURA':        'VASSOURA',
  'VAROURA':        'VASSOURA',
  'DESINFEÇAO':     'DESINFECÇÃO',
  'DESINFEÇÃO':     'DESINFECÇÃO',
  'ORGANIZAÇAO':    'ORGANIZAÇÃO',
  'ORIGANIZACAO':   'ORGANIZAÇÃO',
  'ORGANIAZACAO':   'ORGANIZAÇÃO',
  'RECEPCAO':       'RECEPÇÃO',
  'RECEPÇAO':       'RECEPÇÃO',
  'ATENDIMENTO':    'ATENDIMENTO',
  'ATENDIMETO':     'ATENDIMENTO',
  'ATEDIMENTO':     'ATENDIMENTO',
  'DOCUEMENTO':     'DOCUMENTO',
  'DOCUMETO':       'DOCUMENTO',
  'DOCUMENTOS':     'DOCUMENTOS',
  'ARQUIVAMENTO':   'ARQUIVAMENTO',
  'ARQUIVAMNETO':   'ARQUIVAMENTO',
  'DIGITAÇAO':      'DIGITAÇÃO',
  'DIGITACAO':      'DIGITAÇÃO',
  'IMPRESSAO':      'IMPRESSÃO',
  'IMPRESÃO':       'IMPRESSÃO',
  'SEPARAÇAO':      'SEPARAÇÃO',
  'SEPARACAO':      'SEPARAÇÃO',
  'CATALOGAÇAO':    'CATALOGAÇÃO',
  'PLANILHA':       'PLANILHA',
  'PLANILA':        'PLANILHA',
  'RELATORIO':      'RELATÓRIO',
  'REUNIAO':        'REUNIÃO',
  'PREENCHIMETO':   'PREENCHIMENTO',
  'PREECHIMENTO':   'PREENCHIMENTO',
  'PREENCHIMENTO':  'PREENCHIMENTO',
  'ENVIO':          'ENVIO',
  'MONITORAMENTO':  'MONITORAMENTO',
  'MONITORIAMENTO': 'MONITORAMENTO',
  'CONFERENCIA':    'CONFERÊNCIA',
  'TRIAGEM':        'TRIAGEM',
  'TRIAGEN':        'TRIAGEM',
  'PROTOCOLO':      'PROTOCOLO',
  'AUXILIANDO':     'AUXILIANDO',
  'AXILIANDO':      'AUXILIANDO',
  'ATUALIZAÇAO':    'ATUALIZAÇÃO',
  'ATUALIZACAO':    'ATUALIZAÇÃO',
  'INFORMATICA':    'INFORMÁTICA',
  'INFROMATICA':    'INFORMÁTICA',
  'XEROX':          'XEROX',
  'CERIA':          'SERIA',
  'SECRTARIA':      'SECRETARIA',
  'SECRETARIA':     'SECRETARIA',
  'ADMINSTRATIVO':  'ADMINISTRATIVO',
  'ADMNISTRATIVO':  'ADMINISTRATIVO',
  'ADMINISTRATIVO': 'ADMINISTRATIVO',
  'ESTOQUE':        'ESTOQUE',
  'ESTOKE':         'ESTOQUE',
  'ETIQUETAGEM':    'ETIQUETAGEM',
  'ETIQUETAGEN':    'ETIQUETAGEM',
  'ETIQUETAGM':     'ETIQUETAGEM',
  'CONFERIR':       'CONFERIR',
  'CONFERENCIAR':   'CONFERIR',
  'VERIFIICACAO':   'VERIFICAÇÃO',
  'VERIFICAÇAO':    'VERIFICAÇÃO',
  'VERIFICACAO':    'VERIFICAÇÃO',
  'CLASSFICACAO':   'CLASSIFICAÇÃO',
  'CLASSIFICAÇAO':  'CLASSIFICAÇÃO',
  'ENTREGUE':       'ENTREGUE',
  'ENTREGUA':       'ENTREGUE',
  'RECEBI':         'RECEBI',
  'RECEBIMETO':     'RECEBIMENTO',
  'RECEBIMENTO':    'RECEBIMENTO',
  'AGENDAMENTO':    'AGENDAMENTO',
  'AGENDAMETO':     'AGENDAMENTO',
  'TREINAMENTO':    'TREINAMENTO',
  'TREINAMNETO':    'TREINAMENTO',
  'COLABORAÇAO':    'COLABORAÇÃO',
  'COLABORACAO':    'COLABORAÇÃO',
  'SUPORTE':        'SUPORTE',
  'SUPORTRE':       'SUPORTE',
  'SUPRIMENTOS':    'SUPRIMENTOS',
  'SUPRIMETNO':     'SUPRIMENTOS',
}

// Aplica o dicionário palavra a palavra
function corrigirOrtografia(texto: string): string {
  return texto
    .toUpperCase()
    .split(/\b/)
    .map(token => CORRECOES[token] ?? token)
    .join('')
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
