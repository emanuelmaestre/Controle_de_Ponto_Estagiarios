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

// ── Config por tipo ───────────────────────────────────────────────────────────
const TIPOS = {
  feat: {
    type:        'feature',
    title:       'Novas funcionalidades disponíveis',
    description: 'O sistema recebeu novidades nesta versão. Explore o que há de novo!',
    module:      'Sistema',
  },
  fix: {
    type:        'fix',
    title:       'Correções aplicadas',
    description: 'Problemas identificados foram resolvidos para garantir uma melhor experiência.',
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

// Remove o prefixo convencional e formata o texto para o usuário
// "feat: adicionar atividade retroativa" → "Adicionada atividade retroativa no histórico"
function humanizar(subject) {
  // Remove prefixo tipo "feat:", "fix(module):", etc.
  const semPrefixo = subject.replace(/^\w+(\([^)]+\))?!?\s*:\s*/i, '').trim()
  // Remove hífens/underscores e capitaliza a primeira letra
  const texto = semPrefixo.replace(/[-_]/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
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

  // Verifica se este deploy já foi processado (SHA embutido na última linha do details)
  const { data: jaFeito } = await db
    .from('system_updates')
    .select('id')
    .ilike('details', `%[deploy:${shaAtual}]`)
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

  // Agrupa commits por chave (feat / fix / perf), com textos humanizados
  const grupos = {} // { feat: ['Texto A', 'Texto B'], fix: [...] }
  for (const subject of log.split('\n')) {
    const s = subject.trim()
    if (!s) continue
    const prefixo = s.match(/^(\w+)/)?.[1]?.toLowerCase()
    if (!prefixo || !PREFIXOS_VALIDOS.includes(prefixo)) continue
    const chave = resolverChave(prefixo)
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(humanizar(s))
  }

  const chaves = Object.keys(grupos)
  console.log(`[sync-updates] Tipos detectados: ${chaves.join(', ') || 'nenhum'}`)

  if (chaves.length === 0) {
    console.log('[sync-updates] Nenhum commit publicável neste deploy.')
    return
  }

  // Insere um registro por tipo.
  // - details: lista de commits humanizados + SHA oculto na última linha para deduplicação
  // - Só o PRIMEIRO registro carrega o SHA (evita checar todos os registros no próximo deploy)
  let primeiro = true
  for (const chave of chaves) {
    const cfg  = TIPOS[chave]
    const itens = grupos[chave]

    // Monta bullets legíveis + marcador oculto de SHA só no primeiro
    const linhas = itens.map(t => `• ${t}`)
    if (primeiro) linhas.push(`[deploy:${shaAtual}]`)

    const { error } = await db.from('system_updates').insert({
      title:       cfg.title,
      description: cfg.description,
      type:        cfg.type,
      module:      cfg.module,
      details:     linhas.join('\n'),
    })

    if (error) {
      console.warn(`[sync-updates] Erro ao inserir "${cfg.title}":`, error.message)
    } else {
      console.log(`[sync-updates] ✓ "${cfg.title}" (${itens.length} item${itens.length > 1 ? 's' : ''})`)
      primeiro = false
    }
  }

  console.log('[sync-updates] Concluído.')
}

main().catch(e => {
  console.error('[sync-updates] Erro:', e.message)
  process.exit(0) // nunca quebra o build
})
