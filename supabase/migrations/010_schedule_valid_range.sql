-- ============================================================
-- Migration 010 — Validação de turnos no backend
-- Garante, no nível do banco, que a saída é sempre depois da
-- entrada (sem suporte a virada de meia-noite). Reforça a mesma
-- regra do frontend (lib/schedule.ts).
-- ============================================================

-- Limpa eventuais turnos invalidos preexistentes (saida <= entrada)
DELETE FROM public.intern_schedules
WHERE expected_end <= expected_start;

-- Adiciona a constraint apenas se ainda nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_schedule_end_after_start'
  ) THEN
    ALTER TABLE public.intern_schedules
      ADD CONSTRAINT chk_schedule_end_after_start
      CHECK (expected_end > expected_start);
  END IF;
END $$;
