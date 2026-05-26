# 🛠️ Stack do Projeto — Controle de Ponto

> Sistema de Gestão de Estagiários  
> Atualizado em: 26/05/2026

---

## Framework & Runtime

| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 16.2.6 | Framework React com App Router (Server + Client Components) |
| **React** | ^19.2.4 | Biblioteca de UI |
| **TypeScript** | ^5 | Tipagem estática |
| **Node.js** | ^20 | Runtime |

---

## Backend / BaaS / Auth

| Tecnologia | Versão | Uso |
|---|---|---|
| **@supabase/supabase-js** | ^2.106.1 | Auth · Banco de dados · Storage · RLS |
| **@supabase/ssr** | ^0.10.3 | Integração server-side com Next.js App Router |
| **bcryptjs** | ^3.0.3 | Hash seguro do PIN com salt 12 |
| **jsonwebtoken** | ^9.0.3 | JWT manual nos route handlers de API |

---

## UI / UX / Motion — Impacto Altíssimo 🔥

| Tecnologia | Versão | Uso |
|---|---|---|
| **sonner** | ^2.0.3 | Toasts com stack, promise e progress bar — substitui Radix Toast |
| **vaul** | ^1.1.2 | Bottom sheet nativo para mobile — essencial pro PWA |
| **input-otp** | ^1.4.2 | Input de PIN com caixinhas separadas (setup-pin e login) |
| **react-day-picker** | ^9.7.0 | Range picker de datas para relatórios de horas |
| **@formkit/auto-animate** | ^0.8.2 | Animação automática de listas — 1 linha de código |
| **react-intersection-observer** | ^9.16.0 | Animações de entrada no scroll com Framer Motion |
| **number-flow** | ^0.5.3 | Números animados nas métricas — efeito odômetro |
| **nprogress** | ^0.2.0 | Barra de loading no topo durante navegação entre rotas |

---

## Design System & Estilização

| Tecnologia | Versão | Uso |
|---|---|---|
| **tailwindcss** | ^4 | Estilização utilitária |
| **@tailwindcss/postcss** | ^4 | Integração PostCSS |
| **tailwind-merge** | ^3.6.0 | Merge de classes sem conflito |
| **clsx** | ^2.1.1 | Composição condicional de classNames |
| **class-variance-authority** | ^0.7.1 | Variantes de componentes tipadas |
| **motion** | ^12.40.0 | Animações e transições (Framer Motion v12) |
| **lucide-react** | ^1.16.0 | Ícones consistentes em todo o sistema |

---

## Radix UI

| Componente | Versão | Uso |
|---|---|---|
| **@radix-ui/react-avatar** | ^1.1.11 | Avatar do estagiário |
| **@radix-ui/react-dialog** | ^1.1.15 | Modais de confirmação de ponto |
| **@radix-ui/react-dropdown-menu** | ^2.1.16 | Menu de ações no painel |
| **@radix-ui/react-label** | ^2.1.8 | Labels acessíveis nos formulários |
| **@radix-ui/react-select** | ^2.2.6 | Select de mês/ano nos relatórios |
| **@radix-ui/react-tabs** | ^1.1.13 | Tabs no painel admin |
| **@radix-ui/react-switch** | ^1.1.2 | Toggle de configurações |
| **@radix-ui/react-tooltip** | ^1.1.5 | Tooltips de ajuda inline |
| **@radix-ui/react-progress** | ^1.1.4 | Barra de progresso de horas do dia |
| **@radix-ui/react-slot** | ^1.2.4 | Composição de componentes |

---

## State Management & Forms

| Tecnologia | Versão | Uso |
|---|---|---|
| **zustand** | ^5.0.13 | Estado global: sessão, filtros de data, UI |
| **@tanstack/react-query** | ^5.100.11 | Cache e revalidação das batidas de ponto |
| **@tanstack/react-table** | ^8.21.3 | Tabela de registros com sort, filtro e paginação |
| **react-hook-form** | ^7.76.0 | Gerenciamento de formulários performático |
| **@hookform/resolvers** | ^5.4.0 | Integração entre React Hook Form e Zod |
| **zod** | ^4.4.3 | Validação de schemas com tipagem TypeScript |

---

## Relatórios, Exportação & Gráficos

| Tecnologia | Versão | Uso |
|---|---|---|
| **recharts** | ^2.15.4 | Gráficos de horas por dia e por estagiário |
| **jspdf** | ^4.2.1 | Geração de PDF da folha de ponto mensal |
| **jspdf-autotable** | ^5.0.8 | Tabelas formatadas no PDF |
| **xlsx** | ^0.18.5 | Export de planilha de horas para RH |

---

## Email

| Tecnologia | Versão | Uso |
|---|---|---|
| **resend** | ^6.12.3 | Emails transacionais — alertas ao gestor |
| **react-email** | ^6.3.0 | Templates de email em React |

---

## HTTP

| Tecnologia | Versão | Uso |
|---|---|---|
| **axios** | ^1.16.1 | HTTP client para integrações externas |

---

## IA

| Tecnologia | Versão | Uso |
|---|---|---|
| **ai** (Vercel AI SDK) | ^6.0.190 | Insights de padrões de horário e resumo automático |
| **@ai-sdk/anthropic** | ^3.0.78 | Provider Anthropic para o AI SDK |

---

## PWA

| Tecnologia | Versão | Uso |
|---|---|---|
| **next-pwa** | latest | Service Worker e suporte offline |
| **Web Push API** | nativa | Notificações push para estagiários |

---

## Dev & Testes

| Tecnologia | Versão | Uso |
|---|---|---|
| **vitest** | ^4.1.7 | Testes de lógica de horas, saldo e PIN |
| **@vitejs/plugin-react** | ^6.0.2 | Plugin React para Vitest |
| **eslint** | ^9 | Linting |
| **eslint-config-next** | 16.2.6 | Regras ESLint para Next.js |
| **prettier** | ^3.8.3 | Formatação de código |

---

## Deploy & Infraestrutura

| Serviço | Uso |
|---|---|
| **Vercel** | Hospedagem, CI/CD e Edge Functions |
| **GitHub** | Repositório e versionamento de código |
| **Supabase** | PostgreSQL · Storage · Auth gerenciados |

---

## Arquitetura

```
src/
├── app/                  # Rotas (App Router Next.js)
│   ├── admin/            # Painel do gestor
│   ├── dashboard/        # Painel do estagiário
│   ├── api/              # Route Handlers (API)
│   ├── login/            # Autenticação
│   ├── register/         # Cadastro de estagiários
│   └── setup-pin/        # Criação de PIN no primeiro acesso
├── components/
│   ├── ui/               # Design system (Button, Input, Card...)
│   ├── charts/           # Componentes Recharts
│   ├── tables/           # Componentes TanStack Table
│   └── AdminNav.tsx      # Navegação do admin (desktop + mobile)
├── lib/
│   ├── supabase/         # Clientes Supabase (browser + server)
│   ├── validations.ts    # Schemas Zod
│   ├── email/            # Templates react-email
│   └── utils.ts          # Funções utilitárias (cn, formatHours...)
├── store/
│   └── useAppStore.ts    # Zustand — estado global
└── types/
    └── database.ts       # Tipos gerados do Supabase
```

---

## Fluxo de Acesso

```
Cadastro (/register)
    └── Conta criada como ativa
         └── Login (/login) com email + senha
              └── Sem PIN → /setup-pin → input-otp (4–6 dígitos)
                   └── Dashboard (/dashboard) ou Admin (/admin)
                        └── Próximos acessos → Login via PIN rápido
```

---

## Variáveis de Ambiente

| Variável | Finalidade |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role Supabase |
| `JWT_SECRET` | Segredo para geração de tokens JWT |
| `RESEND_API_KEY` | Chave da API Resend |
| `ANTHROPIC_API_KEY` | Chave da API Anthropic (AI SDK) |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |
