/**
 * sync-updates.mjs
 * Roda no postbuild (Vercel). Lê commits do Git, traduz para linguagem
 * amigável via Claude e insere na tabela system_updates do Supabase.
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SK       = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// ── Validação de env ──────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_SK) {
  console.log('[sync-updates] Variáveis Supabase ausentes — pulando.')
  process.exit(0)
}

if (!ANTHROPIC_API_KEY) {
  console.log('[sync-updates] ANTHROPIC_API_KEY ausente — pulando.')
  process.exit(0)
}

// ── Tipos de commit que serão publicados (prefixo convencional) ───────────────
const TIPO_PERMITIDO = /^(feat|fix|improvement|refactor|perf|announcement)(\(.+\))?:/i

// ── Mapeamento de prefixo → type da tabela ────────────────────────────────────
function resolverType(prefixo) {
  const p = prefixo.toLowerCase()
  if (p === 'feat')         return 'feature'
  if (p === 'fix')          return 'fix'
  if (p === 'perf')         return 'improvement'
  if (p === 'refactor')     return 'improvement'
  if (p === 'improvement')  return 'improvement'
  if (p === 'announcement') return 'announcement'
  return 'feature'
}

// ── Busca commits desde o último sincronizado ─────────────────────────────────
async function buscarCommitsNovos(db) {
  // Pega a data do update mais recente já inserido automaticamente
  const { data } = await db
    .from('system_updates')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  let desde = ''
  if (data && data.length > 0) {
    // 1 minuto de margem para não perder commits do mesmo segundo
    const dt = new Date(new Date(data[0].created_at).getTime() - 60_000)
    desde = `--after="${dt.toISOString()}"`
  } else {
    // Se tabela vazia, pega últimos 30 commits
    desde = '-30'
  }

  let log
  try {
    log = execSync(
      `git log ${desde} --pretty=format:"%H|||%s|||%ad" --date=iso-strict`,
      { encoding: 'utf8' }
    ).trim()
  } catch {
    console.log('[sync-updates] Não foi possível ler git log.')
    return []
  }

  if (!log) return []

  return log
    .split('\n')
    .map(linha => {
      const [hash, subject, date] = linha.split('|||')
      return { hash: hash?.trim(), subject: subject?.trim(), date: date?.trim() }
    })
    .filter(c => c.hash && c.subject && TIPO_PERMITIDO.test(c.subject))
}

// ── Verifica se o commit já existe na tabela (pelo hash no campo details) ─────
async function commitJaExiste(db, hash) {
  const { data } = await db
    .from('system_updates')
    .select('id')
    .like('details', `%git:${hash}%`)
    .limit(1)
  return data && data.length > 0
}

// ── Traduz commits via Claude ─────────────────────────────────────────────────
async function traduzirComClaude(commits) {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  const lista = commits
    .map((c, i) => `${i + 1}. [${c.subject}]`)
    .join('\n')

  const prompt = `Você é o assistente do sistema "Chronos Lab", um sistema de controle de ponto para estagiários.

Abaixo estão mensagens técnicas de commits do Git. Para cada uma, gere:
- "titulo": título curto e claro (máx 80 chars) em português, como se fosse um changelog para o usuário final (não técnico)
- "descricao": frase explicativa (máx 200 chars) do benefício real para o usuário
- "modulo": módulo do sistema afetado (ex: "Painel Admin", "Registro de Ponto", "Perfil", "Gamificação", "Notificações", "Relatórios", "Ranking") — use null se não souber

Regras:
- Linguagem simples e positiva, sem jargões técnicos
- Foque no benefício, não na implementação
- "chore", "test", "docs" já foram filtrados — todos os commits aqui são relevantes ao usuário
- Responda APENAS com JSON válido, sem texto extra

Formato de resposta:
[
  { "titulo": "...", "descricao": "...", "modulo": "..." },
  ...
]

Commits:
${lista}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const texto = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    const json = JSON.parse(texto.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
    return json
  } catch {
    console.warn('[sync-updates] Falha ao parsear resposta do Claude:', texto)
    return []
  }
}

// ── Detecta módulo pelo prefixo do commit (fallback sem Claude) ───────────────
function detectarModulo(subject) {
  const s = subject.toLowerCase()
  if (s.includes('sidebar') || s.includes('admin') || s.includes('painel')) return 'Painel Admin'
  if (s.includes('sino') || s.includes('notif') || s.includes('pendenc'))   return 'Notificações'
  if (s.includes('ranking') || s.includes('gamif') || s.includes('ponto'))  return 'Gamificação'
  if (s.includes('perfil') || s.includes('profile') || s.includes('foto'))  return 'Perfil'
  if (s.includes('relat') || s.includes('report'))                          return 'Relatórios'
  if (s.includes('clock') || s.includes('ponto') || s.includes('entrada'))  return 'Registro de Ponto'
  if (s.includes('logo') || s.includes('ui') || s.includes('layout'))       return 'Interface'
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[sync-updates] Iniciando sincronização de commits...')

  const db = createClient(SUPABASE_URL, SUPABASE_SK)

  const commits = await buscarCommitsNovos(db)
  console.log(`[sync-updates] ${commits.length} commit(s) novo(s) encontrado(s).`)

  if (commits.length === 0) {
    console.log('[sync-updates] Nada a sincronizar.')
    return
  }

  // Filtra commits já existentes
  const novos = []
  for (const c of commits) {
    const existe = await commitJaExiste(db, c.hash)
    if (!existe) novos.push(c)
  }

  console.log(`[sync-updates] ${novos.length} commit(s) a publicar.`)
  if (novos.length === 0) return

  // Traduz com Claude
  let traducoes = []
  try {
    traducoes = await traduzirComClaude(novos)
    console.log(`[sync-updates] Claude gerou ${traducoes.length} tradução(ões).`)
  } catch (e) {
    console.warn('[sync-updates] Erro no Claude, usando fallback:', e.message)
  }

  // Insere no Supabase
  for (let i = 0; i < novos.length; i++) {
    const commit   = novos[i]
    const trad     = traducoes[i]
    const prefixo  = commit.subject.match(/^(\w+)/)?.[1] ?? 'feat'
    const type     = resolverType(prefixo)

    const titulo = trad?.titulo
      ?? commit.subject.replace(/^(\w+)(\(.+\))?:\s*/, '').slice(0, 80)

    const descricao = trad?.descricao
      ?? 'Melhoria disponível nesta versão.'

    const modulo = trad?.modulo ?? detectarModulo(commit.subject)

    const { error } = await db.from('system_updates').insert({
      title:       titulo,
      description: descricao,
      type,
      module:      modulo,
      details:     `git:${commit.hash}`,
    })

    if (error) {
      console.warn(`[sync-updates] Erro ao inserir "${titulo}":`, error.message)
    } else {
      console.log(`[sync-updates] ✓ Publicado: "${titulo}"`)
    }
  }

  console.log('[sync-updates] Sincronização concluída.')
}

main().catch(e => {
  console.error('[sync-updates] Erro fatal:', e)
  process.exit(0) // exit 0 para não quebrar o build
})
