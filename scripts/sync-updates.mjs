/**
 * sync-updates.mjs
 * Roda no postbuild. Conta commits novos por tipo e insere
 * um registro por tipo na tabela system_updates do Supabase.
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SK  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SK) {
  console.log('[sync-updates] Variáveis Supabase ausentes — pulando.')
  process.exit(0)
}

// Texto fixo e amigável por tipo de commit
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
    title:       'Melhorias de desempenho',
    description: 'O sistema ficou mais rápido e estável nesta versão.',
    module:      'Sistema',
  },
  refactor: {
    type:        'improvement',
    title:       'Melhorias internas',
    description: 'Ajustes e otimizações foram aplicados para melhor funcionamento.',
    module:      'Sistema',
  },
}

const PREFIXOS = Object.keys(TEXTOS)

async function main() {
  console.log('[sync-updates] Verificando commits novos...')

  const db = createClient(SUPABASE_URL, SUPABASE_SK)

  // Data do último update publicado
  const { data: ultimo } = await db
    .from('system_updates')
    .select('created_at')
    .like('details', 'git:%')
    .order('created_at', { ascending: false })
    .limit(1)

  let filtroGit = '-30'
  if (ultimo?.length > 0) {
    const dt = new Date(new Date(ultimo[0].created_at).getTime() - 60_000)
    filtroGit = `--after="${dt.toISOString()}"`
  }

  let log = ''
  try {
    log = execSync(
      `git log ${filtroGit} --pretty=format:"%H|||%s" --no-merges`,
      { encoding: 'utf8' }
    ).trim()
  } catch {
    console.log('[sync-updates] Não foi possível ler git log.')
    process.exit(0)
  }

  if (!log) {
    console.log('[sync-updates] Nenhum commit novo.')
    return
  }

  // Agrupa commits por tipo
  const porTipo = {}
  for (const linha of log.split('\n')) {
    const [hash, subject] = linha.split('|||')
    if (!hash || !subject) continue

    const prefixo = subject.trim().match(/^(\w+)/)?.[1]?.toLowerCase()
    if (!PREFIXOS.includes(prefixo)) continue

    // Normaliza perf/refactor → 'perf' para agrupar em "Melhorias"
    const chave = ['perf', 'refactor'].includes(prefixo) ? 'perf' : prefixo

    if (!porTipo[chave]) porTipo[chave] = []
    porTipo[chave].push(hash.trim())
  }

  const tipos = Object.keys(porTipo)
  console.log(`[sync-updates] Tipos encontrados: ${tipos.join(', ') || 'nenhum'}`)

  if (tipos.length === 0) {
    console.log('[sync-updates] Nada a publicar.')
    return
  }

  // Insere um registro por tipo
  for (const chave of tipos) {
    const hashes = porTipo[chave]
    const cfg    = TEXTOS[chave]

    // Verifica se algum hash desse grupo já foi inserido
    let jaExiste = false
    for (const hash of hashes) {
      const { data } = await db
        .from('system_updates')
        .select('id')
        .eq('details', `git:${hash}`)
        .limit(1)
      if (data?.length > 0) { jaExiste = true; break }
    }

    if (jaExiste) {
      console.log(`[sync-updates] Já publicado: ${cfg.title}`)
      continue
    }

    const { error } = await db.from('system_updates').insert({
      title:       cfg.title,
      description: cfg.description,
      type:        cfg.type,
      module:      cfg.module,
      details:     `git:${hashes[0]}`, // hash representativo do grupo
    })

    if (error) {
      console.warn(`[sync-updates] Erro ao inserir "${cfg.title}":`, error.message)
    } else {
      console.log(`[sync-updates] ✓ "${cfg.title}" publicado.`)
    }
  }

  console.log('[sync-updates] Concluído.')
}

main().catch(e => {
  console.error('[sync-updates] Erro:', e.message)
  process.exit(0)
})
