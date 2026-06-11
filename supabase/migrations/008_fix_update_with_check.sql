-- ============================================================
-- Migration 008 — Corrige WITH CHECK das policies de UPDATE
-- Problema: a policy de UPDATE sem WITH CHECK reaproveita o USING,
-- que exige clock_out IS NULL. Como o clock-out PREENCHE o clock_out,
-- a linha nova viola a checagem e o update é rejeitado pela RLS.
-- Solução: USING valida a linha ANTIGA (registro aberto do usuário);
-- WITH CHECK valida a linha NOVA (apenas precisa pertencer ao usuário).
-- ============================================================

DROP POLICY IF EXISTS "records_update" ON public.time_records;
CREATE POLICY "records_update" ON public.time_records
  FOR UPDATE
  USING (
    (intern_id = auth.uid() AND clock_out IS NULL) OR public.is_manager()
  )
  WITH CHECK (
    intern_id = auth.uid() OR public.is_manager()
  );

DROP POLICY IF EXISTS "activities_update" ON public.activities;
CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id AND tr.intern_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id AND tr.intern_id = auth.uid()
    )
  );
