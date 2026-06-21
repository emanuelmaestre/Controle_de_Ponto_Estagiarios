# PRD — ChronosLab Controle de Ponto

> Product Requirements Document
> Versao: 2.0 — Reescrita Clean Architecture
> Data: 29/05/2026

---

## 0. Decisao Oficial de Produto

**Direcao aprovada em 20/06/2026:** o ChronosLab deve seguir como **MVP simples de controle de ponto**, nao como plataforma expandida.

O produto deve priorizar estabilidade operacional, seguranca das rotas, relatorios confiaveis e baixo custo de manutencao. Funcionalidades expandidas como gamificacao profunda, notificacoes complexas, automacoes avancadas, IA, geolocalizacao obrigatoria e fluxos de RH completos ficam fora do escopo principal, salvo decisao futura documentada.

---

## 1. Visao Geral

Sistema web de controle de ponto para estagiarios de um laboratorio universitario.
Na essencia: um **CRUD de registros de ponto** com **dashboard interativo** e **painel administrativo**.

### O que o sistema FAZ (escopo real)

1. Estagiario bate ponto (entrada/saida)
2. Estagiario registra atividades realizadas
3. Gestor visualiza dashboard com presenca e horas
4. Gestor exporta relatorios

### O que o sistema NAO precisa ser

- Nao e uma plataforma de RH completa
- Nao e um sistema de gamificacao
- Nao e um app de geolocalizacao
- Nao e um sistema de notificacoes push
- Nao e um sistema de IA

---

## 2. Problemas do Sistema Atual

| Problema | Detalhe |
|---|---|
| **Over-engineering** | 36+ dependencias para um CRUD. bcryptjs, framer-motion, recharts, input-otp, number-flow, nprogress, zustand, react-query, swr (duplicado!) |
| **Responsabilidades misturadas** | API routes fazem auth + validacao + business logic + persistencia tudo junto |
| **Sem separacao de camadas** | Componentes de UI chamam Supabase diretamente. Paginas fazem queries SQL inline |
| **Rotas de manutencao no producao** | fix-roles, fix-start-dates, fix-test-profile, normalize-names sao scripts avulsos expostos como API |
| **Duplicacao** | register + register-with-photo fazem a mesma coisa. SWR + React Query para cache |
| **Complexidade de auth** | PIN com bcrypt + magic link + verify-otp para simular login. Poderia ser email+senha direto |
| **Geo como requisito** | Geolocalizacao com haversine, whitelist, location_attempts — complexidade desproporcional |
| **Estado global desnecessario** | Zustand para estado que e server-side (perfil, sessao) |

---

## 3. Personas

### Estagiario
- Aluno universitario fazendo estagio no laboratorio
- Precisa registrar entrada/saida diariamente
- Precisa ver suas horas acumuladas
- Usa celular (mobile-first)

### Gestor
- Professor ou coordenador do laboratorio
- Precisa visualizar quem esta presente
- Precisa gerar relatorios mensais
- Usa desktop (desktop-first)

---

## 4. Funcionalidades — Escopo Simplificado

### 4.1 Autenticacao

| Feature | Descricao | Prioridade |
|---|---|---|
| Login | Email + senha via Supabase Auth | P0 |
| Registro | Nome, email, senha, curso | P0 |
| Logout | Encerrar sessao | P0 |
| Esqueci senha | Reset via email (Supabase nativo) | P1 |

**Removido:** PIN login, magic links, bcrypt, selfie obrigatoria, repair-profile.
**Motivo:** Supabase Auth ja resolve tudo isso nativamente. PIN e complexidade sem ganho real.

### 4.2 Ponto (CRUD principal)

| Feature | Descricao | Prioridade |
|---|---|---|
| Registrar entrada | Criar time_record com clock_in = now() | P0 |
| Registrar saida | Atualizar clock_out = now() no registro aberto | P0 |
| Adicionar atividades | Texto livre vinculado ao registro | P0 |
| Historico | Listar registros do estagiario com filtro por mes | P0 |
| Validacao de local | Opcional: checar se esta no raio do lab | P2 |

**Removido:** favorite_activities, location_attempts, geo_blocked, geo_exempt whitelist.
**Motivo:** Atividades favoritas sao micro-otimizacao. Geo e uma feature separada que pode ser um middleware simples, nao um subsistema.

### 4.3 Dashboard do Estagiario

| Feature | Descricao | Prioridade |
|---|---|---|
| Status atual | "Voce esta trabalhando ha Xh" ou "Nenhum registro aberto" | P0 |
| Horas do mes | Total de horas aprovadas no mes corrente | P0 |
| Registros do dia | Lista de entradas/saidas de hoje | P0 |
| Botao de ponto | Entrada ou saida conforme estado atual | P0 |

**Removido:** progress ring, gamification badges, ranking, animated numbers, motivational messages.
**Motivo:** Decorativo, nao funcional. Pode ser adicionado depois como enhancement.

### 4.4 Painel Admin

| Feature | Descricao | Prioridade |
|---|---|---|
| Dashboard | Quantos presentes/ausentes agora + lista de estagiarios | P0 |
| CRUD estagiarios | Criar, editar, ativar/desativar estagiarios | P0 |
| Relatorios | Tabela de horas por estagiario no mes, exportar Excel | P0 |
| Configuracoes | Nome do lab, horas diarias esperadas, email de relatorio | P1 |

**Removido:** normalize-names, fix-roles, fix-start-dates, sync-profiles, ranking admin, workload page.
**Motivo:** Scripts de correcao nao sao features — sao migrations ou seeds. Ranking/workload sao derivados do relatorio.

### 4.5 Removido do Escopo

| Feature | Motivo da remocao |
|---|---|
| PWA / Service Worker | Over-engineering para um app web simples |
| Push Notifications | Complexidade alta, valor baixo |
| Selfie obrigatoria | Invasivo, complexo (camera API), pouco valor |
| PIN login | Supabase Auth ja tem sessao persistente |
| Temas (dark/light/lab) | Nice-to-have, nao essencial |
| AI Insights | Completamente fora de escopo |
| Email transacional (Resend) | Supabase Auth ja envia emails de reset |
| Graficos Recharts | Uma tabela bem feita resolve |

---

## 5. Clean Architecture — Estrutura Proposta

### 5.1 Principio

```
Dependencias apontam para DENTRO.
UI depende de Use Cases.
Use Cases dependem de Entities.
Nenhuma camada interna conhece a externa.
```

```
+-------------------------------------------------------+
|  Frameworks & Drivers (Next.js, Supabase, Tailwind)   |
|  +---------------------------------------------------+|
|  |  Interface Adapters (Controllers, Presenters)     ||
|  |  +-----------------------------------------------+||
|  |  |  Use Cases (Application Business Rules)       |||
|  |  |  +-------------------------------------------+|||
|  |  |  |  Entities (Enterprise Business Rules)     ||||
|  |  |  +-------------------------------------------+|||
|  |  +-----------------------------------------------+||
|  +---------------------------------------------------+|
+-------------------------------------------------------+
```

### 5.2 Estrutura de Pastas

```
src/
├── domain/                        # CAMADA 1 — Entities
│   ├── entities/
│   │   ├── User.ts                # { id, name, email, role, course, isActive }
│   │   ├── TimeRecord.ts          # { id, userId, clockIn, clockOut, notes }
│   │   ├── Activity.ts            # { id, timeRecordId, description }
│   │   └── Settings.ts            # { labName, expectedDailyHours, reportEmail }
│   ├── enums/
│   │   └── UserRole.ts            # 'intern' | 'manager'
│   └── errors/
│       └── DomainError.ts         # Erros de dominio tipados
│
├── application/                   # CAMADA 2 — Use Cases
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── LoginUseCase.ts
│   │   │   ├── RegisterUseCase.ts
│   │   │   └── LogoutUseCase.ts
│   │   ├── time-record/
│   │   │   ├── ClockInUseCase.ts
│   │   │   ├── ClockOutUseCase.ts
│   │   │   └── ListRecordsUseCase.ts
│   │   ├── intern/
│   │   │   ├── CreateInternUseCase.ts
│   │   │   ├── UpdateInternUseCase.ts
│   │   │   ├── ListInternsUseCase.ts
│   │   │   └── ToggleInternActiveUseCase.ts
│   │   └── report/
│   │       ├── GetMonthlyReportUseCase.ts
│   │       └── ExportReportUseCase.ts
│   ├── ports/                     # Interfaces (contratos)
│   │   ├── IUserRepository.ts
│   │   ├── ITimeRecordRepository.ts
│   │   ├── IActivityRepository.ts
│   │   ├── ISettingsRepository.ts
│   │   └── IAuthService.ts
│   └── dtos/
│       ├── ClockInDTO.ts          # { userId }
│       ├── ClockOutDTO.ts         # { recordId, activities[], notes? }
│       ├── RegisterDTO.ts         # { name, email, password, course? }
│       └── ReportFilterDTO.ts     # { month, year }
│
├── infra/                         # CAMADA 3 — Interface Adapters + Frameworks
│   ├── repositories/              # Implementacoes dos ports
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseTimeRecordRepository.ts
│   │   ├── SupabaseActivityRepository.ts
│   │   └── SupabaseSettingsRepository.ts
│   ├── services/
│   │   └── SupabaseAuthService.ts
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server client + service role
│   └── container.ts               # Dependency injection (factory simples)
│
├── app/                           # CAMADA 4 — Next.js (Framework)
│   ├── api/                       # Route Handlers (Controllers)
│   │   ├── auth/
│   │   │   ├── login/route.ts     # POST — chama LoginUseCase
│   │   │   ├── register/route.ts  # POST — chama RegisterUseCase
│   │   │   └── logout/route.ts    # POST — chama LogoutUseCase
│   │   ├── clock/
│   │   │   ├── in/route.ts        # POST — chama ClockInUseCase
│   │   │   └── out/route.ts       # POST — chama ClockOutUseCase
│   │   ├── records/
│   │   │   └── route.ts           # GET — chama ListRecordsUseCase
│   │   ├── interns/
│   │   │   └── route.ts           # GET, POST — CRUD via Use Cases
│   │   └── reports/
│   │       └── route.ts           # GET — chama GetMonthlyReportUseCase
│   ├── (auth)/                    # Grupo de rotas publicas
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (app)/                     # Grupo de rotas autenticadas
│   │   ├── dashboard/page.tsx     # Dashboard estagiario
│   │   ├── checkout/page.tsx      # Clock-out + atividades
│   │   └── history/page.tsx       # Historico de registros
│   ├── (admin)/                   # Grupo de rotas admin
│   │   ├── layout.tsx             # Verifica role manager
│   │   ├── page.tsx               # Dashboard admin
│   │   ├── interns/page.tsx       # CRUD estagiarios
│   │   ├── reports/page.tsx       # Relatorios
│   │   └── settings/page.tsx      # Configuracoes
│   ├── layout.tsx
│   ├── page.tsx                   # Redirect por role
│   └── globals.css
│
├── components/                    # Componentes de UI
│   ├── ui/                        # Design system basico
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── Select.tsx
│   ├── ClockButton.tsx            # Botao de ponto (simples: entrada/saida)
│   ├── RecordsList.tsx            # Lista de registros reutilizavel
│   ├── AdminNav.tsx               # Navegacao admin
│   └── InternNav.tsx              # Navegacao estagiario
│
├── hooks/                         # React hooks
│   ├── useAuth.ts                 # Estado de autenticacao
│   └── useRecords.ts              # Fetch de registros
│
├── lib/                           # Utilitarios puros
│   ├── formatters.ts              # formatDate, formatHours, minutesToHours
│   ├── validators.ts              # Schemas Zod
│   └── constants.ts               # Roles, status labels, cores
│
├── middleware.ts                   # Auth guard
└── types/
    └── database.ts                # Tipos Supabase gerados
```

### 5.3 Como cada camada funciona

#### Entities (domain/)

Objetos puros, sem dependencia de framework. Representam as regras de negocio fundamentais.

```typescript
// domain/entities/TimeRecord.ts
export class TimeRecord {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly clockIn: Date,
    public clockOut: Date | null,
    public notes: string | null,
  ) {}

  get isOpen(): boolean {
    return this.clockOut === null
  }

  get durationMinutes(): number | null {
    if (!this.clockOut) return null
    return Math.floor((this.clockOut.getTime() - this.clockIn.getTime()) / 60000)
  }

  close(now: Date): void {
    if (!this.isOpen) throw new DomainError('Registro ja fechado')
    this.clockOut = now
  }
}
```

#### Use Cases (application/)

Orquestram a logica da aplicacao. Recebem DTOs, usam ports (interfaces), retornam resultados.

```typescript
// application/use-cases/time-record/ClockInUseCase.ts
export class ClockInUseCase {
  constructor(
    private userRepo: IUserRepository,
    private recordRepo: ITimeRecordRepository,
  ) {}

  async execute(userId: string): Promise<TimeRecord> {
    const user = await this.userRepo.findById(userId)
    if (!user || !user.isActive) throw new DomainError('Usuario inativo')

    const openRecord = await this.recordRepo.findOpenByUser(userId)
    if (openRecord) throw new DomainError('Ja existe registro aberto')

    const record = new TimeRecord(
      crypto.randomUUID(),
      userId,
      new Date(),
      null,
      null,
    )

    await this.recordRepo.save(record)
    return record
  }
}
```

#### Ports (application/ports/)

Interfaces que definem contratos. A camada de infra implementa.

```typescript
// application/ports/ITimeRecordRepository.ts
export interface ITimeRecordRepository {
  save(record: TimeRecord): Promise<void>
  findById(id: string): Promise<TimeRecord | null>
  findOpenByUser(userId: string): Promise<TimeRecord | null>
  findByUser(userId: string, month: number, year: number): Promise<TimeRecord[]>
  update(record: TimeRecord): Promise<void>
}
```

#### Repositories (infra/)

Implementacoes concretas dos ports usando Supabase.

```typescript
// infra/repositories/SupabaseTimeRecordRepository.ts
export class SupabaseTimeRecordRepository implements ITimeRecordRepository {
  constructor(private supabase: SupabaseClient) {}

  async findOpenByUser(userId: string): Promise<TimeRecord | null> {
    const { data } = await this.supabase
      .from('time_records')
      .select('*')
      .eq('intern_id', userId)
      .is('clock_out', null)
      .maybeSingle()

    return data ? this.toDomain(data) : null
  }

  async save(record: TimeRecord): Promise<void> {
    await this.supabase.from('time_records').insert({
      id: record.id,
      intern_id: record.userId,
      clock_in: record.clockIn.toISOString(),
      status: record.status,
    })
  }

  private toDomain(row: any): TimeRecord {
    return new TimeRecord(
      row.id,
      row.intern_id,
      new Date(row.clock_in),
      row.clock_out ? new Date(row.clock_out) : null,
      row.status,
      row.notes,
    )
  }
}
```

#### Route Handlers (app/api/)

Controllers finos. So parseiam request, chamam use case, retornam response.

```typescript
// app/api/clock/in/route.ts
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const useCase = container.clockInUseCase()

  try {
    const record = await useCase.execute(user.id)
    return NextResponse.json({ success: true, record })
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

#### Container (infra/container.ts)

Factory simples para injecao de dependencia (sem framework DI).

```typescript
// infra/container.ts
export const container = {
  clockInUseCase: () => {
    const supabase = createSupabaseServiceClient()
    const userRepo = new SupabaseUserRepository(supabase)
    const recordRepo = new SupabaseTimeRecordRepository(supabase)
    return new ClockInUseCase(userRepo, recordRepo)
  },

  clockOutUseCase: () => {
    const supabase = createSupabaseServiceClient()
    const recordRepo = new SupabaseTimeRecordRepository(supabase)
    const activityRepo = new SupabaseActivityRepository(supabase)
    return new ClockOutUseCase(recordRepo, activityRepo)
  },

  // ... demais use cases
}
```

---

## 6. Banco de Dados — Simplificado

### Tabelas necessarias (5 tabelas, 0 views)

```sql
-- Perfis de usuario
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  course TEXT,
  role TEXT NOT NULL DEFAULT 'intern' CHECK (role IN ('intern', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registros de ponto
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES profiles(id),
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE WHEN clock_out IS NOT NULL
      THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 60
      ELSE NULL
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atividades realizadas
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_record_id UUID NOT NULL REFERENCES time_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuracoes do lab (1 registro)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_name TEXT NOT NULL DEFAULT 'ChronosLab',
  expected_daily_hours NUMERIC NOT NULL DEFAULT 6,
  report_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Horarios esperados por dia
CREATE TABLE intern_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES profiles(id),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  expected_start TIME NOT NULL,
  expected_end TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(intern_id, day_of_week)
);
```

### Removido

| Tabela removida | Motivo |
|---|---|
| `favorite_activities` | Micro-otimizacao. Autocomplete no frontend resolve |
| `location_attempts` | Log de geo. Desnecessario sem geo como feature core |
| `push_subscriptions` | Push notifications removido do escopo |
| `notifications` | Fila de notificacoes removida do escopo |
| `v_today_status` | View. Substituida por query no use case |
| `v_monthly_hours` | View. Substituida por query no use case |
| `v_pending_approvals` | View. Substituida por query no use case |

---

## 7. API — Endpoints Simplificados

### Auth (3 endpoints)

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/api/auth/register` | Criar conta (name, email, password, course?) |
| POST | `/api/auth/logout` | Encerrar sessao |
| POST | `/api/auth/forgot-password` | Enviar email de reset |

Login e reset de senha sao tratados pelo Supabase Auth diretamente no client.

### Ponto (2 endpoints)

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/api/clock/in` | Registrar entrada |
| POST | `/api/clock/out` | Registrar saida (body: { recordId, activities[], notes? }) |

### Registros (1 endpoint)

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/api/records?month=&year=` | Listar registros do usuario logado |

### Estagiarios (2 endpoints)

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/api/interns` | Listar todos (admin) |
| POST | `/api/interns` | Criar estagiario (admin) |

### Relatorios (1 endpoint)

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/api/reports?month=&year=` | Dados agregados do mes |

### Total: 9 endpoints vs 22 atuais (59% de reducao)

---

## 8. Stack Simplificada

### Mantido

| Tecnologia | Justificativa |
|---|---|
| **Next.js 16** | App Router, SSR, API routes — tudo em um |
| **React 19** | UI library |
| **TypeScript 5** | Tipagem |
| **Supabase** | Auth + DB + RLS — ja resolve 80% do backend |
| **Tailwind CSS 4** | Estilizacao rapida |
| **Zod** | Validacao de schemas |
| **React Hook Form** | Formularios |
| **xlsx** | Exportacao de planilha |

### Removido

| Tecnologia | Motivo |
|---|---|
| **bcryptjs** | Supabase Auth ja faz hash. PIN removido |
| **framer-motion** | Decorativo. CSS transitions resolvem |
| **recharts** | Tabela HTML bem feita substitui graficos simples |
| **zustand** | Server components + props drilling resolvem |
| **react-query + swr** | Duplicado. Server components ja fazem fetch |
| **input-otp** | PIN removido |
| **number-flow** | Decorativo |
| **nprogress** | Decorativo |
| **sonner** | alert() ou toast CSS simples resolve |
| **lucide-react** | Pode usar, mas nao e essencial |
| **class-variance-authority** | Over-engineering para poucos componentes |
| **resend + react-email** | Supabase Auth ja envia emails |
| **ai + @ai-sdk/anthropic** | Fora do escopo |
| **next-pwa** | Fora do escopo |

### De 36 dependencias para ~10.

---

## 9. Paginas — Simplificado

### Estagiario (4 paginas)

| Rota | Funcao |
|---|---|
| `/login` | Email + senha |
| `/register` | Cadastro simples |
| `/dashboard` | Status + botao de ponto + registros do dia + horas do mes |
| `/history` | Tabela de registros com filtro por mes |

### Admin (4 paginas)

| Rota | Funcao |
|---|---|
| `/admin` | Dashboard: presentes/ausentes + lista de estagiarios |
| `/admin/interns` | CRUD de estagiarios (tabela + form) |
| `/admin/reports` | Tabela de horas por estagiario + exportar Excel |
| `/admin/settings` | Nome do lab, horas esperadas, email |

### Total: 8 paginas vs 17 atuais (53% de reducao)

---

## 10. Regras de Negocio (Domain Rules)

1. Um estagiario so pode ter **1 registro aberto** por vez
2. Clock-out so pode ser feito pelo **proprio estagiario** no **seu registro aberto**
3. Estagiario **inativo** nao pode bater ponto
4. `duration_minutes` e **calculado automaticamente** pelo banco (coluna generated)
5. Somente **managers** podem acessar o painel admin
6. Clock-out exige pelo menos **1 atividade** registrada

---

## 11. Proximos Passos

### Fase 1 — MVP (o que importa)
- [ ] Estruturar pastas Clean Architecture
- [ ] Criar entities e use cases
- [ ] Implementar repositories Supabase
- [ ] Criar as 9 API routes finas
- [ ] Construir as 8 paginas com UI simples
- [ ] Deploy Vercel

### Fase 2 — Enhancements (se necessario)
- [ ] Geolocalizacao como middleware opcional
- [ ] Graficos no dashboard admin
- [ ] Tema dark/light
- [ ] PWA basico (manifest + offline page)

### Fase 3 — Nice to have (futuro)
- [ ] Notificacoes push
- [ ] Export PDF
- [ ] Ranking/gamificacao
- [ ] Foto de perfil
