-- 019_fix_achievements_backfill.sql
-- Corrige conquistas faltando para todos os estagiários com base nos dados atuais
-- Execute no Supabase SQL Editor

-- ── 1. full_name: nome completo sem abreviações ─────────────────────────────
-- A função is_full_name_complete() foi criada na migration 018
INSERT INTO achievements (intern_id, type, unlocked_at)
SELECT
  p.id,
  'full_name',
  COALESCE(p.updated_at, p.created_at, now())
FROM profiles p
WHERE
  p.role = 'intern'
  AND p.is_active = true
  AND p.full_name IS NOT NULL
  AND is_full_name_complete(p.full_name)
  AND NOT EXISTS (
    SELECT 1 FROM achievements a
    WHERE a.intern_id = p.id AND a.type = 'full_name'
  )
ON CONFLICT DO NOTHING;

-- ── 2. has_photo: foto de perfil cadastrada ────────────────────────────────
INSERT INTO achievements (intern_id, type, unlocked_at)
SELECT
  p.id,
  'has_photo',
  COALESCE(p.updated_at, p.created_at, now())
FROM profiles p
WHERE
  p.role = 'intern'
  AND p.is_active = true
  AND p.photo_url IS NOT NULL
  AND p.photo_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM achievements a
    WHERE a.intern_id = p.id AND a.type = 'has_photo'
  )
ON CONFLICT DO NOTHING;

-- ── 3. first_day: primeiro registro de ponto ───────────────────────────────
INSERT INTO achievements (intern_id, type, unlocked_at)
SELECT DISTINCT ON (tr.intern_id)
  tr.intern_id,
  'first_day',
  tr.clock_in
FROM time_records tr
JOIN profiles p ON p.id = tr.intern_id AND p.role = 'intern' AND p.is_active = true
WHERE tr.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM achievements a
    WHERE a.intern_id = tr.intern_id AND a.type = 'first_day'
  )
ORDER BY tr.intern_id, tr.clock_in ASC
ON CONFLICT DO NOTHING;

-- ── 4. streak_3: 3 dias consecutivos ─────────────────────────────────────
-- Verifica se streak_days atual é >= 3
INSERT INTO achievements (intern_id, type, unlocked_at)
SELECT
  p.id,
  'streak_3',
  now()
FROM profiles p
WHERE
  p.role = 'intern'
  AND p.is_active = true
  AND (p.streak_days >= 3 OR EXISTS (
    SELECT 1 FROM achievements a2
    WHERE a2.intern_id = p.id AND a2.type = 'streak_7'
  ))
  AND NOT EXISTS (
    SELECT 1 FROM achievements a
    WHERE a.intern_id = p.id AND a.type = 'streak_3'
  )
ON CONFLICT DO NOTHING;

-- ── 5. streak_7: 7 dias consecutivos ─────────────────────────────────────
INSERT INTO achievements (intern_id, type, unlocked_at)
SELECT
  p.id,
  'streak_7',
  now()
FROM profiles p
WHERE
  p.role = 'intern'
  AND p.is_active = true
  AND (p.streak_days >= 7 OR EXISTS (
    SELECT 1 FROM achievements a2
    WHERE a2.intern_id = p.id AND a2.type = 'streak_30'
  ))
  AND NOT EXISTS (
    SELECT 1 FROM achievements a
    WHERE a.intern_id = p.id AND a.type = 'streak_7'
  )
ON CONFLICT DO NOTHING;

-- ── 6. Adicionar pontos faltando por full_name ────────────────────────────
-- Para cada achievement full_name novo, adiciona 20 pts ao perfil
UPDATE profiles p
SET points = COALESCE(p.points, 0) + 20
WHERE p.id IN (
  SELECT a.intern_id
  FROM achievements a
  WHERE a.type = 'full_name'
    AND a.unlocked_at >= NOW() - INTERVAL '1 minute'
);

-- ── Verificação final ──────────────────────────────────────────────────────
SELECT
  p.full_name,
  p.points,
  p.level,
  COUNT(a.type) AS total_achievements,
  STRING_AGG(a.type, ', ' ORDER BY a.unlocked_at) AS achievements
FROM profiles p
LEFT JOIN achievements a ON a.intern_id = p.id
WHERE p.role = 'intern' AND p.is_active = true
GROUP BY p.id, p.full_name, p.points, p.level
ORDER BY p.full_name;
