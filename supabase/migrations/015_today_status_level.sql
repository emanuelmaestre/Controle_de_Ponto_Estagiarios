-- Migration 015 — Adiciona points e level à view v_today_status
CREATE OR REPLACE VIEW public.v_today_status AS
SELECT
  p.id,
  p.full_name,
  p.photo_url,
  p.email,
  p.points,
  p.level,
  p.streak_days,
  tr.id           AS record_id,
  tr.clock_in,
  tr.clock_out,
  tr.status,
  CASE
    WHEN tr.clock_in IS NOT NULL AND tr.clock_out IS NULL THEN 'ativo'
    WHEN tr.clock_in IS NOT NULL AND tr.clock_out IS NOT NULL THEN 'saiu'
    ELSE 'ausente'
  END             AS today_status,
  COALESCE((
    SELECT SUM(duration_minutes)
    FROM public.time_records sub
    WHERE sub.intern_id = p.id
      AND sub.clock_in::date = CURRENT_DATE
      AND (sub.status = 'approved' OR sub.clock_out IS NULL)
  ), 0)           AS today_minutes,
  (
    SELECT COUNT(*)
    FROM public.time_records sub
    WHERE sub.intern_id = p.id
      AND sub.status = 'pending'
  )               AS pending_count
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT * FROM public.time_records
  WHERE intern_id = p.id
    AND clock_in::date = CURRENT_DATE
  ORDER BY clock_in DESC
  LIMIT 1
) tr ON true
WHERE p.role = 'intern'
  AND p.is_active = true;
