import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'fs'

// Lê .env.local manualmente
const env = Object.fromEntries(
  require('fs').readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const db = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
)

const updates = [
  {
    title:       'Painel de pendências redesenhado',
    description: 'A tela de pendências ganhou visual moderno com fontes maiores, cards maiores, animações e uma ilustração quando não há pendências.',
    type:        'feature',
    module:      'Notificações',
    details:     'git:03c90f0',
  },
  {
    title:       'Pendências agora abrem em tela cheia',
    description: 'Ao clicar no sino de notificações, as pendências abrem em tela cheia para facilitar a visualização e resolução.',
    type:        'feature',
    module:      'Notificações',
    details:     'git:72853f6',
  },
  {
    title:       'Sino de notificações no painel e na barra lateral',
    description: 'O ícone de notificações agora aparece no painel principal e ao lado do botão Sair na barra lateral, sempre acessível.',
    type:        'feature',
    module:      'Painel Admin',
    details:     'git:4d172eb',
  },
  {
    title:       'Dica de pontuação no formulário de feedback',
    description: 'O aluno agora vê quantos pontos ganha ao enviar um feedback antes mesmo de enviá-lo.',
    type:        'feature',
    module:      'Feedbacks',
    details:     'git:2a5cff6',
  },
  {
    title:       'Logo do sistema corrigida',
    description: 'A logo do Chronos Lab estava com proporção incorreta na barra lateral. Agora aparece com o tamanho e proporção corretos.',
    type:        'fix',
    module:      'Interface',
    details:     'git:0b92f1d',
  },
  {
    title:       'Pontuação de feedback restaurada',
    description: 'Os pontos por feedback voltaram aos valores originais: +10 ao enviar, +25 quando implementado e +50 quando destacado.',
    type:        'fix',
    module:      'Gamificação',
    details:     'git:352c3a6',
  },
  {
    title:       'Posicionamento do ícone de notificações ajustado',
    description: 'O ícone de sino foi reposicionado corretamente ao lado do botão Sair, sem gerar espaços extras na interface.',
    type:        'fix',
    module:      'Interface',
    details:     'git:860c42c',
  },
]

async function main() {
  console.log(`Inserindo ${updates.length} entradas...`)
  for (const u of updates) {
    const { error } = await db.from('system_updates').insert(u)
    if (error) console.warn(`✗ "${u.title}":`, error.message)
    else       console.log(`✓ "${u.title}"`)
  }
  console.log('Concluído.')
}

main()
