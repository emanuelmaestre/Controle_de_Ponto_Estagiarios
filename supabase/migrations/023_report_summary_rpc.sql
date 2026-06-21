CREATE OR REPLACE FUNCTION public.get_report_summary(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  course TEXT,
  nickname TEXT,
  total_minutes BIGINT,
  total_sessions BIGINT,
  approved_sessions BIGINT,
  pending_sessions BIGINT,
  rejected_sessions BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.course,
    p.nickname,
    COALESCE(SUM(COALESCE(tr.duration_minutes, 0)), 0)::BIGINT AS total_minutes,
    COUNT(tr.id)::BIGINT AS total_sessions,
    COUNT(*) FILTER (WHERE tr.status = 'approved')::BIGINT AS approved_sessions,
    COUNT(*) FILTER (WHERE tr.status = 'pending')::BIGINT AS pending_sessions,
    COUNT(*) FILTER (WHERE tr.status = 'rejected')::BIGINT AS rejected_sessions
  FROM public.profiles p
  LEFT JOIN public.time_records tr
    ON tr.intern_id = p.id
   AND tr.clock_in >= p_start_date
   AND tr.clock_in < p_end_date
  WHERE p.role = 'intern'
    AND p.is_active = TRUE
  GROUP BY p.id, p.full_name, p.email, p.course, p.nickname
  ORDER BY p.full_name;
$$;
