-- ============================================================
-- Migration 001 — Schema principal
-- App: Controle de Ponto de Estagiários
-- ============================================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- TABELA: profiles
-- Perfil de cada usuário (estagiário ou chefe)
-- ============================================================
CREATE TABLE public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  photo_url        TEXT,
  course           TEXT,
  internship_start DATE,
  internship_end   DATE,
  pin              TEXT,                          -- bcrypt hash, nunca texto puro
  role             TEXT        NOT NULL DEFAULT 'intern'
                   CHECK (role IN ('intern', 'manager')),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_internship CHECK (
    internship_end IS NULL OR internship_end >= internship_start
  )
);

-- ============================================================
-- TABELA: time_records
-- Cada par entrada/saída de um estagiário
-- ============================================================
CREATE TABLE public.time_records (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out        TIMESTAMPTZ,
  duration_minutes INTEGER,                       -- calculado por trigger
  notes            TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_by      UUID        REFERENCES public.profiles(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT clock_out_after_in CHECK (
    clock_out IS NULL OR clock_out > clock_in
  ),
  CONSTRAINT rejection_reason_required CHECK (
    status != 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) >= 10)
  )
);

-- ============================================================
-- TABELA: activities
-- Atividades realizadas em cada turno
-- ============================================================
CREATE TABLE public.activities (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  time_record_id UUID        NOT NULL REFERENCES public.time_records(id) ON DELETE CASCADE,
  description    TEXT        NOT NULL,
  is_favorite    BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: favorite_activities
-- Lista de favoritas por estagiário
-- ============================================================
CREATE TABLE public.favorite_activities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  use_count   INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (intern_id, description)
);

-- ============================================================
-- TABELA: push_subscriptions
-- Tokens Web Push por usuário/dispositivo
-- ============================================================
CREATE TABLE public.push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: notifications
-- Histórico de alertas enviados
-- ============================================================
CREATE TABLE public.notifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL
                CHECK (type IN ('reminder_in','reminder_out','pending','rejection','approval')),
  scheduled_for TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  is_sent       BOOLEAN     NOT NULL DEFAULT false,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: settings
-- Configurações globais do laboratório (singleton)
-- ============================================================
CREATE TABLE public.settings (
  id                          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_in_time            TIME  NOT NULL DEFAULT '08:00:00',
  reminder_out_after_hours    INT   NOT NULL DEFAULT 6,
  expected_daily_hours        INT   NOT NULL DEFAULT 6,
  lab_name                    TEXT  NOT NULL DEFAULT 'Laboratório',
  report_email                TEXT,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir registro singleton
INSERT INTO public.settings (id, lab_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Laboratório')
ON CONFLICT DO NOTHING;
