# Stack Técnica — Controle de Ponto Estagiários

## Visão Geral

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.6 (App Router, SSR, API Routes) |
| UI | React 19, Tailwind 4, Framer Motion 12, Lucide React |
| Banco | Supabase PostgreSQL + Auth + RLS + Storage |
| Estado | TanStack Query v5, SWR 2.4, Zustand 5 |
| Formulários | React Hook Form 7.76 + Zod 4.4 |
| PDF | @react-pdf/renderer 4.5, Poppins TTF local |
| Excel | xlsx 0.18 (SheetJS, client-side) |
| Gráficos | Recharts 3.8 |
| Auth | Supabase Auth + PIN (bcryptjs) |
| Deploy | Vercel + CLI 54.5 |
| Testes | Playwright 1.51 (E2E) |
| Spell-check | Levenshtein local — sem API |

---

## Frontend — O que o usuário vê e interage

| Stack | Versão | O que agrega |
|---|---|---|
| Next.js | 16.2.6 | Roteamento, páginas, Server Components, carregamento rápido |
| React | 19 | Componentes, estado local, interatividade |
| Tailwind CSS | 4 | Estilização com CSS variables, tema escuro, responsividade |
| Framer Motion | 12.40 | Animações, transições, spring physics, AnimatePresence |
| Lucide React | 1.16 | Todos os ícones SVG do sistema |
| Recharts | 3.8 | Gráficos (dashboard, ranking, workload) |
| TanStack Query | v5 | Cache e sincronização de dados — evita loading desnecessário |
| SWR | 2.4 | Revalidação em background — dados sempre frescos sem reload |
| Zustand | 5 | Estado global compartilhado entre componentes |
| React Hook Form | 7.76 | Formulários com validação em tempo real |
| Zod | 4.4 | Schema de validação de dados |
| NProgress | 0.2 | Barra de progresso no topo durante navegação |
| Sonner | 2.0 | Toast notifications — feedback de ações ao usuário |
| Number Flow | 0.6 | Animação suave em números (pontos, estatísticas) |
| input-otp | 1.4 | Campo de PIN numérico |
| react-easy-crop | 6.0 | Crop de foto de perfil |
| browser-image-compression | 2.0 | Compressão de imagem antes do upload |
| @react-pdf/renderer | 4.5 | Geração de PDF — renderiza componentes React como PDF |
| xlsx | 0.18 | Export Excel direto no navegador (client-side, SheetJS) |

---

## Backend / Infra — Invisível ao usuário

| Stack | Versão | Papel |
|---|---|---|
| Supabase | 2.106 | PostgreSQL + Auth + RLS Policies + Storage |
| @supabase/ssr | 0.10 | Client SSR para Next.js (server/client cookies) |
| bcryptjs | 3.0 | Hash do PIN numérico |
| Levenshtein (local) | — | Correção ortográfica sem dependência de API |
| Vercel | CLI 54.5 | Deploy automático via Git push, Edge Network |
| Playwright | 1.51 | Testes E2E automatizados |
| ESLint | 9 | Lint + eslint-config-next |
| TypeScript | 5 | Tipagem estática em todo o projeto |

---

## Paleta de Cores (CSS Variables)

| Variável | Hex | Uso |
|---|---|---|
| `--bg` | `#07170c` | Fundo principal da aplicação |
| `--surface` / `--surface-card` | `#0f2318` | Cards e painéis |
| `--primary` | `#3fe56c` | Cor de destaque principal (verde) |
| `--success` | `#00c853` | Indicadores de sucesso |
| `--warning` | `#ffbf00` | Alertas e avisos |
| `--danger` | `#ff5252` | Erros e ações destrutivas |

---

## Módulos do Sistema

| Módulo | Descrição |
|---|---|
| **Ponto** | Clock-in/out com GPS, geofencing, aprovação admin, atividades + auto-correção |
| **Gamificação** | Pontos (+5/-5), nível, streak, conquistas/badges, ranking público |
| **Relatórios** | 14 tipos — PDF (react-pdf) + Excel, frequência individual, ranking, geral |
| **Admin** | Gestão de estagiários, aprovações pendentes, histórico completo, carga horária |
| **Auth** | Supabase Auth, PIN numérico, roles: `intern` / `manager`, RLS por usuário |
| **Histórico** | Registros dos últimos 60 dias + arquivo de registros antigos |
| **Atualizações** | Feed de novidades do sistema sincronizado via script no deploy |

---

## Estrutura de Rotas Principais

```
/                        → Redirect por role
/login                   → Autenticação
/dashboard               → Painel do estagiário
/history                 → Histórico de ponto (60 dias)
/history/archive         → Registros anteriores a 60 dias
/ranking                 → Ranking público
/profile                 → Perfil + relatórios do estagiário
/updates                 → Feed de atualizações do sistema
/admin                   → Dashboard admin
/admin/interns           → Lista de estagiários
/admin/interns/[id]      → Detalhe + histórico + conquistas
/admin/approvals         → Aprovações pendentes
/admin/reports           → 14 relatórios (PDF + Excel)
/admin/ranking           → Ranking administrativo
/admin/workload          → Carga horária
/admin/settings          → Configurações do sistema
```

---

## Rotas de API Principais

```
POST /api/intern/checkin              → Registrar entrada
POST /api/intern/checkout             → Registrar saída
POST /api/intern/activities           → Adicionar atividade (com auto-correção)
GET  /api/intern/report               → PDF do próprio estagiário

GET  /api/admin/report                → PDF Frequência Individual (admin)
GET  /api/admin/report-table          → PDF genérico de tabela (13 outros relatórios)
GET  /api/admin/reports-catalog       → Dados JSON para qualquer relatório
GET  /api/admin/interns               → Lista de estagiários

GET  /api/updates                     → Feed de atualizações
```

---

*Gerado em: junho de 2026*
