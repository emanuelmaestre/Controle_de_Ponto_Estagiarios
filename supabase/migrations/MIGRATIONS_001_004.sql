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
-- ============================================================
-- Migration 002 — Triggers e Funções PostgreSQL
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- TRIGGER 1: Calcular duration_minutes ao registrar saída
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calc_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Só calcula quando clock_out é preenchido pela primeira vez
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    NEW.duration_minutes :=
      EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_duration
  BEFORE UPDATE ON public.time_records
  FOR EACH ROW
  EXECUTE FUNCTION public.calc_duration();

-- ──────────────────────────────────────────────────────────
-- TRIGGER 2: Impedir edição de registros aprovados
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lock_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Registro aprovado é imutável. ID: %', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_approved
  BEFORE UPDATE ON public.time_records
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_approved();

-- ──────────────────────────────────────────────────────────
-- TRIGGER 3: Impedir clock_in duplo aberto
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_duplicate_clock_in()
RETURNS TRIGGER AS $$
DECLARE
  open_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO open_count
  FROM public.time_records
  WHERE intern_id = NEW.intern_id
    AND clock_out IS NULL
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');

  IF open_count > 0 THEN
    RAISE EXCEPTION 'Já existe uma entrada em aberto para este estagiário.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_clock_in
  BEFORE INSERT ON public.time_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_clock_in();

-- ──────────────────────────────────────────────────────────
-- TRIGGER 4: Criar profile automaticamente ao criar usuário
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- TRIGGER 5: Atualizar updated_at em settings
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
-- ============================================================
-- Migration 003 — Views otimizadas
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- VIEW: Status de cada estagiário hoje (painel em tempo real)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_today_status AS
SELECT
  p.id,
  p.full_name,
  p.photo_url,
  p.email,
  tr.id           AS record_id,
  tr.clock_in,
  tr.clock_out,
  tr.status,
  CASE
    WHEN tr.clock_in IS NOT NULL AND tr.clock_out IS NULL THEN 'ativo'
    WHEN tr.clock_in IS NOT NULL AND tr.clock_out IS NOT NULL THEN 'saiu'
    ELSE 'ausente'
  END             AS today_status,
  -- Horas trabalhadas hoje (apenas aprovados + turno atual aberto)
  COALESCE((
    SELECT SUM(duration_minutes)
    FROM public.time_records sub
    WHERE sub.intern_id = p.id
      AND sub.clock_in::date = CURRENT_DATE
      AND (sub.status = 'approved' OR sub.clock_out IS NULL)
  ), 0)           AS today_minutes,
  -- Contagem de pendentes do estagiário
  (
    SELECT COUNT(*)
    FROM public.time_records sub
    WHERE sub.intern_id = p.id
      AND sub.status = 'pending'
  )               AS pending_count
FROM public.profiles p
LEFT JOIN LATERAL (
  -- Último registro do dia
  SELECT * FROM public.time_records
  WHERE intern_id = p.id
    AND clock_in::date = CURRENT_DATE
  ORDER BY clock_in DESC
  LIMIT 1
) tr ON true
WHERE p.role = 'intern'
  AND p.is_active = true;

-- ──────────────────────────────────────────────────────────
-- VIEW: Horas mensais por estagiário (apenas aprovados)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_monthly_hours AS
SELECT
  intern_id,
  DATE_TRUNC('month', clock_in)   AS month,
  SUM(duration_minutes)           AS total_minutes,
  COUNT(*)                        AS total_sessions,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_sessions,
  COUNT(*) FILTER (WHERE status = 'pending')  AS pending_sessions,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_sessions
FROM public.time_records
GROUP BY intern_id, DATE_TRUNC('month', clock_in);

-- ──────────────────────────────────────────────────────────
-- VIEW: Fila de aprovações com dados completos
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_pending_approvals AS
SELECT
  tr.id,
  tr.intern_id,
  p.full_name       AS intern_name,
  p.photo_url,
  tr.clock_in,
  tr.clock_out,
  tr.duration_minutes,
  tr.notes,
  tr.status,
  tr.created_at,
  -- Lista de atividades como JSON array
  COALESCE((
    SELECT json_agg(a.description ORDER BY a.created_at)
    FROM public.activities a
    WHERE a.time_record_id = tr.id
  ), '[]'::json)   AS activities
FROM public.time_records tr
JOIN public.profiles p ON p.id = tr.intern_id
WHERE tr.status = 'pending'
ORDER BY tr.clock_in ASC;
-- ============================================================
-- Migration 004 — Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings           ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- Função auxiliar: retorna o role do usuário autenticado
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'manager'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

-- Estagiário lê apenas o próprio perfil; manager lê todos
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_manager()
  );

-- Apenas manager pode criar perfis (sem autocadastro)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.is_manager());

-- Manager pode atualizar qualquer perfil;
-- estagiário pode atualizar apenas photo_url e pin do próprio perfil
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    public.is_manager() OR auth.uid() = id
  ) WITH CHECK (
    public.is_manager() OR auth.uid() = id
  );

-- Apenas manager pode deletar
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (public.is_manager());

-- ============================================================
-- POLICIES: time_records
-- ============================================================

-- Estagiário lê apenas os próprios; manager lê todos
CREATE POLICY "records_select" ON public.time_records
  FOR SELECT USING (
    intern_id = auth.uid() OR public.is_manager()
  );

-- Estagiário só insere registros para si mesmo
CREATE POLICY "records_insert" ON public.time_records
  FOR INSERT WITH CHECK (intern_id = auth.uid());

-- Estagiário atualiza apenas campos permitidos (clock_out, notes)
-- quando o status ainda é 'pending'
-- Manager atualiza qualquer campo (para aprovação/rejeição)
CREATE POLICY "records_update" ON public.time_records
  FOR UPDATE USING (
    (intern_id = auth.uid() AND status = 'pending') OR public.is_manager()
  );

-- Ninguém deleta registros (auditoria preservada)
CREATE POLICY "records_no_delete" ON public.time_records
  FOR DELETE USING (false);

-- ============================================================
-- POLICIES: activities
-- ============================================================

CREATE POLICY "activities_select" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id
        AND (tr.intern_id = auth.uid() OR public.is_manager())
    )
  );

CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id AND tr.intern_id = auth.uid()
    )
  );

CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id AND tr.intern_id = auth.uid()
        AND tr.status = 'pending'
    )
  );

-- ============================================================
-- POLICIES: favorite_activities
-- ============================================================

CREATE POLICY "favorites_select" ON public.favorite_activities
  FOR SELECT USING (intern_id = auth.uid() OR public.is_manager());

CREATE POLICY "favorites_insert" ON public.favorite_activities
  FOR INSERT WITH CHECK (intern_id = auth.uid());

CREATE POLICY "favorites_update" ON public.favorite_activities
  FOR UPDATE USING (intern_id = auth.uid());

CREATE POLICY "favorites_delete" ON public.favorite_activities
  FOR DELETE USING (intern_id = auth.uid());

-- ============================================================
-- POLICIES: push_subscriptions
-- ============================================================

CREATE POLICY "push_select" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_manager());

CREATE POLICY "push_insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_delete" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- POLICIES: notifications
-- ============================================================

CREATE POLICY "notif_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_manager());

-- Apenas o sistema (service role) insere notificações
CREATE POLICY "notif_insert" ON public.notifications
  FOR INSERT WITH CHECK (public.is_manager());

-- ============================================================
-- POLICIES: settings
-- ============================================================

-- Todos leem as configurações
CREATE POLICY "settings_select" ON public.settings
  FOR SELECT USING (true);

-- Apenas manager edita
CREATE POLICY "settings_update" ON public.settings
  FOR UPDATE USING (public.is_manager());

-- ============================================================
-- POLÍTICAS DE STORAGE: bucket avatars
-- ============================================================
-- (Executar após criar o bucket no Supabase Dashboard)

-- Upload: usuário só sobe na própria pasta (avatars/{user_id}/*)
-- CREATE POLICY "avatars_upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- Leitura pública
-- CREATE POLICY "avatars_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');
--
-- Deletar: apenas o próprio usuário
-- CREATE POLICY "avatars_delete" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'avatars' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
