/**
 * sync-updates.mjs — roda automaticamente no postbuild (Vercel + local).
 *
 * A cada deploy lê os commits do git, detecta o módulo afetado por palavras-chave,
 * humaniza o texto para o usuário final e insere em system_updates.
 * Deduplicação por SHA embutido na última linha do campo details.
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SK  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SK) {
  console.log('[sync-updates] Variáveis Supabase ausentes — pulando.')
  process.exit(0)
}

// ── Config base por tipo de commit ────────────────────────────────────────────
const TIPOS = {
  feat: {
    type:        'feature',
    title:       'Novas funcionalidades disponíveis',
    description: 'O sistema recebeu novidades nesta versão. Confira o que foi adicionado!',
  },
  fix: {
    type:        'fix',
    title:       'Correções aplicadas',
    description: 'Problemas identificados foram corrigidos para garantir uma experiência melhor.',
  },
  perf: {
    type:        'improvement',
    title:       'Melhorias de desempenho e usabilidade',
    description: 'O sistema ficou mais rápido, estável e agradável de usar.',
  },
}

const PREFIXOS_VALIDOS = ['feat', 'fix', 'perf', 'refactor', 'improvement']

function resolverChave(prefixo) {
  if (['perf', 'refactor', 'improvement'].includes(prefixo)) return 'perf'
  return prefixo
}

// ── Mapeamento de palavras-chave → módulo do sistema ─────────────────────────
// A PRIMEIRA regra que casar vence (ordem importa)
const MAPA_MODULOS = [
  { palavras: ['historico', 'history', 'time_record', 'clock_in', 'clock_out'], modulo: 'Histórico de Ponto' },
  { palavras: ['atividade', 'activit'],                                           modulo: 'Registro de Atividades' },
  { palavras: ['notificac', 'notification', 'bell', 'sino', 'pendencia'],        modulo: 'Notificações' },
  { palavras: ['ranking', 'gamificac'],                                           modulo: 'Ranking' },
  { palavras: ['pontuac', 'pontos', 'xp', 'badge'],                              modulo: 'Gamificação' },
  { palavras: ['feedback', 'sugestao', 'sugestão'],                              modulo: 'Feedbacks' },
  { palavras: ['system_update', 'atualizac', 'sync-update', 'novidade'],        modulo: 'Atualizações' },
  { palavras: ['relatorio', 'relatório', 'report', 'export', 'pdf', 'xlsx'],    modulo: 'Relatórios' },
  { palavras: ['auth', 'login', 'signout', 'senha', 'session'],                 modulo: 'Autenticação' },
  { palavras: ['perfil', 'profile', 'foto', 'avatar'],                          modulo: 'Perfil' },
  { palavras: ['sidebar', 'barra lateral', 'nav'],                              modulo: 'Navegação' },
  { palavras: ['admin', 'painel admin', 'gestor'],                              modulo: 'Painel Admin' },
  { palavras: ['ponto', 'registro', 'entrada', 'saida', 'saída'],              modulo: 'Registro de Ponto' },
  { palavras: ['dashboard', 'inicio', 'início', 'home'],                        modulo: 'Painel Principal' },
  { palavras: ['api', 'rota', 'route', 'endpoint'],                             modulo: 'Sistema' },
]

function detectarModulo(texto) {
  const lower = texto.toLowerCase()
  for (const { palavras, modulo } of MAPA_MODULOS) {
    if (palavras.some(p => lower.includes(p))) return modulo
  }
  return 'Sistema'
}

// ── Substituições de termos técnicos por linguagem do usuário ─────────────────
const SUBSTITUICOES = [
  [/\bdrawer\b/gi,          'painel deslizante'],
  [/\bui\/ux\b/gi,          'interface'],
  [/\bredesign\b/gi,        'visual renovado'],
  [/\bmodal\b/gi,           'janela'],
  [/\btoast\b/gi,           'notificação rápida'],
  [/\bbutton\b/gi,          'botão'],
  [/\bcard\b/gi,            'cartão'],
  [/\bbadge\b/gi,           'selo'],
  [/\bdeduplicac[aã]o\b/gi, 'verificação de duplicatas'],
  [/\bsha\b/gi,             ''],
  [/\bclock[_\s]?in\b/gi,   'entrada'],
  [/\bclock[_\s]?out\b/gi,  'saída'],
  [/\btime[_\s]?record\b/gi,'registro de ponto'],
  [/\bscroll\b/gi,          'rolagem'],
  [/\blayout\b/gi,          'layout'],
  [/\bspring\b/gi,          ''],
  [/\banimate?[a-z]*\b/gi,  'animação'],
  [/\bstagger\b/gi,         ''],
  [/\bfix\b/gi,             'corrigi'],
  [/\bfeedback\s+visual\b/gi, 'resposta visual ao usuário'],
  [/\bfeedback\b/gi,        'retorno'],
  [/\btimestamp\b/gi,       'horário'],
  [/\bdelete\b/gi,          'exclusão'],
  [/\bpatch\b/gi,           'atualização'],
  [/\bquery\b/gi,           'consulta'],
  [/\bnull\b/gi,            ''],
  [/\badd\b/gi,             'adicionar'],
  [/\bsync\b/gi,            'sincronização'],
  [/\bdeploy\b/gi,          'publicação'],
  [/\bscript\b/gi,          'automação'],
  [/\s{2,}/g,               ' '],   // espaços duplos
]

// Remove prefixo convencional, aplica substituições e capitaliza
function humanizar(subject) {
  // Remove "feat:", "fix(module):", "refactor!:", etc.
  let texto = subject.replace(/^\w+(\([^)]+\))?!?\s*:\s*/i, '').trim()

  // Substitui termos técnicos
  for (const [re, sub] of SUBSTITUICOES) {
    texto = texto.replace(re, sub)
  }

  // Remove hífens/underscores sobrando, múltiplos espaços, trim
  texto = texto.replace(/[-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim()

  // Capitaliza
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

async function main() {
  console.log('[sync-updates] Iniciando...')

  const db = createClient(SUPABASE_URL, SUPABASE_SK)

  // SHA do commit atual (Vercel injeta VERCEL_GIT_COMMIT_SHA; fallback: git)
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
    .ilike('details', `%[deploy:${shaAtual}]`)
    .limit(1)

  if (jaFeito?.length > 0) {
    console.log('[sync-updates] Este deploy já foi sincronizado — pulando.')
    return
  }

  // Lê commits desde o último deploy publicado
  const { data: ultimoPublicado } = await db
    .from('system_updates')
    .select('created_at')
    .ilike('details', '%[deploy:%')
    .order('created_at', { ascending: false })
    .limit(1)

  let filtroGit = '-50'
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

  // Agrupa commits por chave (feat / fix / perf)
  // Cada item: { texto humanizado, modulo detectado }
  const grupos = {}
  for (const subject of log.split('\n')) {
    const s = subject.trim()
    if (!s) continue
    const prefixo = s.match(/^(\w+)/)?.[1]?.toLowerCase()
    if (!prefixo || !PREFIXOS_VALIDOS.includes(prefixo)) continue
    const chave = resolverChave(prefixo)
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push({
      texto:  humanizar(s),
      modulo: detectarModulo(s),
    })
  }

  const chaves = Object.keys(grupos)
  console.log(`[sync-updates] Tipos detectados: ${chaves.join(', ') || 'nenhum'}`)

  if (chaves.length === 0) {
    console.log('[sync-updates] Nenhum commit publicável neste deploy.')
    return
  }

  // Insere um registro por tipo.
  // details: bullets "Módulo → Texto" + SHA oculto na última linha
  let primeiro = true
  for (const chave of chaves) {
    const cfg   = TIPOS[chave]
    const itens = grupos[chave]

    // Detecta o módulo dominante (o que aparece mais vezes)
    const contagemModulos = {}
    for (const { modulo } of itens) {
      contagemModulos[modulo] = (contagemModulos[modulo] ?? 0) + 1
    }
    const moduloDominante = Object.entries(contagemModulos)
      .sort((a, b) => b[1] - a[1])[0][0]

    // Bullets: "NomeDoMódulo → Descrição do que mudou"
    const linhas = itens.map(({ texto, modulo }) => `${modulo} → ${texto}`)
    if (primeiro) linhas.push(`[deploy:${shaAtual}]`)

    const { error } = await db.from('system_updates').insert({
      title:       cfg.title,
      description: cfg.description,
      type:        cfg.type,
      module:      moduloDominante,
      details:     linhas.join('\n'),
    })

    if (error) {
      console.warn(`[sync-updates] Erro ao inserir "${cfg.title}":`, error.message)
    } else {
      console.log(`[sync-updates] ✓ "${cfg.title}" — módulo: ${moduloDominante} (${itens.length} item${itens.length > 1 ? 's' : ''})`)
      primeiro = false
    }
  }

  console.log('[sync-updates] Concluído.')
}

main().catch(e => {
  console.error('[sync-updates] Erro:', e.message)
  process.exit(0)
})
