-- ============================================================
-- Migration 011 — Fechamento automático de registros abertos às 22h
-- ============================================================

-- Função que fecha todos os registros sem clock_out,
-- definindo saída às 22:00 do dia em que o clock_in ocorreu.
CREATE OR REPLACE FUNCTION public.auto_close_open_records()
RETURNS void AS $$
DECLARE
  cutoff_time TIMESTAMPTZ;
BEGIN
  -- Para cada registro aberto, o clock_out será às 22:00 BRT
  -- do mesmo dia do clock_in (ou agora se o clock_in foi hoje)
  UPDATE public.time_records
  SET
    clock_out = (
      (clock_in AT TIME ZONE 'America/Sao_Paulo')::date
      + TIME '22:00:00'
    ) AT TIME ZONE 'America/Sao_Paulo',
    notes = COALESCE(NULLIF(notes, ''), '') ||
            CASE WHEN notes IS NOT NULL AND notes <> ''
                 THEN ' | '
                 ELSE ''
            END ||
            '[Saída registrada automaticamente às 22h]'
  WHERE
    clock_out IS NULL
    -- Só fecha registros do dia atual ou anteriores (não futuros)
    AND clock_in < (
      (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')::date
      + TIME '22:00:00'
    ) AT TIME ZONE 'America/Sao_Paulo';

  RAISE LOG '[auto_close] % registro(s) fechado(s) automaticamente.', ROW_COUNT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove cron anterior de end-of-day se existir
SELECT cron.unschedule('cron-end-of-day') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cron-end-of-day'
);

-- Agenda: 01:00 UTC = 22:00 BRT (UTC-3)
SELECT cron.schedule(
  'cron-auto-close-records',
  '0 1 * * *',
  $$ SELECT public.auto_close_open_records(); $$
);
