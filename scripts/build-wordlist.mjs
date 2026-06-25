/**
 * Extrai palavras-base do dicionário Hunspell PT-BR e gera src/lib/wordlist-pt.json
 * Executar uma vez: node scripts/build-wordlist.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '..')

const dicPath  = resolve(root, 'node_modules/dictionary-pt/index.dic')
const outPath  = resolve(root, 'src/lib/wordlist-pt.json')

console.log('Lendo dicionário...')
const raw = readFileSync(dicPath, 'utf-8')
const lines = raw.split('\n')

// Primeira linha é a contagem — pular
const words = new Set()

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  // Remove código de afixo (ex: "limpeza/ABCD" → "limpeza")
  const word = line.split('/')[0].trim()

  // Manter apenas palavras com letras (incluindo acentuadas), sem números ou hífens no início
  if (!word || /^\d/.test(word) || word.length < 2) continue

  // Converter para maiúsculas (padrão do sistema)
  words.add(word.toUpperCase())
}

const arr = Array.from(words).sort()
console.log(`Total de palavras: ${arr.length.toLocaleString('pt-BR')}`)

writeFileSync(outPath, JSON.stringify(arr), 'utf-8')
console.log(`Salvo em: ${outPath}`)
