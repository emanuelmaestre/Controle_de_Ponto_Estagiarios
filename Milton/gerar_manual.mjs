import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, HeadingLevel, TableOfContents,
} from 'docx'
import { writeFileSync } from 'fs'

// ── Paleta ────────────────────────────────────────────
const COR = {
  verde:      '1a7a3a',
  verdeEscuro:'0d4a20',
  verdeClaro: 'e8f5ec',
  verdeTable: '1a7a3a',
  texto:      '1a1a1a',
  cinza:      '666666',
  cinzaClaro: 'f2f4f2',
  branco:     'FFFFFF',
  listra:     'f2f4f2',
}

const FONTE = 'Arial'
const TW = 9360

// ── Helpers ───────────────────────────────────────────
const t = (text, opts = {}) => new TextRun({
  text, font: FONTE,
  color: opts.color ?? COR.texto,
  size: opts.size ?? 22,
  bold: opts.bold ?? false,
  italics: opts.italic ?? false,
})

const p = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: opts.align ?? AlignmentType.LEFT,
  spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
  ...(opts.indent ? { indent: { left: opts.indent } } : {}),
  ...(opts.border ? { border: opts.border } : {}),
})

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 240, after: 160 },
  children: [new TextRun({ text, font: FONTE, bold: true, color: COR.verdeEscuro, size: 36 })],
})

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 120 },
  children: [new TextRun({ text, font: FONTE, bold: true, color: COR.verde, size: 28 })],
})

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 160, after: 80 },
  children: [new TextRun({ text, font: FONTE, bold: true, color: COR.verde, size: 24 })],
})

const borda = { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' }
const bordas = { top: borda, bottom: borda, left: borda, right: borda }
const margens = { top: 80, bottom: 80, left: 120, right: 120 }

const celHeader = (text, w) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders: bordas,
  shading: { fill: COR.verdeTable, type: ShadingType.CLEAR },
  margins: margens,
  verticalAlign: VerticalAlign.CENTER,
  children: [p(t(text, { color: COR.branco, bold: true, size: 20 }), { align: AlignmentType.CENTER })],
})

const cel = (text, w, shade = COR.cinzaClaro, bold = false, center = false) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders: bordas,
  shading: { fill: shade, type: ShadingType.CLEAR },
  margins: margens,
  children: [p(t(text, { bold, size: 20 }), { align: center ? AlignmentType.CENTER : AlignmentType.LEFT })],
})

const tbl = (rows, cols) => new Table({
  width: { size: TW, type: WidthType.DXA },
  columnWidths: cols,
  rows,
})

const bullet = (text) => new Paragraph({
  style: 'ListParagraph',
  numbering: { reference: 'bullets', level: 0 },
  spacing: { before: 40, after: 40 },
  children: [t(text)],
})

const espaço = () => new Paragraph({ spacing: { before: 80, after: 0 }, children: [new TextRun('')] })

const linhaDivisora = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COR.verde, space: 1 } },
  spacing: { before: 80, after: 80 },
  children: [new TextRun('')],
})

const tbl2 = (linhas) => {
  const rows = linhas.map((linha, i) => {
    const shade = i === 0 ? COR.verdeTable : (i % 2 === 1 ? COR.cinzaClaro : COR.branco)
    if (i === 0) {
      return new TableRow({ children: [celHeader(linha[0], 3600), celHeader(linha[1], 5760)] })
    }
    return new TableRow({
      children: [
        cel(linha[0], 3600, shade, true),
        cel(linha[1], 5760, shade === COR.cinzaClaro ? COR.cinzaClaro : COR.branco),
      ],
    })
  })
  return tbl(rows, [3600, 5760])
}

// ── CABEÇALHO / RODAPÉ ────────────────────────────────
const header = new Header({
  children: [
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COR.verde, space: 1 } },
      spacing: { before: 0, after: 80 },
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'ChronosLab — Manual Técnico v3.0', font: FONTE, size: 18, color: COR.cinza })],
    }),
  ],
})

const footer = new Footer({
  children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: COR.verde, space: 1 } },
      spacing: { before: 80, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Página ', font: FONTE, size: 18, color: COR.cinza }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: 18, color: COR.cinza }),
        new TextRun({ text: ' de ', font: FONTE, size: 18, color: COR.cinza }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONTE, size: 18, color: COR.cinza }),
      ],
    }),
  ],
})

// ── CAPA ──────────────────────────────────────────────
const capa = [
  new Paragraph({ spacing: { before: 2400, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'CHRONOSLAB', font: FONTE, bold: true, color: COR.verde, size: 72 })] }),
  new Paragraph({ spacing: { before: 120, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Sistema de Controle de Ponto para Estagiários', font: FONTE, color: '555555', size: 28 })] }),
  new Paragraph({ spacing: { before: 80, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Laboratório de Informática — IFSULDEMINAS', font: FONTE, color: '888888', size: 22 })] }),
  espaço(),
  new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: [TW],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: TW, type: WidthType.DXA },
      borders: { top: borda, bottom: borda, left: borda, right: borda },
      shading: { fill: COR.cinzaClaro, type: ShadingType.CLEAR },
      margins: { top: 200, bottom: 200, left: 300, right: 300 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MANUAL TÉCNICO', font: FONTE, bold: true, color: COR.verdeEscuro, size: 36 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Versão 3.0 — Junho de 2026', font: FONTE, color: COR.cinza, size: 22 })] }),
      ],
    })]})],
  }),
  espaço(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 0 },
    children: [new TextRun({ text: 'Desenvolvido por: Emanuel Maestre', font: FONTE, color: COR.cinza, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 0 },
    children: [new TextRun({ text: 'github.com/emanuelmaestre/Controle_de_Ponto_Estagiarios', font: FONTE, color: '888888', size: 20 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 0 },
    children: [new TextRun({ text: 'Deploy: controle-de-ponto-estagiarios.vercel.app', font: FONTE, color: '888888', size: 20 })] }),
]

// ── 1. VISÃO GERAL ─────────────────────────────────────
const sec1 = [
  h1('1. Visão Geral do Projeto'),
  p(t('O ChronosLab é um sistema web de controle de ponto desenvolvido para gerenciar a frequência de estagiários em laboratórios do IFSULDEMINAS. O sistema combina gestão de frequência com gamificação por pontos, níveis e conquistas, incentivando pontualidade, documentação de atividades e consistência.')),
  p(t('Funciona como Progressive Web App (PWA) instalável em celular e desktop, com suporte a notificações push, modo offline limitado e geração de relatórios PDF profissional em 14 formatos distintos.')),
  h2('1.1 Objetivos do Sistema'),
  bullet('Registrar entradas e saídas com validação geográfica opcional e individual por usuário'),
  bullet('Permitir que estagiários documentem atividades realizadas a cada sessão'),
  bullet('Corrigir ortografia das atividades automaticamente com dicionário Hunspell PT-BR (311.641 palavras)'),
  bullet('Fornecer ao gestor painel completo de aprovação, relatórios e gestão'),
  bullet('Gamificar a experiência com pontos, níveis, conquistas e ranking'),
  bullet('Gerar relatórios em PDF profissional para todos os períodos e perfis'),
  bullet('Apresentar novos estagiários ao sistema via tour interativo de onboarding'),
  h2('1.2 Perfis de Usuário'),
  tbl2([
    ['Perfil', 'Descrição e Capacidades'],
    ['intern (estagiário)', 'Acessa dashboard, registra ponto, documenta atividades, visualiza histórico, ranking, conquistas e perfil. Recebe tour de onboarding na primeira visita.'],
    ['manager (gestor)', 'Acesso completo: aprovações, gestão de estagiários (incluindo isenção de geo), relatórios, configurações, hall da fama e publicação de atualizações. Verificação de conta ativa a cada requisição.'],
  ]),
]

// ── 2. STACK ─────────────────────────────────────────
const sec2 = [
  h1('2. Stack Tecnológica'),
  h2('2.1 Frontend'),
  tbl2([
    ['Tecnologia', 'Versão / Detalhe'],
    ['Next.js', '16.2.6 — App Router, Turbopack, Server Components'],
    ['React', '19 — Server e Client Components'],
    ['TypeScript', '5 — tipagem estática completa'],
    ['Tailwind CSS', '4 — utilitários de estilo'],
    ['Framer Motion', '12 — animações declarativas'],
    ['Lucide React', 'ícones SVG'],
  ]),
  h2('2.2 Backend / Infraestrutura'),
  tbl2([
    ['Tecnologia', 'Papel'],
    ['Supabase', 'PostgreSQL + Auth + Storage + RLS'],
    ['Vercel', 'Deploy automático + Cron Jobs + CDN global + Proteção DDoS de borda'],
    ['Web Push API', 'Notificações push com chaves VAPID'],
    ['Sentry', 'Monitoramento de erros e eventos de segurança com persistência de 90 dias'],
    ['Playwright', 'Testes E2E automatizados'],
  ]),
  h2('2.3 Bibliotecas de Produção Relevantes'),
  tbl2([
    ['Pacote', 'Finalidade'],
    ['@react-pdf/renderer v4.5', 'Geração de relatórios PDF tipados, renderizados no servidor'],
    ['bcryptjs', 'Hash do PIN de acesso rápido com 12 rounds de salt'],
    ['dictionary-pt', 'Dicionário Hunspell PT-BR (311.641 palavras base)'],
    ['zod', 'Validação de schemas de formulários e todas as API Routes'],
    ['react-hook-form', 'Gerenciamento de formulários com validação integrada ao Zod'],
    ['@sentry/nextjs', 'Captura de erros, eventos de segurança e alertas em produção'],
  ]),
]

// ── 3. ARQUITETURA ────────────────────────────────────
const sec3 = [
  h1('3. Arquitetura do Sistema'),
  h2('3.1 Clean Architecture'),
  p(t('O sistema adota Clean Architecture com separação clara de responsabilidades em três camadas:')),
  bullet('domain/ — entidades de negócio, enumerações e erros de domínio'),
  bullet('application/ — casos de uso, DTOs e interfaces (portas) dos repositórios'),
  bullet('infra/ — implementações concretas dos repositórios usando o cliente Supabase'),
  p(t('Páginas e rotas da API vivem em src/app/ (convenção App Router). Mudanças de provedor de banco afetam apenas a camada infra/.')),
  h2('3.2 Estrutura de Pastas'),
  tbl2([
    ['Pasta', 'Conteúdo'],
    ['src/app/', 'Páginas Next.js (App Router) e API Routes'],
    ['src/app/dashboard/', 'Painel principal do estagiário'],
    ['src/app/admin/', 'Todas as páginas do gestor'],
    ['src/app/api/', 'API Routes: auth, clock, intern, admin, cron'],
    ['src/components/', 'Componentes reutilizáveis (OnboardingTour, ClockButton, etc.)'],
    ['src/components/pdf/', 'Componentes @react-pdf/renderer: GenericTableReport, FrequenciaIndividual, pdfShared'],
    ['src/lib/', 'Utilitários: gamificação, autenticação, wordlist-pt.json, logger (Sentry integrado)'],
    ['src/domain/', 'Entidades e erros de domínio'],
    ['src/application/', 'Use cases e DTOs'],
    ['src/infra/', 'Implementações Supabase dos repositórios'],
    ['src/types/', 'Tipos TypeScript do banco de dados (database.ts)'],
    ['scripts/', 'sync-updates.mjs, build-wordlist.mjs'],
    ['public/', 'Assets estáticos, ícones PWA, service worker'],
  ]),
  h2('3.3 Fluxo de Autenticação'),
  p(t('O middleware (src/middleware.ts) intercepta todas as requisições e valida a sessão ativa do Supabase. Rotas /admin/* exigem role = manager E is_active = true; rotas /dashboard, /history, /profile e /intern-ranking exigem role = intern. Qualquer acesso não autorizado resulta em redirecionamento para /login.')),
  h2('3.4 Controle de Acesso por Papel'),
  p(t('Implementado em src/lib/route-auth.ts. Funções exportadas:')),
  tbl2([
    ['Função', 'Comportamento'],
    ['requireAuthenticatedUser()', 'Verifica se há sessão ativa. Retorna 401 se não autenticado.'],
    ['requireManager()', 'Verifica role = manager AND is_active = true. Retorna 403 se gestor desativado ou sem permissão.'],
    ['requireIntern()', 'Verifica role = intern. Retorna 403 se não for estagiário.'],
    ['canManageTargetUser(id)', 'Permite ao próprio usuário ou a um manager ativo operar sobre um perfil.'],
  ]),
  h2('3.5 Headers de Segurança HTTP'),
  bullet('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload — HTTPS obrigatório por 2 anos'),
  bullet('X-Frame-Options: DENY — previne clickjacking'),
  bullet('X-Content-Type-Options: nosniff — evita MIME sniffing'),
  bullet('X-XSS-Protection: 1; mode=block — proteção XSS em navegadores legados'),
  bullet('Referrer-Policy: strict-origin-when-cross-origin'),
  bullet('Permissions-Policy: camera=(self), microphone=(), geolocation=(self)'),
]

// ── 4. BANCO DE DADOS ─────────────────────────────────
const sec4 = [
  h1('4. Banco de Dados'),
  h2('4.1 Tabelas Principais'),
  tbl2([
    ['Tabela', 'Descrição'],
    ['profiles', 'Perfil do usuário: full_name, email, role, photo_url, points, level, streak_days, geo_exempt, pin (bcrypt hash), is_active, total_hours_required'],
    ['time_records', 'Registros de ponto: clock_in, clock_out, duration_minutes, status (pending/approved/rejected), rejection_reason, geo_lat, geo_lng'],
    ['activities', 'Atividades por registro: description (corrigida pelo Hunspell), time_record_id (FK)'],
    ['intern_schedules', 'Grade horária semanal por estagiário: day_of_week, expected_start, expected_end'],
    ['achievements', 'Conquistas desbloqueadas: intern_id, type, unlocked_at'],
    ['settings', 'Configurações do laboratório: lab_name, geo_lat, geo_lng, geo_radius_meters, expected_daily_hours'],
    ['system_updates', 'Novidades publicadas automaticamente a cada deploy via sync-updates.mjs'],
    ['feedback', 'Feedbacks dos estagiários e respostas do gestor'],
    ['push_subscriptions', 'Endpoints de notificação push por dispositivo: endpoint, p256dh, auth'],
    ['location_attempts', 'Log de tentativas de ponto com coordenadas e motivo de bloqueio'],
  ]),
  h2('4.2 Campo geo_exempt (profiles)'),
  p(t('Coluna booleana para isenção individual de validação de geolocalização:')),
  bullet('Tipo: boolean NOT NULL DEFAULT false'),
  bullet('SQL: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS geo_exempt boolean NOT NULL DEFAULT false;'),
  bullet('Ativação manual: UPDATE profiles SET geo_exempt = true WHERE email = \'usuario@email.com\';'),
  bullet('Interface: toggle "Isento de Geolocalização" em /admin/interns/[id]?tab=cadastro'),
  h2('4.3 Row Level Security (RLS)'),
  p(t('Cada estagiário pode visualizar e modificar apenas seus próprios registros por meio do cliente autenticado do Supabase. O gestor acessa todos os dados via service_role key, utilizado exclusivamente em API Routes do servidor — jamais exposto ao navegador. A rota /api/profile/update utiliza o cliente autenticado do usuário para atualizações de perfil, respeitando o RLS, e reserva a service_role key apenas para operações de storage de foto.')),
  h2('4.4 Views e Funções PostgreSQL'),
  bullet('monthly_summary — agrega horas aprovadas por estagiário no mês corrente'),
  bullet('intern_ranking — ordena estagiários por pontos com posição calculada'),
  bullet('Funções de limpeza e atualização de streaks chamadas pelo Cron Job diário'),
]

// ── 5. API ROUTES ─────────────────────────────────────
const sec5 = [
  h1('5. API Routes'),
  h2('5.1 Autenticação (/api/auth/**)'),
  tbl2([
    ['Rota', 'Método / Função'],
    ['/api/auth/signout', 'POST — encerra sessão Supabase e limpa cookies'],
    ['/api/auth/verify-pin', 'POST — valida PIN bcrypt, gera sessão via magic link, registra falhas no Sentry'],
    ['/api/auth/change-pin', 'POST — atualiza pin_hash do usuário com bcrypt salt 12'],
    ['/api/auth/forgot-password', 'POST — envia link de redefinição por e-mail'],
    ['/api/auth/change-password', 'POST — requer senha atual; valida mínimo de 6 caracteres'],
  ]),
  h2('5.2 Ponto (/api/clock/**)'),
  tbl2([
    ['Rota', 'Método / Função'],
    ['/api/clock/in', 'POST — valida geolocalização (se geo_exempt=false) com fórmula Haversine; insere time_record com status=pending'],
    ['/api/clock/out', 'POST — calcula duration_minutes, salva atividades com correção Hunspell, aciona engine de gamificação'],
  ]),
  h2('5.3 Estagiário (/api/intern/**)'),
  tbl2([
    ['Rota', 'Descrição'],
    ['/api/intern/activities', 'POST/PATCH — salva atividades com correção Hunspell automática'],
    ['/api/intern/reports', 'GET — gera PDF de frequência individual via @react-pdf/renderer'],
    ['/api/intern/feedback', 'POST — envia feedback (+10 pts ao estagiário)'],
    ['/api/intern/push-subscribe', 'POST — registra endpoint de notificação push por dispositivo'],
  ]),
  h2('5.4 Gestor (/api/admin/**)'),
  tbl2([
    ['Rota', 'Descrição'],
    ['/api/admin/approve', 'POST — aprova registro; confirma pontos e conquistas'],
    ['/api/admin/reject', 'POST — rejeita com motivo; notifica estagiário'],
    ['/api/admin/interns', 'POST/PATCH — cria/edita estagiário; suporta geo_exempt'],
    ['/api/admin/reports-catalog', 'GET — catálogo dos 14 tipos de PDF com metadados'],
    ['/api/admin/reports', 'GET — gera PDF específico via @react-pdf/renderer; retorna application/pdf'],
    ['/api/admin/settings', 'GET/POST — configurações do laboratório e geolocalização'],
    ['/api/admin/fix-activities-spelling', 'POST — aplica Hunspell retroativamente em todas as atividades'],
    ['/api/admin/push-notify', 'POST — envia push para estagiário específico ou todos'],
    ['/api/admin/system-updates', 'GET/POST/DELETE — gerencia publicações de novidades'],
  ]),
  h2('5.5 Cron (/api/cron/maintenance)'),
  p(t('Executado diariamente às 03h00 UTC pela Vercel. Autenticado por CRON_SECRET no cabeçalho Authorization: Bearer. Realiza:')),
  bullet('Correção ortográfica retroativa com Hunspell em atividades pendentes'),
  bullet('Normalização de nomes (inicial maiúscula, remoção de espaços extras)'),
  bullet('Atualização de streaks: zera streak_days de estagiários ausentes em dia agendado'),
]

// ── 6. GERAÇÃO DE PDF ─────────────────────────────────
const sec6 = [
  h1('6. Relatórios e Geração de PDF'),
  h2('6.1 Motor de PDF — @react-pdf/renderer v4.5'),
  p(t('Todos os relatórios são gerados no servidor por componentes React tipados com @react-pdf/renderer. O design é padronizado via componentes compartilhados em src/components/pdf/:')),
  tbl2([
    ['Componente', 'Função'],
    ['pdfShared.tsx', 'Paleta de cores, estilos base, cabeçalho, rodapé, card de métricas. Título com escala automática de fonte (>38 chars → 13pt, >28 → 15pt, padrão 17pt).'],
    ['GenericTableReport.tsx', 'Tabela genérica com suporte a colunas de largura fixa (pt), flex, e alinhamento (left/center/right) via prop align.'],
    ['FrequenciaIndividual.tsx', 'Relatório de frequência individual com timeline e atividades por sessão.'],
  ]),
  h2('6.2 Catálogo de Relatórios (14 tipos)'),
  tbl2([
    ['Relatório', 'Descrição'],
    ['Ficha Completa', 'Dados cadastrais completos de todos os estagiários ativos'],
    ['Detalhamento da Carga Horária', 'Horas por estagiário com percentual de cumprimento'],
    ['Resumo por Estagiário', 'Consolidado de horas, atividades, atrasos e aprovações'],
    ['Diário de Ponto', 'Todos os registros do período com data, entrada, saída, duração e status'],
    ['Horas por Curso', 'Agrupamento de horas aprovadas por curso'],
    ['Próximos do Encerramento', 'Estagiários com carga horária ≥ 70% cumprida'],
    ['Frequência Individual', 'Relatório detalhado de um estagiário específico'],
    ['Classificação Geral por Pontos', 'Ranking completo com nível e pontos de cada estagiário'],
    ['Ranking de Pontualidade', 'Classificação por taxa de pontualidade'],
    ['Ranking de Atividades Documentadas', 'Classificação por quantidade de atividades registradas'],
    ['Hall da Fama — Todos os Tempos', 'Campeões históricos mensais com sequência de títulos'],
    ['Estagiários ≥ 70%', 'Lista filtrada de estagiários próximos ao encerramento'],
    ['Resumo Executivo', 'Visão consolidada do período para apresentação institucional'],
    ['Mapa de Presença', 'Grade dia × estagiário com marcação de presença/ausência'],
  ]),
  h2('6.3 Convenções dos PDFs'),
  bullet('Todas as informações textuais são exibidas em MAIÚSCULAS para padronização'),
  bullet('Colunas de código/número usam alinhamento centralizado; textos longos usam flex: 1'),
  bullet('Supervisor fixo: Prof. Milton Antônio Naves (não usa nome do gestor logado)'),
  bullet('Gerado no servidor — retornado como Content-Type: application/pdf; sem gravação em disco'),
]

// ── 7. GAMIFICAÇÃO ────────────────────────────────────
const sec7 = [
  h1('7. Sistema de Gamificação'),
  p(t('Implementado em src/lib/gamification.ts. Acionado pela API Route de clock-out e nas aprovações do gestor.')),
  h2('7.1 Pontuação por Sessão'),
  tbl2([
    ['Evento', 'Pontos'],
    ['Presença diária', '+10 pts'],
    ['Pontualidade (entrada em até 15 min do horário)', '+5 pts'],
    ['Atividade documentada (ao menos 1)', '+5 pts'],
    ['Sessão completa (duração mínima do turno)', '+3 pts'],
    ['Feedback implementado pelo gestor', '+25 pts'],
  ]),
  h2('7.2 Multiplicadores de Streak'),
  tbl2([
    ['Sequência de dias', 'Multiplicador'],
    ['Menos de 3 dias', '× 1,0 (sem bônus)'],
    ['3 dias consecutivos', '× 1,2'],
    ['7 dias consecutivos', '× 1,5'],
    ['30 dias consecutivos', '× 2,0'],
  ]),
  h2('7.3 Níveis de Progressão'),
  tbl2([
    ['Nível', 'Título', 'Pontos necessários'],
    ['1', 'Novato / Novata', '0 pts'],
    ['2', 'Aprendiz', '250 pts'],
    ['3', 'Colaborador / Colaboradora', '600 pts'],
    ['4', 'Dedicado / Dedicada', '1.200 pts'],
    ['5', 'Especialista', '2.500 pts'],
    ['6', 'Elite', '5.000 pts'],
  ]),
  h2('7.4 Conquistas (15 desbloqueáveis)'),
  bullet('Primeira presença, 7 dias de streak, 30 dias de streak'),
  bullet('100% da carga mensal cumprida'),
  bullet('Foto de perfil adicionada, nome completo sem abreviações'),
  bullet('50h, 100h, 200h acumuladas aprovadas'),
  bullet('Marcos de pontuação: 500, 1.000, 2.500 e 5.000 pts'),
]

// ── 8. CORREÇÃO ORTOGRÁFICA ───────────────────────────
const sec8 = [
  h1('8. Correção Ortográfica de Atividades'),
  h2('8.1 Dicionário Hunspell PT-BR'),
  p(t('O sistema utiliza o dicionário Hunspell PT-BR (pacote npm dictionary-pt) com 311.641 palavras-base. As palavras são pré-extraídas em formato JSON para carregamento eficiente em tempo de execução:')),
  bullet('Arquivo gerado: src/lib/wordlist-pt.json (~4,2 MB, array JSON de strings em maiúsculas)'),
  bullet('Script de extração: node scripts/build-wordlist.mjs — lê index.dic, remove códigos de afixo, filtra palavras com menos de 2 caracteres e converte para maiúsculas'),
  bullet('Lookup O(1): Set<string> para verificação de palavras já corretas'),
  bullet('Índice BY_LENGTH: Map<number, string[]> — agrupa palavras por comprimento, reduzindo busca Levenshtein de 311.641 para ~5.000 candidatos por palavra'),
  h2('8.2 Algoritmo de Correção'),
  bullet('1. Converte texto para maiúsculas'),
  bullet('2. Divide em tokens (palavras e separadores via regex)'),
  bullet('3. Se a palavra está no VOCAB_SET → retorna sem alteração'),
  bullet('4. Aplica pré-filtro BY_LENGTH: busca apenas nos buckets com comprimento similar (delta ≤ limite)'),
  bullet('5. Calcula distância de Levenshtein nos candidatos filtrados'),
  bullet('6. Substitui se distância ≤ limite (1 para ≤5 letras, 2 para ≤8 letras, 3 para longas)'),
  bullet('7. Artigos, preposições e palavras com 2 caracteres passam sem correção'),
  h2('8.3 Manutenção Automática'),
  p(t('O Cron Job diário em /api/cron/maintenance aplica correções retroativamente em todas as atividades pendentes. O gestor também pode acionar manualmente via POST /api/admin/fix-activities-spelling. Para atualizar o dicionário: node scripts/build-wordlist.mjs → commit → push (deploy automático na Vercel).')),
]

// ── 9. ONBOARDING TOUR ────────────────────────────────
const sec9 = [
  h1('9. Tour de Apresentação (Onboarding)'),
  p(t('Ao acessar o dashboard pela primeira vez, o estagiário é guiado por um tour de duas fases. Controlado via localStorage com chave onboarding_done_${userId} — exibido apenas uma vez por usuário. Componente: src/components/OnboardingTour.tsx.')),
  h2('9.1 Fase 1 — Slides de Módulos'),
  tbl2([
    ['Slide', 'Módulo apresentado'],
    ['1', 'Bem-vindo ao ChronosLab — visão geral do sistema'],
    ['2', 'Registre sua Presença — como bater ponto'],
    ['3', 'Histórico — consulta de registros anteriores'],
    ['4', 'Ranking — competição saudável entre estagiários'],
    ['5', 'Gamificação — pontos, níveis e conquistas'],
    ['6', 'Seu Perfil — edição de dados e relatórios'],
  ]),
  p(t('Suporte a swipe (touch) com threshold de 40px. Pontos de progresso na parte inferior indicam o slide atual.')),
  h2('9.2 Fase 2 — Tooltips Guiados'),
  tbl2([
    ['Passo', 'Elemento (data-tour)', 'Posição do tooltip'],
    ['1', 'tour-header — cabeçalho com nome do estagiário', 'abaixo'],
    ['2', 'tour-progress — anel de progresso de horas', 'abaixo'],
    ['3', 'tour-stats — linha de estatísticas (pts, nível, streak)', 'abaixo'],
    ['4', 'tour-gamification — card de gamificação', 'acima'],
    ['5', 'tour-clock — botão de registro de ponto', 'acima'],
    ['6', 'tour-nav — barra de navegação inferior', 'acima'],
  ]),
  p(t('A página rola automaticamente para centralizar o elemento antes de posicionar o tooltip. O tooltip nunca sai da viewport: posição limitada por Math.max(8, Math.min(top, vh - 190 - 8)).')),
  h2('9.3 Reativar o Tour'),
  p(t('O botão "Ver tutorial novamente" na aba Dados do Perfil (/profile?tab=dados) remove a chave do localStorage, exibindo o tour completo na próxima visita ao dashboard.')),
]

// ── 10. PÁGINAS E MÓDULOS ─────────────────────────────
const sec10 = [
  h1('10. Páginas e Módulos'),
  h2('10.1 Área do Estagiário'),
  tbl2([
    ['Rota', 'Descrição'],
    ['/login', 'Login por e-mail/senha ou PIN rápido de 6 dígitos'],
    ['/dashboard', 'Painel principal: registro de ponto, progresso, gamificação, onboarding tour'],
    ['/history', 'Histórico dos últimos 60 dias + arquivo por mês'],
    ['/history/archive', 'Visualização de meses anteriores arquivados'],
    ['/intern-ranking', 'Ranking público dos estagiários com pódio animado'],
    ['/profile', 'Edição de dados, conquistas, relatórios, novidades e reativação do tour'],
    ['/ranking/rules', 'Explicação das regras de pontuação e gamificação'],
  ]),
  h2('10.2 Área do Gestor (/admin/**)'),
  tbl2([
    ['Rota', 'Descrição'],
    ['/admin', 'Dashboard: presenças em tempo real, ranking rápido, horas do mês'],
    ['/admin/approvals', 'Aprovação/rejeição de registros com atividades detalhadas'],
    ['/admin/interns', 'Lista de estagiários ativos e inativos'],
    ['/admin/interns/[id]', 'Detalhe: visão geral, cadastro (inclui geo_exempt toggle), histórico'],
    ['/admin/reports', 'Geração dos 14 tipos de relatório em PDF (apenas botão PDF disponível)'],
    ['/admin/ranking', 'Hall da fama e ranking administrativo'],
    ['/admin/workload', 'Controle de carga horária de todos os estagiários'],
    ['/admin/updates', 'Publicação de novidades e atualizações do sistema'],
    ['/admin/settings', 'Configurações do laboratório, geolocalização e push notifications'],
    ['/admin/feedback', 'Feedbacks dos estagiários e respostas do gestor'],
  ]),
]

// ── 11. SEGURANÇA ─────────────────────────────────────
const sec11 = [
  h1('11. Segurança'),
  h2('11.1 Medidas Implementadas'),
  tbl2([
    ['Área', 'Medida'],
    ['Autenticação', 'Supabase Auth (e-mail/senha) + PIN bcrypt salt 12 para acesso rápido no laboratório'],
    ['Autorização', 'requireManager() verifica role = manager E is_active = true em cada requisição admin'],
    ['Sessão', 'Cookies httpOnly + secure + sameSite=lax — inacessíveis via JavaScript, protegidos contra CSRF'],
    ['Banco de dados', 'RLS ativo: estagiário acessa apenas seus próprios registros; gestor usa service_role key exclusivamente no servidor'],
    ['Perfil do usuário', '/api/profile/update usa cliente autenticado do usuário para atualizar profiles, respeitando RLS; service_role apenas para storage de foto'],
    ['Validação de input', 'Zod em 100% das API Routes com limites de tamanho, tipos estritos e enums validados'],
    ['Geolocalização', 'Validação Haversine no servidor — o cliente não pode falsificar coordenadas'],
    ['Upload de fotos', 'Limite de 2 MB, apenas image/jpeg, namespaced por user_id no Supabase Storage'],
    ['Injeção SQL', 'Impossível — 100% das queries via Supabase SDK com prepared statements internos'],
    ['Cron Jobs', 'Autenticados por CRON_SECRET no header Authorization: Bearer'],
    ['Monitoramento', 'Sentry captura erros em produção com persistência de 90 dias; logger.security() registra eventos suspeitos (tag security_event=true)'],
    ['DDoS', 'Vercel CDN global com anycast e throttling automático em funções serverless; arquitetura serverless elimina risco de SYN flood no servidor de aplicação'],
  ]),
  h2('11.2 Variáveis de Ambiente Sensíveis'),
  tbl2([
    ['Variável', 'Exposição / Uso'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'Apenas servidor — nunca exposta ao browser ou logs'],
    ['VAPID_PRIVATE_KEY', 'Apenas servidor — assina notificações push'],
    ['CRON_SECRET', 'Apenas servidor — autentica chamadas do Cron Job'],
    ['NEXT_PUBLIC_SENTRY_DSN', 'Pública por design (identifica o projeto no Sentry, não concede acesso)'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Pública por design — acesso limitado pelas políticas RLS'],
  ]),
  h2('11.3 Eventos de Segurança no Sentry'),
  p(t('O logger foi estendido com o método security(message, context) que envia eventos para o Sentry com a tag security_event=true, permitindo filtragem e criação de alertas específicos no painel. Eventos registrados atualmente:')),
  bullet('PIN incorreto em /api/auth/verify-pin — registra e-mail e user_id sem expor o PIN'),
  bullet('Erros internos inesperados em qualquer API Route via logger.error()'),
  h2('11.4 Pontos de Melhoria Futura'),
  bullet('Rate limiting por IP nas rotas de autenticação (ex: Upstash Redis com sliding window)'),
  bullet('Content-Security-Policy (CSP) header após auditoria de compatibilidade com Next.js'),
  bullet('TOTP (aplicativo autenticador) como segundo fator para o gestor'),
  bullet('Bloqueio de conta após N tentativas de PIN incorretas consecutivas'),
]

// ── 12. DEPLOY ────────────────────────────────────────
const sec12 = [
  h1('12. Deploy e Variáveis de Ambiente'),
  h2('12.1 Plataforma'),
  p(t('O projeto é hospedado na Vercel com deploy automático via Git push na branch main. O build executa next build seguido de scripts/sync-updates.mjs, que publica os commits recentes como novidades na tabela system_updates.')),
  h2('12.2 Variáveis Necessárias (.env.local e Vercel)'),
  tbl2([
    ['Variável', 'Descrição'],
    ['NEXT_PUBLIC_SUPABASE_URL', 'URL do projeto Supabase'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Chave anônima (segura para o cliente com RLS)'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'Chave de admin — apenas no servidor, nunca exposta'],
    ['CRON_SECRET', 'Token de autenticação do Cron Job de manutenção diário'],
    ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'Chave pública VAPID para Web Push'],
    ['VAPID_PRIVATE_KEY', 'Chave privada VAPID — apenas no servidor'],
    ['NEXT_PUBLIC_SENTRY_DSN', 'DSN do projeto Sentry para monitoramento de erros'],
    ['SENTRY_ORG', 'Organização no Sentry (necessário para upload de source maps)'],
    ['SENTRY_PROJECT', 'Nome do projeto no Sentry'],
  ]),
  h2('12.3 Scripts Disponíveis'),
  tbl2([
    ['Comando', 'Ação'],
    ['npm run dev', 'Servidor de desenvolvimento com Turbopack'],
    ['npm run build', 'Build de produção + sync de atualizações'],
    ['npm run lint', 'Verificação ESLint'],
    ['node scripts/build-wordlist.mjs', 'Regera src/lib/wordlist-pt.json a partir do Hunspell'],
    ['node scripts/sync-updates.mjs', 'Sincroniza commits com tabela system_updates'],
  ]),
  h2('12.4 Cron Job na Vercel'),
  p(t('Configurado em vercel.json. Executa /api/cron/maintenance diariamente às 03h00 UTC. Requer o header Authorization: Bearer {CRON_SECRET} para autenticação.')),
]

// ── 13. PWA ───────────────────────────────────────────
const sec13 = [
  h1('13. Progressive Web App (PWA)'),
  p(t('O sistema funciona como PWA completo, com suporte a:')),
  bullet('Instalação na tela inicial de smartphones Android e iOS (Safari "Adicionar à tela de início")'),
  bullet('Service Worker para cache de assets e funcionamento offline parcial'),
  bullet('Web App Manifest com ícones 192px e 512px e tema verde (#1a7a3a)'),
  bullet('Notificações push via Web Push API com chaves VAPID — chave privada apenas no servidor'),
  bullet('Tela de splash e modo standalone sem barra de endereço'),
  p(t('O envio de push é feito pelo gestor em /admin/settings, com opção de envio individual ou broadcast para todos os estagiários com subscription ativa.')),
]

// ── 14. GUIA DE MANUTENÇÃO ───────────────────────────
const sec14 = [
  h1('14. Guia de Manutenção'),
  h2('14.1 Adicionar Novo Estagiário'),
  bullet('Acesse /admin/interns → "Novo Estagiário"'),
  bullet('Preencha nome completo, e-mail, curso e período de estágio'),
  bullet('Configure o horário semanal na aba "Horários"'),
  bullet('Ative "Isento de Geolocalização" se o estagiário trabalhar remotamente'),
  bullet('O sistema envia e-mail automático de boas-vindas com link para definição de senha'),
  h2('14.2 Configurar Isenção de Geolocalização'),
  bullet('Acesse /admin/interns/[id]?tab=cadastro'),
  bullet('No card "Preferências do Sistema", ative o toggle "Isento de Geolocalização"'),
  bullet('Salve — o campo geo_exempt é atualizado imediatamente na tabela profiles'),
  bullet('Na próxima tentativa de ponto, o sistema ignora validação GPS para esse estagiário'),
  h2('14.3 Atualizar Vocabulário de Correção Ortográfica'),
  bullet('Execute: node scripts/build-wordlist.mjs'),
  bullet('O arquivo src/lib/wordlist-pt.json será regravado com o dicionário Hunspell atualizado'),
  bullet('Faça commit e push — o Vercel reimplanta automaticamente'),
  bullet('Para aplicar retroativamente: acesse /admin e acione "Corrigir Ortografia"'),
  h2('14.4 Alterar Horário de Estagiário'),
  bullet('Acesse /admin/interns/[id] → aba "Horários"'),
  bullet('Edite os horários de cada dia da semana conforme necessário'),
  bullet('O algoritmo de pontualidade e streak atualiza automaticamente nos próximos registros'),
  h2('14.5 Publicar Novidade Manual'),
  bullet('Acesse /admin/updates → "Nova Publicação"'),
  bullet('Preencha título, corpo da mensagem e tipo (feature, fix, melhoria, anúncio)'),
  bullet('A novidade fica disponível imediatamente na aba "Novidades" do perfil dos estagiários'),
  h2('14.6 Monitorar Erros em Produção'),
  bullet('Acesse sentry.io e selecione o projeto ChronosLab'),
  bullet('Filtre por tag security_event=true para ver tentativas suspeitas de PIN'),
  bullet('Configure alertas: se > 5 eventos security_event em 10 minutos → enviar e-mail'),
  bullet('Logs de erro de API Routes aparecem automaticamente com stack trace completo'),
  h2('14.7 Atualizar Tipos do Banco'),
  bullet('Após alterações de schema no Supabase: npx supabase gen types typescript --project-id [ID]'),
  bullet('Substitua o conteúdo de src/types/database.ts pelo output gerado'),
  bullet('Corrija eventuais erros de TypeScript antes de fazer push'),
]

// ── 15. DESENVOLVIMENTO ───────────────────────────────
const sec15 = [
  h1('15. Fluxo de Desenvolvimento'),
  h2('15.1 Processo Padrão'),
  bullet('1. Crie uma branch feature/nome-da-funcionalidade a partir de main'),
  bullet('2. Desenvolva e teste localmente com npm run dev'),
  bullet('3. Execute npm run build para garantir compilação TypeScript sem erros'),
  bullet('4. Faça push — a Vercel cria um deploy de preview automaticamente'),
  bullet('5. Teste no preview e abra Pull Request para main'),
  bullet('6. Após merge, o deploy de produção é acionado automaticamente'),
  h2('15.2 Checklist antes do Deploy'),
  bullet('npm run build passa sem erros de TypeScript'),
  bullet('npm run lint sem warnings críticos'),
  bullet('Variáveis de ambiente configuradas no painel da Vercel'),
  bullet('Migrações de banco aplicadas no Supabase antes do push'),
  bullet('NEXT_PUBLIC_SENTRY_DSN configurado na Vercel para monitoramento em produção'),
  h2('15.3 Comandos Úteis'),
  tbl2([
    ['Situação', 'Comando'],
    ['Regenerar wordlist Hunspell', 'node scripts/build-wordlist.mjs'],
    ['Sincronizar atualizações manualmente', 'node scripts/sync-updates.mjs'],
    ['Verificar tipos do banco', 'npx supabase gen types typescript --project-id [ID]'],
    ['Rodar testes E2E', 'npx playwright test'],
    ['Verificar TypeScript', 'npx tsc --noEmit'],
  ]),
]

// ── 16. REFERÊNCIAS ───────────────────────────────────
const sec16 = [
  h1('16. Referências e Links'),
  h2('16.1 Repositório e Deploy'),
  bullet('Repositório: github.com/emanuelmaestre/Controle_de_Ponto_Estagiarios'),
  bullet('Produção: controle-de-ponto-estagiarios.vercel.app'),
  h2('16.2 Documentações Externas'),
  tbl2([
    ['Tecnologia', 'URL de referência'],
    ['Next.js 16', 'nextjs.org/docs/app'],
    ['Supabase', 'supabase.com/docs'],
    ['@react-pdf/renderer', 'react-pdf.bratislava.sk/docs'],
    ['Vercel Cron Jobs', 'vercel.com/docs/cron-jobs'],
    ['Web Push API (VAPID)', 'web.dev/push-notifications'],
    ['Hunspell PT-BR (dictionary-pt)', 'npmjs.com/package/dictionary-pt'],
    ['Sentry Next.js', 'docs.sentry.io/platforms/javascript/guides/nextjs'],
    ['Framer Motion', 'motion.dev'],
  ]),
]

// ── RODAPÉ FINAL ─────────────────────────────────────
const rodape = [
  espaço(),
  linhaDivisora(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 0 },
    children: [new TextRun({ text: 'ChronosLab — Manual Técnico v3.0 — Junho de 2026', font: FONTE, color: COR.cinza, size: 18 })],
  }),
]

// ── SUMÁRIO ───────────────────────────────────────────
const sumario = [
  h1('Sumário'),
  new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-3' }),
]

// ── DOCUMENTO FINAL ───────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: FONTE, size: 22, color: COR.texto } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: FONTE, color: COR.verdeEscuro },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONTE, color: COR.verde },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONTE, color: COR.verde },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 },
      },
      {
        id: 'ListParagraph', name: 'List Paragraph', basedOn: 'Normal',
        run: { font: FONTE, size: 22, color: COR.texto },
        paragraph: { indent: { left: 720 }, spacing: { before: 40, after: 40 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
      },
    },
    headers: { default: header },
    footers: { default: footer },
    children: [
      ...capa,
      new Paragraph({ children: [new TextRun({ break: 1 })] }),
      ...sumario,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...sec6,
      ...sec7,
      ...sec8,
      ...sec9,
      ...sec10,
      ...sec11,
      ...sec12,
      ...sec13,
      ...sec14,
      ...sec15,
      ...sec16,
      ...rodape,
    ],
  }],
})

Packer.toBuffer(doc).then(buf => {
  writeFileSync('C:/Users/Windows/Controle de Ponto Estágiarios/Milton/MANUAL TÉCNICO.docx', buf)
  console.log('✓ MANUAL TÉCNICO.docx gerado com sucesso!')
})
