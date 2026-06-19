-- ============================================================
-- 018 · Pontuação por nome completo sem abreviações (+20 pts)
-- Conquista: full_name
-- ============================================================

-- Função auxiliar: retorna TRUE se o nome não tem palavras de 1 letra
-- (excluindo preposições comuns: de, da, do, dos, das, e, di)
CREATE OR REPLACE FUNCTION is_full_name_complete(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  words    TEXT[];
  word     TEXT;
  sig_count INTEGER := 0;
BEGIN
  IF p_name IS NULL OR TRIM(p_name) = '' THEN RETURN FALSE; END IF;

  words := regexp_split_to_array(LOWER(TRIM(p_name)), '\s+');

  FOREACH word IN ARRAY words LOOP
    -- Ignora preposições comuns em nomes
    CONTINUE WHEN word = ANY(ARRAY['de','da','do','dos','das','e','di','del','van','von']);
    sig_count := sig_count + 1;
    -- Qualquer palavra significativa de 1 letra = abreviação
    IF LENGTH(word) = 1 THEN RETURN FALSE; END IF;
  END LOOP;

  RETURN sig_count >= 2;
END;
$$;

-- Recria o backfill incluindo a nova regra de nome completo
CREATE OR REPLACE FUNCTION backfill_gamification()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intern_rec       RECORD;
  day_rec          RECORD;
  prev_day         DATE := NULL;
  v_streak         INTEGER := 0;
  v_mult           NUMERIC(3,1);
  v_base_pts       INTEGER;
  v_on_time        BOOLEAN;
  v_has_activity   BOOLEAN;
  v_total_pts      INTEGER;
  v_running_points INTEGER;
  v_total_interns  INTEGER := 0;
  v_total_points_awarded INTEGER := 0;
BEGIN
  TRUNCATE points_history;
  TRUNCATE achievements;
  UPDATE profiles SET points = 0, level = 1, streak_days = 0, last_activity_date = NULL
  WHERE role = 'intern';

  FOR intern_rec IN
    SELECT id, photo_url, full_name FROM profiles WHERE role = 'intern' AND is_active = TRUE
  LOOP
    prev_day         := NULL;
    v_streak         := 0;
    v_running_points := 0;
    v_total_interns  := v_total_interns + 1;

    -- +30 pts: foto de perfil (bônus único)
    IF intern_rec.photo_url IS NOT NULL AND intern_rec.photo_url <> '' THEN
      v_running_points := v_running_points + 30;
      INSERT INTO points_history (intern_id, points, reason, multiplier)
      VALUES (intern_rec.id, 30, 'Foto de perfil', 1.0);
      INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'has_photo')
      ON CONFLICT (intern_id, type) DO NOTHING;
    END IF;

    -- +20 pts: nome completo sem abreviações (bônus único)
    IF is_full_name_complete(intern_rec.full_name) THEN
      v_running_points := v_running_points + 20;
      INSERT INTO points_history (intern_id, points, reason, multiplier)
      VALUES (intern_rec.id, 20, 'Nome completo', 1.0);
      INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'full_name')
      ON CONFLICT (intern_id, type) DO NOTHING;
    END IF;

    FOR day_rec IN
      SELECT
        DATE(clock_in AT TIME ZONE 'America/Sao_Paulo') AS work_day,
        MIN(clock_in AT TIME ZONE 'America/Sao_Paulo')  AS first_clock_in,
        ARRAY_AGG(id)                                    AS record_ids
      FROM time_records
      WHERE intern_id = intern_rec.id
        AND clock_out IS NOT NULL
      GROUP BY DATE(clock_in AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY work_day
    LOOP
      IF prev_day IS NOT NULL AND day_rec.work_day = prev_day + 1 THEN
        v_streak := v_streak + 1;
      ELSE
        v_streak := 1;
      END IF;
      prev_day := day_rec.work_day;

      v_base_pts := 10;

      SELECT EXISTS (
        SELECT 1 FROM intern_schedules sch
        WHERE sch.intern_id = intern_rec.id
          AND sch.day_of_week = EXTRACT(DOW FROM day_rec.work_day)::INTEGER
          AND sch.is_active = TRUE
          AND day_rec.first_clock_in::TIME <= (sch.expected_start::TIME + INTERVAL '15 minutes')
      ) INTO v_on_time;
      IF v_on_time THEN v_base_pts := v_base_pts + 5; END IF;

      SELECT EXISTS (
        SELECT 1 FROM activities a
        WHERE a.time_record_id = ANY(day_rec.record_ids)
          AND LENGTH(TRIM(a.description)) >= 10
      ) INTO v_has_activity;
      IF v_has_activity THEN v_base_pts := v_base_pts + 5; END IF;

      v_mult := CASE
        WHEN v_streak >= 30 THEN 2.0
        WHEN v_streak >= 7  THEN 1.5
        WHEN v_streak >= 3  THEN 1.2
        ELSE 1.0
      END;

      v_total_pts      := ROUND(v_base_pts * v_mult);
      v_running_points := v_running_points + v_total_pts;

      INSERT INTO points_history (intern_id, points, reason, multiplier, created_at)
      VALUES (
        intern_rec.id, v_total_pts,
        CASE
          WHEN v_on_time AND v_has_activity THEN 'Presença pontual + atividade'
          WHEN v_on_time                    THEN 'Presença pontual'
          WHEN v_has_activity               THEN 'Presença + atividade'
          ELSE 'Presença'
        END,
        v_mult,
        (day_rec.work_day + INTERVAL '12 hours') AT TIME ZONE 'America/Sao_Paulo'
      );

      IF v_streak >= 1 THEN
        INSERT INTO achievements (intern_id, type, unlocked_at)
        VALUES (intern_rec.id, 'first_day', day_rec.work_day + INTERVAL '12 hours')
        ON CONFLICT (intern_id, type) DO NOTHING;
      END IF;
      IF v_streak >= 3 THEN
        INSERT INTO achievements (intern_id, type, unlocked_at)
        VALUES (intern_rec.id, 'streak_3', day_rec.work_day + INTERVAL '12 hours')
        ON CONFLICT (intern_id, type) DO NOTHING;
      END IF;
      IF v_streak >= 7 THEN
        INSERT INTO achievements (intern_id, type, unlocked_at)
        VALUES (intern_rec.id, 'streak_7', day_rec.work_day + INTERVAL '12 hours')
        ON CONFLICT (intern_id, type) DO NOTHING;
      END IF;
      IF v_streak >= 30 THEN
        INSERT INTO achievements (intern_id, type, unlocked_at)
        VALUES (intern_rec.id, 'streak_30', day_rec.work_day + INTERVAL '12 hours')
        ON CONFLICT (intern_id, type) DO NOTHING;
      END IF;

    END LOOP;

    IF (SELECT COUNT(*) FROM points_history WHERE intern_id = intern_rec.id AND reason LIKE '%pontual%') >= 10 THEN
      INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'punctual_10')
      ON CONFLICT (intern_id, type) DO NOTHING;
    END IF;

    DECLARE v_activity_sessions INTEGER;
    BEGIN
      SELECT COUNT(DISTINCT a.time_record_id)
      INTO v_activity_sessions
      FROM activities a
      JOIN time_records tr ON tr.id = a.time_record_id
      WHERE tr.intern_id = intern_rec.id
        AND LENGTH(TRIM(a.description)) >= 10;
      IF v_activity_sessions >= 5 THEN
        INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'reporter_5')
        ON CONFLICT (intern_id, type) DO NOTHING;
      END IF;
      IF v_activity_sessions >= 20 THEN
        INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'reporter_20')
        ON CONFLICT (intern_id, type) DO NOTHING;
      END IF;
    END;

    INSERT INTO achievements (intern_id, type)
    SELECT DISTINCT intern_rec.id, 'month_complete'
    FROM (
      SELECT DATE_TRUNC('month', clock_in AT TIME ZONE 'America/Sao_Paulo') AS mes,
             SUM(duration_minutes) AS total_min
      FROM time_records WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL
      GROUP BY mes
    ) m
    JOIN profiles p ON p.id = intern_rec.id
    WHERE p.total_hours_required IS NOT NULL
      AND m.total_min >= p.total_hours_required * 60
    ON CONFLICT (intern_id, type) DO NOTHING;

    INSERT INTO achievements (intern_id, type)
    SELECT DISTINCT intern_rec.id, 'month_80'
    FROM (
      SELECT DATE_TRUNC('month', clock_in AT TIME ZONE 'America/Sao_Paulo') AS mes,
             SUM(duration_minutes) AS total_min
      FROM time_records WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL
      GROUP BY mes
    ) m
    JOIN profiles p ON p.id = intern_rec.id
    WHERE p.total_hours_required IS NOT NULL
      AND m.total_min >= p.total_hours_required * 60 * 0.8
    ON CONFLICT (intern_id, type) DO NOTHING;

    UPDATE profiles SET
      points             = v_running_points,
      level              = level_from_points(v_running_points),
      streak_days        = v_streak,
      last_activity_date = prev_day
    WHERE id = intern_rec.id;

    v_total_points_awarded := v_total_points_awarded + v_running_points;

  END LOOP;

  RETURN jsonb_build_object(
    'interns_processed', v_total_interns,
    'total_points_awarded', v_total_points_awarded
  );
END;
$$;
