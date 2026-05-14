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
