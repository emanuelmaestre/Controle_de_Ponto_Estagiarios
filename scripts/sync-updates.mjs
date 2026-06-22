/**
 * sync-updates.mjs
 * Roda no postbuild. Lê commits novos do Git e publica no módulo
 * "Atualizações do Sistema" do Supabase automaticamente.
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SK  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SK) {
  console.log('[sync-updates] Variáveis Supabase ausentes — pulando.')
  process.exit(0)
}

// ── Commits que valem publicar ────────────────────────────────────────────────
// chore / test / docs / ci são internos e nunca aparecem para o usuário
const PREFIXOS_VALIDOS = ['feat', 'fix', 'perf', 'refactor', 'improvement']

// ── Mapeamento de prefixo → type da tabela ────────────────────────────────────
function resolverType(prefixo) {
  if (prefixo === 'feat')                       return 'feature'
  if (prefixo === 'fix')                        return 'fix'
  if (['perf', 'refactor', 'improvement'].includes(prefixo)) return 'improvement'
  return 'feature'
}

// ── Mensagem técnica → texto amigável ─────────────────────────────────────────
function humanizar(subject) {
  // Remove prefixo convencional: "feat(admin): texto" → "texto"
  let texto = subject
    .replace(/^(feat|fix|perf|refactor|improvement)(\([^)]+\))?:\s*/i, '')
    .trim()

  // Capitaliza primeira letra
  texto = texto.charAt(0).toUpperCase() + texto.slice(1)

  // Substitui termos técnicos comuns
  const substituicoes = [
    [/\bsidebar\b/gi,       'barra lateral'],
    [/\bheader\b/gi,        'cabeçalho'],
    [/\bfooter\b/gi,        'rodapé'],
    [/\bbadge\b/gi,         'selo'],
    [/\bmodal\b/gi,         'janela'],
    [/\bdropdown\b/gi,      'menu'],
    [/\btoast\b/gi,         'notificação rápida'],
    [/\blayout\b/gi,        'layout'],
    [/\bbutton\b/gi,        'botão'],
    [/\bcard\b/gi,          'card'],
    [/\brefactor\b/gi,      'melhoria interna'],
    [/\bfix\b/gi,           'correção'],
    [/\bbug\b/gi,           'problema'],
    [/\bAPI\b/g,            'sistema'],
    [/\broute\b/gi,         'página'],
    [/\btypo\b/gi,          'erro de texto'],
    [/\bperformance\b/gi,   'desempenho'],
    [/\bresponsivo?\b/gi,   'adaptação para celular'],
    [/\bui\b/gi,            'interface'],
    [/\bux\b/gi,            'experiência do usuário'],
    [/\banimac[aã]o\b/gi,   'animação'],
    [/\bpendencias\b/gi,    'pendências'],
    [/\bsino\b/gi,          'ícone de notificações'],
    [/\bicon[e]?\b/gi,      'ícone'],
    [/\bdeployment?\b/gi,   'publicação'],
    [/\bcors?\b/gi,         'segurança'],
  ]

  for (const [de, para] of substituicoes) {
    texto = texto.replace(de, para)
  }

  return texto
}

// ── Detecta módulo pelo conteúdo do commit ────────────────────────────────────
function detectarModulo(subject) {
  const s = subject.toLowerCase()
  if (s.includes('admin') || s.includes('painel') || s.includes('sidebar'))  return 'Painel Admin'
  if (s.includes('sino') || s.includes('notif') || s.includes('pendenc'))    return 'Notificações'
  if (s.includes('ranking') || s.includes('gamif') || s.includes('pontos'))  return 'Gamificação'
  if (s.includes('perfil') || s.includes('profile') || s.includes('foto'))   return 'Perfil'
  if (s.includes('relat') || s.includes('report'))                           return 'Relatórios'
  if (s.includes('clock') || s.includes('ponto') || s.includes('entrada'))   return 'Registro de Ponto'
  if (s.includes('logo') || s.includes('layout') || s.includes('ui'))        return 'Interface'
  if (s.includes('feedback'))                                                 return 'Feedbacks'
  if (s.includes('config') || s.includes('setting'))                         return 'Configurações'
  if (s.includes('login') || s.includes('auth') || s.includes('senha'))      return 'Autenticação'
  return null
}

async function main() {
  console.log('[sync-updates] Verificando commits novos...')

  const db = createClient(SUPABASE_URL, SUPABASE_SK)

  // Pega a data do update mais recente já publicado
  const { data: ultimo } = await db
    .from('system_updates')
    .select('created_at, details')
    .order('created_at', { ascending: false })
    .limit(1)

  let filtroGit = '-20' // fallback: últimos 20 commits
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

  const commits = log.split('\n')
    .map(linha => {
      const [hash, subject] = linha.split('|||')
      return { hash: hash?.trim(), subject: subject?.trim() }
    })
    .filter(c => {
      if (!c.hash || !c.subject) return false
      const prefixo = c.subject.match(/^(\w+)/)?.[1]?.toLowerCase()
      return PREFIXOS_VALIDOS.includes(prefixo)
    })

  console.log(`[sync-updates] ${commits.length} commit(s) para publicar.`)
  if (commits.length === 0) return

  // Verifica quais já foram inseridos (pelo hash no campo details)
  for (const c of commits) {
    const { data: existe } = await db
      .from('system_updates')
      .select('id')
      .eq('details', `git:${c.hash}`)
      .limit(1)

    if (existe?.length > 0) {
      console.log(`[sync-updates] Já publicado: ${c.subject}`)
      continue
    }

    const prefixo = c.subject.match(/^(\w+)/)?.[1]?.toLowerCase() ?? 'feat'
    const titulo  = humanizar(c.subject)
    const type    = resolverType(prefixo)
    const modulo  = detectarModulo(c.subject)

    const descricoes = {
      feature:     'Nova funcionalidade disponível nesta versão.',
      fix:         'Problema corrigido para melhor experiência.',
      improvement: 'Melhoria de desempenho ou usabilidade.',
      announcement:'Aviso importante do sistema.',
    }

    const { error } = await db.from('system_updates').insert({
      title:       titulo,
      description: descricoes[type],
      type,
      module:      modulo,
      details:     `git:${c.hash}`,
    })

    if (error) {
      console.warn(`[sync-updates] Erro ao inserir "${titulo}":`, error.message)
    } else {
      console.log(`[sync-updates] ✓ "${titulo}" publicado.`)
    }
  }

  console.log('[sync-updates] Concluído.')
}

main().catch(e => {
  console.error('[sync-updates] Erro:', e.message)
  process.exit(0) // nunca quebra o build
})
