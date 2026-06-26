import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber,
} from 'docx'
import { writeFileSync } from 'fs'

// ── Paleta ────────────────────────────────────────────
const COR = {
  verde:      '1a7a3a',
  verdeEscuro:'0d4a20',
  texto:      '1a1a1a',
  cinza:      '555555',
  cinzaClaro: 'f5f5f5',
  cinzaMedio: 'dddddd',
  branco:     'FFFFFF',
}

const FONTE = 'Times New Roman'
const FONTE_TITLE = 'Arial'
const TW = 9360

// ── Helpers ───────────────────────────────────────────
const t = (text, opts = {}) => new TextRun({
  text, font: FONTE,
  color: opts.color ?? COR.texto,
  size: opts.size ?? 22,
  bold: opts.bold ?? false,
  italics: opts.italic ?? false,
})

const tA = (text, opts = {}) => new TextRun({
  text, font: FONTE_TITLE,
  color: opts.color ?? COR.texto,
  size: opts.size ?? 22,
  bold: opts.bold ?? false,
  italics: opts.italic ?? false,
})

const p = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: opts.align ?? AlignmentType.JUSTIFIED,
  spacing: { before: opts.before ?? 80, after: opts.after ?? 80, line: opts.line ?? 360 },
  ...(opts.indent ? { indent: { firstLine: opts.indent } } : {}),
})

const pCenter = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: AlignmentType.CENTER,
  spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
})

const h1art = (text) => new Paragraph({
  spacing: { before: 280, after: 140 },
  children: [new TextRun({ text: text.toUpperCase(), font: FONTE_TITLE, bold: true, color: COR.verdeEscuro, size: 24 })],
})

const h2art = (text) => new Paragraph({
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, font: FONTE_TITLE, bold: true, color: COR.verde, size: 22 })],
})

const borda = { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' }
const bordas = { top: borda, bottom: borda, left: borda, right: borda }
const margens = { top: 80, bottom: 80, left: 120, right: 120 }

const celH = (text, w) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders: bordas,
  shading: { fill: COR.verdeEscuro, type: ShadingType.CLEAR },
  margins: margens,
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: FONTE_TITLE, bold: true, color: COR.branco, size: 20 })] })],
})

const celD = (text, w, shade = COR.branco) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders: bordas,
  shading: { fill: shade, type: ShadingType.CLEAR },
  margins: margens,
  children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, font: FONTE, size: 20, color: COR.texto })] })],
})

const bullet = (text) => new Paragraph({
  style: 'ListParagraph',
  numbering: { reference: 'bullets', level: 0 },
  spacing: { before: 40, after: 40 },
  children: [t(text)],
})

const espaço = () => new Paragraph({ spacing: { before: 100, after: 0 }, children: [new TextRun('')] })

const linhaDivisora = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COR.verde, space: 1 } },
  spacing: { before: 80, after: 80 },
  children: [new TextRun('')],
})

// ── CABEÇALHO / RODAPÉ ────────────────────────────────
const header = new Header({
  children: [
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COR.verde, space: 1 } },
      spacing: { before: 0, after: 80 },
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'ChronosLab — Controle de Ponto com Gamificação — IFSULDEMINAS', font: FONTE_TITLE, size: 18, color: COR.cinza })],
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
        new TextRun({ text: 'Página ', font: FONTE_TITLE, size: 18, color: COR.cinza }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONTE_TITLE, size: 18, color: COR.cinza }),
        new TextRun({ text: ' de ', font: FONTE_TITLE, size: 18, color: COR.cinza }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONTE_TITLE, size: 18, color: COR.cinza }),
      ],
    }),
  ],
})

// ── CAPA ──────────────────────────────────────────────
const capa = [
  new Paragraph({ spacing: { before: 720, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'IFSULDEMINAS — Instituto Federal de Educação, Ciência e Tecnologia do Sul de Minas Gerais', font: FONTE_TITLE, bold: true, color: COR.cinza, size: 22 })] }),
  new Paragraph({ spacing: { before: 60, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Laboratório de Informática', font: FONTE_TITLE, color: COR.cinza, size: 22 })] }),
  espaço(),
  new Paragraph({ spacing: { before: 1200, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'CHRONOSLAB:', font: FONTE_TITLE, bold: true, color: COR.verde, size: 56 })] }),
  new Paragraph({ spacing: { before: 60, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'SISTEMA WEB DE CONTROLE DE PONTO COM GAMIFICAÇÃO', font: FONTE_TITLE, bold: true, color: COR.verdeEscuro, size: 32 })] }),
  new Paragraph({ spacing: { before: 120, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'PARA GESTÃO DE ESTAGIÁRIOS EM AMBIENTE DE LABORATÓRIO', font: FONTE_TITLE, bold: true, color: COR.verdeEscuro, size: 28 })] }),
  espaço(),
  new Paragraph({ spacing: { before: 1200, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Autor: Emanuel Maestre', font: FONTE, size: 22, color: COR.texto })] }),
  new Paragraph({ spacing: { before: 60, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Orientador: Prof. Milton Antônio Naves', font: FONTE, size: 22, color: COR.texto })] }),
  espaço(),
  new Paragraph({ spacing: { before: 1400, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Junho de 2026', font: FONTE, size: 22, color: COR.cinza })] }),
]

// ── RESUMO ────────────────────────────────────────────
const secResumo = [
  new Paragraph({
    pageBreakBefore: true,
    spacing: { before: 240, after: 160 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'RESUMO', font: FONTE_TITLE, bold: true, color: COR.verdeEscuro, size: 28 })],
  }),
  p([t('Este artigo apresenta o '), t('ChronosLab', { bold: true }), t(', um sistema web de controle de ponto desenvolvido para gerenciar a frequência de estagiários em laboratórios do IFSULDEMINAS. O sistema combina gestão tradicional de frequência com gamificação por pontos, níveis e conquistas, com o objetivo de incentivar pontualidade, consistência e documentação de atividades. A plataforma foi construída com Next.js 16, React 19, TypeScript 5 e Supabase (PostgreSQL + Auth + RLS), e funciona como Progressive Web App (PWA) instalável em dispositivos móveis e desktop. Entre os diferenciais técnicos estão a correção ortográfica automática de atividades utilizando o dicionário Hunspell PT-BR com 311.641 palavras, geração de 14 tipos de relatório em PDF diretamente no servidor, tour de onboarding interativo com tooltips guiados, validação de geolocalização configurável por usuário e monitoramento de erros em produção via Sentry. Os resultados demonstram que a integração entre ferramentas modernas de desenvolvimento web e técnicas de gamificação aplicadas à gestão de presença pode aumentar o engajamento dos estagiários e reduzir a sobrecarga administrativa do gestor.')]),
  espaço(),
  p([t('Palavras-chave: ', { bold: true }), t('controle de ponto; gamificação; Next.js; Supabase; PWA; gestão de estagiários; correção ortográfica; relatórios PDF.')]),
  espaço(),
  new Paragraph({
    spacing: { before: 200, after: 160 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'ABSTRACT', font: FONTE_TITLE, bold: true, color: COR.verdeEscuro, size: 28 })],
  }),
  p([t('This paper presents '), t('ChronosLab', { bold: true, italic: true }), t(', a web-based time tracking system developed to manage intern attendance in laboratories at IFSULDEMINAS. The system combines traditional attendance management with gamification through points, levels, and achievements, aiming to encourage punctuality, consistency, and activity documentation. Built with Next.js 16, React 19, TypeScript 5, and Supabase (PostgreSQL + Auth + RLS), it operates as an installable Progressive Web App (PWA) on mobile and desktop devices. Notable technical features include automatic spell correction of activity descriptions using the Hunspell PT-BR dictionary with 311,641 words, server-side generation of 14 PDF report types, an interactive onboarding tour with guided tooltips, configurable geolocation validation per user, and production error monitoring via Sentry. Results show that integrating modern web development tools with gamification techniques applied to attendance management can increase intern engagement and reduce administrative burden on supervisors.')]),
  espaço(),
  p([t('Keywords: ', { bold: true, italic: true }), t('time tracking; gamification; Next.js; Supabase; PWA; intern management; spell checking; PDF reports.', { italic: true })]),
]

// ── 1. INTRODUÇÃO ─────────────────────────────────────
const sec1 = [
  h1art('1. Introdução'),
  p([t('A gestão de frequência em ambientes de laboratório educacional enfrenta desafios recorrentes: registros manuais sujeitos a erros, dificuldade de auditoria, baixo engajamento dos estagiários e sobrecarga administrativa para os gestores. Sistemas tradicionais de ponto eletrônico, em geral, limitam-se ao registro de horários sem fornecer ferramentas de análise, relatórios ou estímulos comportamentais.')], { indent: 720 }),
  p([t('O ChronosLab surge como resposta a esse contexto, propondo uma plataforma web completa que integra controle de frequência, documentação de atividades, gamificação por pontos e conquistas, e geração automatizada de relatórios em PDF. A abordagem gamificada, inspirada nos princípios de sistemas de recompensa progressiva (ZICHERMANN; CUNNINGHAM, 2011), busca transformar obrigações rotineiras em experiências com retorno imediato e visível para o estagiário.')], { indent: 720 }),
  p([t('Desenvolvido com tecnologias modernas de desenvolvimento web — Next.js 16, React 19, TypeScript 5 e Supabase — o sistema opera como Progressive Web App (PWA), permitindo instalação em dispositivos móveis sem necessidade de publicação em lojas de aplicativos. A validação de geolocalização, o acesso rápido por PIN, a correção ortográfica automática das atividades e o monitoramento de erros via Sentry completam o conjunto de funcionalidades.')], { indent: 720 }),
  p([t('Este artigo descreve a motivação, a arquitetura técnica, as principais funcionalidades e os resultados obtidos com a implantação do ChronosLab no Laboratório de Informática do IFSULDEMINAS.')], { indent: 720 }),
  h2art('1.1 Objetivos'),
  p([t('O objetivo geral é desenvolver e implantar um sistema web de controle de ponto com gamificação para estagiários de laboratório. Os objetivos específicos são:')], { indent: 720 }),
  bullet('Automatizar o registro, validação e aprovação de registros de frequência'),
  bullet('Incentivar pontualidade e documentação de atividades por meio de pontos e conquistas'),
  bullet('Disponibilizar relatórios PDF profissionais em 14 formatos para gestores e instituições'),
  bullet('Integrar correção ortográfica automática com dicionário Hunspell PT-BR'),
  bullet('Garantir segurança dos dados com RLS, autenticação JWT e monitoramento em produção'),
]

// ── 2. REFERENCIAL TEÓRICO ────────────────────────────
const sec2 = [
  h1art('2. Referencial Teórico'),
  h2art('2.1 Gamificação em Ambientes Educacionais e Corporativos'),
  p([t('Gamificação é definida como a aplicação de elementos de design de jogos em contextos não relacionados a jogos (DETERDING et al., 2011). No contexto educacional e corporativo, elementos como pontos, níveis, rankings e recompensas têm demonstrado aumentar o engajamento e a motivação intrínseca dos participantes (HAMARI; KOIVISTO; SARSA, 2014).')], { indent: 720 }),
  p([t('O ChronosLab implementa esse modelo com pontuação progressiva, multiplicadores de sequência (streak), sistema de níveis com títulos e 15 conquistas desbloqueáveis. A visibilidade do progresso por meio de rankings públicos entre os estagiários cria um ambiente de competição saudável e transparente.')], { indent: 720 }),
  h2art('2.2 Progressive Web Apps (PWA)'),
  p([t('PWAs combinam as vantagens de aplicações web (sem necessidade de instalação via loja, atualização automática, indexável por mecanismos de busca) com características de aplicativos nativos (instalação na tela inicial, notificações push, funcionamento offline parcial). A especificação é mantida pelo W3C e implementada em todos os principais navegadores modernos (GOOGLE DEVELOPERS, 2023).')], { indent: 720 }),
  p([t('A adoção do modelo PWA no ChronosLab elimina a necessidade de desenvolvimento nativo para Android e iOS, reduzindo o custo de manutenção e garantindo compatibilidade multiplataforma.')], { indent: 720 }),
  h2art('2.3 Arquitetura Serverless e BaaS'),
  p([t('A arquitetura serverless delega ao provedor de nuvem a alocação dinâmica de recursos computacionais, eliminando a gestão de servidores e reduzindo custos em cargas variáveis (ROBERTS, 2018). O modelo Backend-as-a-Service (BaaS), representado pelo Supabase neste projeto, fornece banco de dados relacional (PostgreSQL), autenticação, storage e Row Level Security como serviços gerenciados.')], { indent: 720 }),
  p([t('Essa combinação — Next.js API Routes como camada serverless na Vercel + Supabase como BaaS — permite ao ChronosLab escalar automaticamente sem infraestrutura dedicada, mantendo custos operacionais próximos de zero para o volume de uso de um laboratório educacional.')], { indent: 720 }),
  h2art('2.4 Row Level Security (RLS)'),
  p([t('RLS é um mecanismo nativo do PostgreSQL que aplica políticas de controle de acesso diretamente nas tabelas do banco de dados. Cada linha pode ter uma política de visibilidade associada ao papel (role) do usuário que realiza a consulta (POSTGRESQL GLOBAL DEVELOPMENT GROUP, 2024). No ChronosLab, RLS garante que estagiários visualizem e modifiquem apenas seus próprios registros, mesmo que a chave de conexão ao banco seja comprometida.')], { indent: 720 }),
]

// ── 3. METODOLOGIA E DESENVOLVIMENTO ─────────────────
const sec3 = [
  h1art('3. Metodologia e Desenvolvimento'),
  h2art('3.1 Processo de Desenvolvimento'),
  p([t('O desenvolvimento seguiu uma abordagem iterativa com entregas contínuas, utilizando Git como controle de versão e a Vercel como plataforma de deploy automático via push na branch main. Cada push gera um preview de deploy para validação antes da promoção ao ambiente de produção.')], { indent: 720 }),
  p([t('A arquitetura adota os princípios de Clean Architecture, com separação em três camadas: domain (entidades e regras de negócio), application (casos de uso e DTOs) e infra (implementações Supabase). Essa separação garante que mudanças de provedor de banco afetem apenas a camada infra.')], { indent: 720 }),
  h2art('3.2 Stack Tecnológica'),
  new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      new TableRow({ children: [celH('Camada', 2800), celH('Tecnologias', 6560)] }),
      new TableRow({ children: [celD('Frontend', 2800, COR.cinzaClaro), celD('Next.js 16.2 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12', 6560, COR.cinzaClaro)] }),
      new TableRow({ children: [celD('Backend', 2800), celD('Next.js API Routes (serverless), Supabase (PostgreSQL + Auth + RLS + Storage)', 6560)] }),
      new TableRow({ children: [celD('Geração de PDF', 2800, COR.cinzaClaro), celD('@react-pdf/renderer v4.5 — componentes React tipados renderizados no servidor', 6560, COR.cinzaClaro)] }),
      new TableRow({ children: [celD('Validação', 2800), celD('Zod — schemas tipados em 100% das API Routes', 6560)] }),
      new TableRow({ children: [celD('Segurança', 2800, COR.cinzaClaro), celD('bcryptjs (PIN, salt 12), JWT via Supabase Auth, Sentry (monitoramento)', 6560, COR.cinzaClaro)] }),
      new TableRow({ children: [celD('Deploy', 2800), celD('Vercel — CDN global, Cron Jobs, proteção DDoS de borda automática', 6560)] }),
    ],
  }),
  espaço(),
  h2art('3.3 Módulos Principais do Sistema'),
  h2art('3.3.1 Registro de Ponto com Geolocalização'),
  p([t('O registro de entrada e saída é realizado via ClockButton no dashboard do estagiário. Na entrada, as coordenadas GPS do dispositivo são enviadas ao servidor, que valida a distância em relação às coordenadas do laboratório usando a fórmula de Haversine. O raio de aceitação é configurável pelo gestor em metros.')], { indent: 720 }),
  p([t('A isenção de validação GPS pode ser ativada individualmente por estagiário (campo geo_exempt na tabela profiles), permitindo registros remotos para casos específicos. O timestamp de todos os registros é gerado pelo servidor, impedindo manipulação pelo cliente.')], { indent: 720 }),
  h2art('3.3.2 Documentação de Atividades com Correção Ortográfica'),
  p([t('Ao registrar saída, o estagiário documenta as atividades realizadas na sessão. O sistema aplica correção ortográfica automática usando o dicionário Hunspell PT-BR com 311.641 palavras-base (pacote dictionary-pt). O algoritmo pré-extrai as palavras do dicionário em um arquivo JSON (src/lib/wordlist-pt.json) para lookup O(1) via Set, e organiza candidatos por comprimento em um Map para reduzir o espaço de busca da distância de Levenshtein de 311.641 para ~5.000 por palavra.')], { indent: 720 }),
  p([t('O Cron Job diário (03h00 UTC) aplica correções retroativamente em atividades pendentes, e o gestor pode acionar o processo manualmente pelo painel administrativo.')], { indent: 720 }),
  h2art('3.3.3 Sistema de Gamificação'),
  p([t('A engine de gamificação (src/lib/gamification.ts) é acionada a cada clock-out aprovado. O sistema atribui pontos por presença (+10), pontualidade (+5), atividades documentadas (+5) e sessão completa (+3), com multiplicadores de streak para sequências de 3 dias (×1,2), 7 dias (×1,5) e 30 dias (×2,0). Os pontos acumulam em seis níveis de progressão, com conquistas desbloqueáveis em marcos específicos.')], { indent: 720 }),
  h2art('3.3.4 Geração de Relatórios PDF'),
  p([t('Todos os 14 tipos de relatório são gerados no servidor usando componentes React tipados com @react-pdf/renderer v4.5. O componente GenericTableReport aceita configurações de colunas com largura fixa (pt), flex e alinhamento (left/center/right), permitindo layouts precisos e consistentes. Os PDFs são retornados diretamente como Content-Type: application/pdf, sem gravação em disco.')], { indent: 720 }),
  h2art('3.3.5 Tour de Onboarding'),
  p([t('Na primeira visita ao dashboard, o estagiário é guiado por um tour em duas fases: 6 slides em tela cheia apresentando os módulos do sistema, seguidos de 6 passos interativos com spotlight CSS que destacam elementos reais da interface. O controle é feito via localStorage (chave onboarding_done_{userId}), garantindo exibição única por usuário. O tour pode ser reativado pelo próprio estagiário no perfil.')], { indent: 720 }),
  h2art('3.3.6 Segurança e Monitoramento'),
  p([t('A segurança é implementada em múltiplas camadas: autenticação JWT via Supabase Auth, PIN de acesso rápido com hash bcrypt (12 rounds de salt), cookies httpOnly + secure + sameSite=lax, RLS no banco de dados, validação Zod em todas as API Routes e verificação de conta ativa em cada requisição administrativa. O Sentry monitora erros em produção com persistência de 90 dias e registra eventos de segurança com tag security_event=true para filtragem e alertas.')], { indent: 720 }),
]

// ── 4. RESULTADOS ─────────────────────────────────────
const sec4 = [
  h1art('4. Resultados e Discussão'),
  h2art('4.1 Funcionalidades Implementadas'),
  p([t('O ChronosLab foi implantado com sucesso no Laboratório de Informática do IFSULDEMINAS e encontra-se em uso ativo pelos estagiários. As principais funcionalidades entregues incluem:')], { indent: 720 }),
  bullet('Registro de ponto com validação geográfica e timestamp servidor-autoritativo'),
  bullet('Documentação de atividades com correção ortográfica automática Hunspell PT-BR'),
  bullet('Gamificação com pontos, 6 níveis, 15 conquistas e ranking entre estagiários'),
  bullet('14 tipos de relatório em PDF gerados no servidor com @react-pdf/renderer'),
  bullet('Tour de onboarding interativo com slides e tooltips guiados'),
  bullet('Notificações push via Web Push API (VAPID)'),
  bullet('Dashboard administrativo com aprovações, gestão e hall da fama'),
  bullet('Monitoramento de erros e segurança via Sentry com persistência de 90 dias'),
  bullet('PWA instalável em Android e iOS sem loja de aplicativos'),
  h2art('4.2 Benefícios Observados'),
  p([t('A substituição de registros manuais pelo sistema digital eliminou erros de transcrição e reduziu o tempo gasto pelo gestor em compilar relatórios mensais. A gamificação demonstrou efeito positivo na pontualidade: a visibilidade do ranking e dos multiplicadores de streak criou estímulo adicional para a chegada no horário e a documentação consistente das atividades.')], { indent: 720 }),
  p([t('A correção ortográfica automática das atividades melhorou a qualidade dos registros sem impor carga adicional ao estagiário. O tour de onboarding reduziu a curva de aprendizado no primeiro acesso, diminuindo dúvidas recorrentes ao gestor.')], { indent: 720 }),
  h2art('4.3 Decisões Técnicas Relevantes'),
  new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows: [
      new TableRow({ children: [celH('Decisão', 3200), celH('Justificativa', 6160)] }),
      new TableRow({ children: [celD('@react-pdf/renderer em vez de jsPDF', 3200, COR.cinzaClaro), celD('Geração de PDF com componentes React tipados, sem DOM virtual — segura para ambiente serverless e com tipagem TypeScript nativa.', 6160, COR.cinzaClaro)] }),
      new TableRow({ children: [celD('Supabase RLS + Service Role separados', 3200), celD('RLS protege dados mesmo com chave comprometida; service_role restrita ao servidor evita bypass acidental.', 6160)] }),
      new TableRow({ children: [celD('Hunspell via JSON pré-compilado', 3200, COR.cinzaClaro), celD('Dicionário carregado em memória como Set e Map indexado por comprimento — lookup O(1) sem processo nativo externo.', 6160, COR.cinzaClaro)] }),
      new TableRow({ children: [celD('Cron Job serverless (Vercel)', 3200), celD('Manutenção diária sem servidor dedicado; autenticado por CRON_SECRET — elimina infraestrutura de agendamento.', 6160)] }),
      new TableRow({ children: [celD('Sentry para monitoramento', 3200, COR.cinzaClaro), celD('Persistência de logs de erro por 90 dias (vs. 1 hora no Vercel gratuito); eventos security_event filtráveis com alertas configuráveis.', 6160, COR.cinzaClaro)] }),
    ],
  }),
  espaço(),
  h2art('4.4 Limitações Identificadas'),
  p([t('A implementação atual apresenta algumas limitações que representam oportunidades de evolução:')], { indent: 720 }),
  bullet('Ausência de rate limiting customizado nas rotas de autenticação — proteção depende da camada de borda da Vercel'),
  bullet('PIN de 6 dígitos sem bloqueio após tentativas consecutivas incorretas'),
  bullet('Content-Security-Policy (CSP) não configurado — risco de XSS em cenários de injeção'),
  bullet('Sem segundo fator de autenticação (TOTP) para o gestor'),
  bullet('Título de nível sem distinção de gênero por ausência da coluna gender na tabela profiles'),
]

// ── 5. CONCLUSÃO ─────────────────────────────────────
const sec5 = [
  h1art('5. Conclusão'),
  p([t('O ChronosLab demonstrou que é possível desenvolver um sistema de gestão de frequência robusto, seguro e engajador utilizando exclusivamente tecnologias open-source e infraestrutura de nuvem gratuita ou de baixo custo. A combinação de Next.js 16 com Supabase permitiu construir uma aplicação full-stack tipada com deploy automático, sem necessidade de servidores dedicados.')], { indent: 720 }),
  p([t('A gamificação aplicada ao controle de ponto mostrou-se eficaz como estímulo à pontualidade e à documentação de atividades, transformando uma obrigação burocrática em uma experiência com retorno imediato e visível. O tour de onboarding interativo e a correção ortográfica automática reforçam a proposta de um sistema que reduz a fricção do usuário final.')], { indent: 720 }),
  p([t('As funcionalidades de segurança — RLS, cookies httpOnly, validação Zod, bcrypt, Sentry — garantem proteção de dados adequada para o contexto educacional, com rastreabilidade de eventos críticos em produção.')], { indent: 720 }),
  p([t('Como trabalhos futuros, destacam-se: implementação de rate limiting com Upstash Redis nas rotas de autenticação, adição de TOTP como segundo fator para o gestor, configuração de Content-Security-Policy e bloqueio de conta após falhas consecutivas de PIN. A arquitetura modular facilita a incorporação dessas melhorias sem refatorações amplas.')], { indent: 720 }),
]

// ── REFERÊNCIAS ───────────────────────────────────────
const secRef = [
  h1art('Referências'),
  p([t('DETERDING, S. et al. From game design elements to gamefulness: defining "gamification". In: '), t('Proceedings of the 15th International Academic MindTrek Conference.', { italic: true }), t(' Tampere, 2011. p. 9-15.')]),
  espaço(),
  p([t('GOOGLE DEVELOPERS. '), t('Progressive Web Apps.', { italic: true }), t(' 2023. Disponível em: web.dev/progressive-web-apps. Acesso em: jun. 2026.')]),
  espaço(),
  p([t('HAMARI, J.; KOIVISTO, J.; SARSA, H. Does Gamification Work? — A Literature Review of Empirical Studies on Gamification. In: '), t('Hawaii International Conference on System Sciences (HICSS).', { italic: true }), t(' 2014.')]),
  espaço(),
  p([t('NEXT.JS. '), t('Next.js Documentation — App Router.', { italic: true }), t(' Vercel, 2024. Disponível em: nextjs.org/docs/app.')]),
  espaço(),
  p([t('POSTGRESQL GLOBAL DEVELOPMENT GROUP. '), t('Row Security Policies.', { italic: true }), t(' 2024. Disponível em: postgresql.org/docs/current/ddl-rowsecurity.html.')]),
  espaço(),
  p([t('ROBERTS, M. '), t('Serverless Architectures.', { italic: true }), t(' martinfowler.com, 2018. Disponível em: martinfowler.com/articles/serverless.html.')]),
  espaço(),
  p([t('SENTRY. '), t('Sentry for Next.js.', { italic: true }), t(' 2024. Disponível em: docs.sentry.io/platforms/javascript/guides/nextjs.')]),
  espaço(),
  p([t('SUPABASE. '), t('Supabase Documentation.', { italic: true }), t(' 2024. Disponível em: supabase.com/docs.')]),
  espaço(),
  p([t('ZICHERMANN, G.; CUNNINGHAM, C. '), t('Gamification by Design: Implementing Game Mechanics in Web and Mobile Apps.', { italic: true }), t(' Sebastopol: O\'Reilly Media, 2011.')]),
]

// ── RODAPÉ FINAL ─────────────────────────────────────
const rodape = [
  espaço(),
  linhaDivisora(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 0 },
    children: [new TextRun({ text: 'ChronosLab — Artigo Técnico — IFSULDEMINAS — Junho de 2026', font: FONTE_TITLE, color: COR.cinza, size: 18 })],
  }),
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
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1800 },
      },
    },
    headers: { default: header },
    footers: { default: footer },
    children: [
      ...capa,
      ...secResumo,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...secRef,
      ...rodape,
    ],
  }],
})

Packer.toBuffer(doc).then(buf => {
  writeFileSync('C:/Users/Windows/Controle de Ponto Estágiarios/Milton/ARTIGO.docx', buf)
  console.log('✓ ARTIGO.docx gerado com sucesso!')
})
