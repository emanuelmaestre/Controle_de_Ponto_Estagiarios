-- ============================================================
-- Migration 007 — Corrige fluxo de checkout
-- Problema: registros criados com status='approved' no clock-in
-- ficavam bloqueados pelo trigger lock_approved, impedindo o clock-out.
-- ============================================================

-- Fix 1: Trigger lock_approved — permite setar clock_out pela primeira vez
-- (fechar um registro aberto é permitido; re-abrir ou editar fechado é bloqueado)
CREATE OR REPLACE FUNCTION public.lock_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    -- Permite somente a transição "aberto → fechado" (clock_out: NULL → valor)
    IF NOT (OLD.clock_out IS NULL AND NEW.clock_out IS NOT NULL) THEN
      RAISE EXCEPTION 'Registro aprovado e imutavel. ID: %', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: Auto-aprova registro ao fechar (quando clock_out é definido)
-- Assim os registros passam de 'pending' → 'approved' automaticamente ao dar saída.
CREATE OR REPLACE FUNCTION public.calc_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    NEW.duration_minutes :=
      EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 3: RLS records_update — permite estagiário atualizar registro aberto (sem depender do status)
DROP POLICY IF EXISTS "records_update" ON public.time_records;
CREATE POLICY "records_update" ON public.time_records
  FOR UPDATE USING (
    (intern_id = auth.uid() AND clock_out IS NULL) OR public.is_manager()
  );

-- Fix 4: RLS activities_update — idem, remove dependência de status='pending'
DROP POLICY IF EXISTS "activities_update" ON public.activities;
CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id
        AND tr.intern_id = auth.uid()
        AND tr.clock_out IS NULL
    )
  );

-- Fix 5: Desbloqueia registros abertos que estão presos com status='approved'
-- (criados pelo bug do clock-in que setava approved antes do clock-out).
-- Desativa temporariamente o trigger lock_approved, pois esta mudança de status
-- em registro aberto seria bloqueada por ele.
ALTER TABLE public.time_records DISABLE TRIGGER trg_lock_approved;

UPDATE public.time_records
SET status = 'pending'
WHERE clock_out IS NULL
  AND status = 'approved';

ALTER TABLE public.time_records ENABLE TRIGGER trg_lock_approved;
