-- ============================================================
-- 022 · Ajuste dos thresholds de nível
-- Novos pontos mínimos por nível (sistema com carga horária)
--   1 Novato       →    0 pts
--   2 Aprendiz     →  250 pts
--   3 Colaborador  →  600 pts
--   4 Dedicado     → 1200 pts
--   5 Especialista → 2500 pts
--   6 Elite        → 5000 pts
-- ============================================================

CREATE OR REPLACE FUNCTION level_from_points(p INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p >= 5000 THEN 6
    WHEN p >= 2500 THEN 5
    WHEN p >= 1200 THEN 4
    WHEN p >= 600  THEN 3
    WHEN p >= 250  THEN 2
    ELSE 1
  END
$$;
