-- ============================================================
-- Migration 009 — Permite múltiplos horários por dia
-- Remove a constraint UNIQUE(intern_id, day_of_week) que limitava
-- cada estagiário a um único turno por dia da semana.
-- ============================================================

-- Remove qualquer UNIQUE constraint em intern_schedules (nome pode variar)
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.intern_schedules'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.intern_schedules DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

-- Remove também eventual índice único equivalente
DO $$
DECLARE i text;
BEGIN
  FOR i IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'intern_schedules'
      AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%day_of_week%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', i);
  END LOOP;
END $$;

-- Garante que o gestor possa deletar horários (necessário para o save delete+insert)
DROP POLICY IF EXISTS "schedules_delete_manager" ON public.intern_schedules;
CREATE POLICY "schedules_delete_manager" ON public.intern_schedules
  FOR DELETE USING (public.is_manager());
