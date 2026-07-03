<div align="center">

<img src="public/icon-192.png" width="80" alt="ChronosLab logo" />

# ChronosLab — Controle de Ponto para Estagiários

**Sistema web de gestão de frequência com gamificação, relatórios PDF e Progressive Web App**

[![Deploy](https://img.shields.io/badge/deploy-vercel-000?logo=vercel)](https://controle-de-ponto-estagiarios.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)

**[Acessar o sistema →](https://controle-de-ponto-estagiarios.vercel.app)**

</div>

---

## Sobre o projeto

O **ChronosLab** é um sistema completo de controle de ponto desenvolvido para gerenciar a frequência de estagiários em laboratórios do IFSULDEMINAS. Combina gestão tradicional de frequência com gamificação por pontos, níveis e conquistas, incentivando pontualidade e documentação de atividades.

Funciona como **PWA instalável** em celular e desktop, com suporte a notificações push, modo offline e geração de relatórios PDF profissional.

---

## Funcionalidades

### Estagiário
- Tour de apresentação interativo no primeiro acesso (slides de todos os módulos + tooltips guiados com spotlight)
- Registro de entrada e saída com validação de geolocalização (opcional e configurável individualmente pelo gestor)
- **Geofence auto-checkout:** ao sair a mais de 200 m do laboratório com ponto em aberto, o registro é fechado automaticamente com notificação de atividades pendentes
- Sino de notificações em todas as páginas: ponto em aberto, atividades pendentes (auto-checkout), feedbacks respondidos, conquistas e metas de horas
- Documentação de atividades realizadas a cada sessão
- Correção ortográfica automática das atividades (dicionário Hunspell PT-BR com 311.641 palavras, sem API externa)
- Histórico completo dos últimos 60 dias + arquivo por mês
- Perfil com nível, pontos, conquistas e progresso de carga horária (níveis proporcionais à duração do curso)
- Ranking entre os estagiários do laboratório
- Envio de feedback ao gestor (+10 pts)
- Notificações push no celular
- Acesso rápido via PIN de 6 dígitos (sem precisar digitar e-mail/senha)

### Gestor
- Dashboard em tempo real: quem está presente, horas do mês, ranking rápido
- Aprovação ou rejeição de registros de ponto com atividades detalhadas
- Gestão completa de estagiários (cadastro, edição, horários, desativação)
- Configuração de isenção de geolocalização individual por estagiário
- 14 tipos de relatório exportáveis em PDF profissional
- Hall da Fama com campeões mensais por pontos
- Publicação de novidades e atualizações do sistema (sincronizadas automaticamente a cada deploy)
- Resposta a feedbacks dos estagiários
- Configurações do laboratório, geolocalização e integrações

---

## Stack tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 16.2 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4 |
| **Animações** | Framer Motion 12, Lucide React |
| **Backend** | Next.js API Routes (serverless), Supabase (PostgreSQL + Auth + RLS + Storage) |
| **PDF** | @react-pdf/renderer v4.5 — componentes React tipados renderizados no servidor |
| **Validação** | Zod — schemas tipados em 100% das API Routes |
| **Segurança** | bcryptjs (PIN, salt 12), JWT via Supabase Auth, Sentry (monitoramento em produção) |
| **Deploy** | Vercel (CDN global + Cron Jobs + proteção DDoS de borda) |
| **Notificações** | Web Push API (VAPID) |
| **Testes** | Playwright (E2E) |

---

## Screenshots

### Tela de Login

![Login](screenshots/01_login.png)

---

### Painel do Administrador

![Admin Dashboard](screenshots/02_admin_dashboard.png)

---

### Aprovação de Registros

![Aprovações](screenshots/03_admin_approvals.png)

---

### Gestão de Estagiários

![Estagiários](screenshots/04_admin_interns.png)

---

### Relatórios (14 tipos em PDF)

![Relatórios](screenshots/05_admin_reports.png)

---

### Ranking Geral

![Ranking Admin](screenshots/06_admin_ranking.png)

---

### Carga Horária

![Carga Horária](screenshots/07_admin_workload.png)

---

### Publicação de Atualizações

![Atualizações](screenshots/08_admin_updates.png)

---

### Configurações do Sistema

![Configurações](screenshots/09_admin_settings.png)

---

### Dashboard do Estagiário

![Dashboard Estagiário](screenshots/10_intern_dashboard.png)

---

### Histórico de Frequência

![Histórico](screenshots/11_intern_history.png)

---

### Ranking dos Estagiários

![Ranking](screenshots/12_intern_ranking.png)

---

### Perfil e Gamificação

![Perfil](screenshots/13_intern_profile.png)

---

### Conquistas

![Conquistas](screenshots/14_intern_profile_achievements.png)

---

### Versão Mobile

<div align="center">
<img src="screenshots/16_mobile_dashboard.png" width="380" alt="Mobile Dashboard" />
<img src="screenshots/17_mobile_profile.png" width="380" alt="Mobile Perfil" />
</div>

---

## Sistema de Gamificação

| Nível | Título | Pontos |
|-------|--------|--------|
| 1 | Novato / Novata | 0 pts |
| 2 | Aprendiz | 250 pts |
| 3 | Colaborador / Colaboradora | 600 pts |
| 4 | Dedicado / Dedicada | 1.200 pts |
| 5 | Especialista | 2.500 pts |
| 6 | Elite | 5.000 pts |

**Ganhe pontos por:** presença diária (+10), pontualidade (+5), atividades documentadas (+5), sessão completa (+3), feedback implementado (+25) e muito mais.

**Multiplicadores de streak:** 3 dias consecutivos (×1,2) · 7 dias (×1,5) · 30 dias (×2,0)

---

## Arquitetura

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── (auth)/            # Login, registro
│   ├── dashboard/         # Painel do estagiário
│   ├── history/           # Histórico + arquivo
│   ├── profile/           # Perfil, conquistas, relatórios
│   ├── intern-ranking/    # Ranking dos estagiários
│   ├── admin/             # Todas as páginas do gestor
│   └── api/               # API Routes
│       ├── auth/          # Autenticação, PIN, senha
│       ├── clock/         # Entrada e saída
│       ├── intern/        # Atividades, relatórios, feedback
│       ├── admin/         # Gestão, relatórios, configurações
│       └── cron/          # Manutenção automática diária
├── components/            # Componentes reutilizáveis
│   └── pdf/               # Componentes @react-pdf/renderer
├── lib/                   # Utilitários (gamificação, auth, logger+Sentry)
├── domain/                # Entidades e erros de domínio
├── application/           # Use cases e DTOs
└── infra/                 # Implementações Supabase
```

---

## Segurança

- **Autenticação:** JWT via Supabase Auth + PIN com bcrypt (salt 12)
- **Cookies:** httpOnly + secure + sameSite=lax (proteção XSS e CSRF)
- **Banco de dados:** Row Level Security — estagiário acessa apenas seus dados
- **Validação:** Zod em 100% das API Routes com limites de tamanho e tipos estritos
- **Autorização:** `requireManager()` verifica role e `is_active` a cada requisição admin
- **Monitoramento:** Sentry captura erros com 90 dias de persistência e registra eventos de segurança com tag `security_event=true`
- **DDoS:** Vercel CDN global com anycast e throttling automático serverless

---

## Como rodar localmente

```bash
# 1. Clonar
git clone https://github.com/emanuelmaestre/Controle_de_Ponto_Estagiarios
cd Controle_de_Ponto_Estagiarios

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher com suas chaves

# 4. Rodar em desenvolvimento
npm run dev
```

**Variáveis necessárias no `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Deploy

O projeto é hospedado na **Vercel** com deploy automático via Git push.

```bash
npx vercel --prod
```

O build executa automaticamente o script `scripts/sync-updates.mjs`, que sincroniza os commits recentes com a tabela `system_updates` do Supabase — tornando cada deploy automaticamente visível como novidade para os estagiários.

---

## Licença

Desenvolvido por **Emanuel Maestre** para o Laboratório de Informática — IFSULDEMINAS.
Orientador: **Prof. Milton Antônio Naves**
