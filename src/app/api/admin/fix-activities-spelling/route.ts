import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/route-auth'
import wordlistRaw from '@/lib/wordlist-pt.json'

// ── Dicionário PT-BR (311.641 palavras — Hunspell) ──────────
const VOCABULARIO: string[] = wordlistRaw as string[]

// Lookup O(1) para palavras corretas
const VOCAB_SET = new Set(VOCABULARIO)

// Índice por comprimento para pré-filtro ultrarrápido: Map<len, word[]>
const BY_LENGTH = new Map<number, string[]>()
for (const w of VOCABULARIO) {
  const len = w.length
  if (!BY_LENGTH.has(len)) BY_LENGTH.set(len, [])
  BY_LENGTH.get(len)!.push(w)
}

// ── Levenshtein ──────────────────────────────────────────────
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

// ── Correção de palavra individual ───────────────────────────
function corrigirPalavra(palavra: string): string {
  if (palavra.length <= 2) return palavra
  if (VOCAB_SET.has(palavra)) return palavra

  const limite = palavra.length <= 5 ? 1 : palavra.length <= 8 ? 2 : 3
  let melhor = palavra, menorDist = Infinity

  // Busca apenas nos buckets de comprimento próximo (pré-filtro O(k) em vez de O(n))
  for (let delta = 0; delta <= limite; delta++) {
    for (const len of [palavra.length - delta, palavra.length + delta]) {
      if (len < 2) continue
      const candidatos = BY_LENGTH.get(len) ?? []
      for (const ref of candidatos) {
        const d = levenshtein(palavra, ref)
        if (d < menorDist) { menorDist = d; melhor = ref }
        if (d === 0) return ref
      }
    }
    // Se já encontrou uma correspondência perfeita no delta atual, não precisa ir mais longe
    if (menorDist <= delta) break
  }

  return menorDist <= limite ? melhor : palavra
}

// ── Correção de texto completo ───────────────────────────────
function corrigirOrtografia(texto: string): string {
  const upper = texto.toUpperCase()
  return upper.split(/(\s+|[^A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]+)/).map(token => {
    if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]+$/.test(token)) return corrigirPalavra(token)
    return token
  }).join('')
}

function normalizar(texto: string): string {
  return corrigirOrtografia(texto.trim())
}

// ── Handler ──────────────────────────────────────────────────
export async function POST() {
  try {
    const auth = await requireManager()
    if (!auth.ok) return auth.response

    const db = createSupabaseServiceClient()

    const { data: activities, error } = await db
      .from('activities')
      .select('id, description')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!activities?.length) return NextResponse.json({ updated: 0, message: 'Nenhuma atividade encontrada.' })

    const toUpdate = activities
      .map(a => ({ id: a.id, original: a.description, corrected: normalizar(a.description) }))
      .filter(a => a.original !== a.corrected)

    if (!toUpdate.length) {
      return NextResponse.json({ updated: 0, message: 'Todas as atividades já estão corretas.' })
    }

    const results = await Promise.all(
      toUpdate.map(({ id, corrected }) =>
        db.from('activities').update({ description: corrected }).eq('id', id)
      )
    )

    const errors = results.filter(r => r.error).map(r => r.error?.message)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 500 })

    return NextResponse.json({
      updated: toUpdate.length,
      corrections: toUpdate.map(a => `"${a.original}" → "${a.corrected}"`),
    })
  } catch (err) {
    console.error('[fix-activities-spelling]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
