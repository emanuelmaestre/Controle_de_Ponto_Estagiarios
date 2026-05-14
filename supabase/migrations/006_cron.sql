-- ============================================================
-- Migration 006 — Jobs agendados com pg_cron
-- Executar APÓS configurar as Edge Functions no Supabase
-- ============================================================

-- Job: disparar Edge Function de lembretes a cada hora
SELECT cron.schedule(
  'cron-reminders',     -- nome único do job
  '0 * * * *',          -- toda hora em ponto
  $$
  SELECT net.http_post(
    url    := current_setting('app.edge_function_url') || '/cron-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
               current_setting('app.service_role_key') || '"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);

-- Job: verificar pendências sem clock_out ao fim do dia (23h)
SELECT cron.schedule(
  'cron-end-of-day',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url    := current_setting('app.edge_function_url') || '/cron-end-of-day',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
               current_setting('app.service_role_key') || '"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);
