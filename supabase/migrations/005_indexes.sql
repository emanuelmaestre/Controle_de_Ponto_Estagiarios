-- ============================================================
-- Migration 005 — Índices para performance
-- ============================================================

-- time_records: queries mais frequentes
CREATE INDEX idx_time_records_intern_id   ON public.time_records (intern_id);
CREATE INDEX idx_time_records_clock_in    ON public.time_records (clock_in DESC);
CREATE INDEX idx_time_records_status      ON public.time_records (status);
-- Nota: índice por clock_in::date removido pois timestamptz::date não é IMMUTABLE no PostgreSQL.
-- Os índices idx_time_records_intern_id e idx_time_records_clock_in já cobrem essas queries.

-- Índice para buscar turno aberto rapidamente
CREATE INDEX idx_time_records_open ON public.time_records (intern_id)
  WHERE clock_out IS NULL;

-- activities
CREATE INDEX idx_activities_record ON public.activities (time_record_id);

-- favorite_activities: ordenar por uso
CREATE INDEX idx_favorites_intern ON public.favorite_activities (intern_id, use_count DESC);

-- push_subscriptions
CREATE INDEX idx_push_user ON public.push_subscriptions (user_id);

-- notifications: buscar pendentes
CREATE INDEX idx_notif_user_sent ON public.notifications (user_id, is_sent);
