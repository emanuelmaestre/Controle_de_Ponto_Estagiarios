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
