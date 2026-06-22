/**
 * sync-updates.mjs — roda automaticamente no postbuild (Vercel + local).
 *
 * A cada deploy detecta se já existe um registro deste deploy pelo SHA do
 * commit (salvo em `details`). Se não existir, insere um registro por tipo
 * de commit encontrado (feat/fix/perf/refactor) com texto amigável.
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SK  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SK) {
  console.log('[sync-updates] Variáveis Supabase ausentes — pulando.')
  process.exit(0)
}

// ── Texto fixo e amigável por tipo ────────────────────────────────────────────
const TEXTOS = {
  feat: {
    type:        'feature',
    title:       'Novas funcionalidades disponíveis',
    description: 'O sistema recebeu novidades nesta versão. Explore as melhorias!',
    module:      'Sistema',
  },
  fix: {
    type:        'fix',
    title:       'Correções aplicadas',
    description: 'Problemas identificados foram corrigidos para melhor experiência.',
    module:      'Sistema',
  },
  perf: {
    type:        'improvement',
    title:       'Melhorias de desempenho e usabilidade',
    description: 'O sistema ficou mais rápido, estável e agradável de usar.',
    module:      'Sistema',
  },
}

const PREFIXOS_VALIDOS = ['feat', 'fix', 'perf', 'refactor', 'improvement']

function resolverChave(prefixo) {
  if (['perf', 'refactor', 'improvement'].includes(prefixo)) return 'perf'
  return prefixo // feat | fix
}

async function main() {
  console.log('[sync-updates] Iniciando...')

  const db = createClient(SUPABASE_URL, SUPABASE_SK)

  // SHA do commit atual (injetado pelo Vercel, ou lido do git em local)
  let shaAtual = process.env.VERCEL_GIT_COMMIT_SHA ?? ''
  if (!shaAtual) {
    try { shaAtual = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim() } catch { shaAtual = '' }
  }

  if (!shaAtual) {
    console.log('[sync-updates] SHA do commit não encontrado — pulando.')
    process.exit(0)
  }

  console.log(`[sync-updates] SHA do deploy: ${shaAtual.slice(0, 7)}`)

  // Verifica se este deploy já foi processado
  const { data: jaFeito } = await db
    .from('system_updates')
    .select('id')
    .eq('details', `deploy:${shaAtual}`)
    .limit(1)

  if (jaFeito?.length > 0) {
    console.log('[sync-updates] Este deploy já foi sincronizado — pulando.')
    return
  }

  // Lê commits desde o penúltimo deploy publicado
  const { data: ultimoPublicado } = await db
    .from('system_updates')
    .select('created_at')
    .like('details', 'deploy:%')
    .order('created_at', { ascending: false })
    .limit(1)

  let filtroGit = '-50' // fallback: últimos 50 commits
  if (ultimoPublicado?.length > 0) {
    const dt = new Date(new Date(ultimoPublicado[0].created_at).getTime() - 120_000)
    filtroGit = `--after="${dt.toISOString()}"`
  }

  let log = ''
  try {
    log = execSync(
      `git log ${filtroGit} --pretty=format:"%s" --no-merges`,
      { encoding: 'utf8' }
    ).trim()
  } catch {
    console.log('[sync-updates] git log indisponível — pulando.')
    process.exit(0)
  }

  if (!log) {
    console.log('[sync-updates] Sem commits relevantes.')
    return
  }

  // Agrupa por chave (feat / fix / perf)
  const tiposEncontrados = new Set()
  for (const subject of log.split('\n')) {
    const prefixo = subject.trim().match(/^(\w+)/)?.[1]?.toLowerCase()
    if (prefixo && PREFIXOS_VALIDOS.includes(prefixo)) {
      tiposEncontrados.add(resolverChave(prefixo))
    }
  }

  console.log(`[sync-updates] Tipos detectados: ${[...tiposEncontrados].join(', ') || 'nenhum'}`)

  if (tiposEncontrados.size === 0) {
    console.log('[sync-updates] Nenhum commit publicável neste deploy.')
    return
  }

  // Insere um registro por tipo com details = deploy:SHA (para deduplicação)
  let primeiro = true
  for (const chave of tiposEncontrados) {
    const cfg = TEXTOS[chave]

    const { error } = await db.from('system_updates').insert({
      title:       cfg.title,
      description: cfg.description,
      type:        cfg.type,
      module:      cfg.module,
      // Só o primeiro registro carrega o SHA (evita duplicatas no próximo deploy)
      details:     primeiro ? `deploy:${shaAtual}` : null,
    })

    if (error) {
      console.warn(`[sync-updates] Erro ao inserir "${cfg.title}":`, error.message)
    } else {
      console.log(`[sync-updates] ✓ "${cfg.title}"`)
      primeiro = false
    }
  }

  console.log('[sync-updates] Concluído.')
}

main().catch(e => {
  console.error('[sync-updates] Erro:', e.message)
  process.exit(0) // nunca quebra o build
})
