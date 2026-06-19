-- ============================================================
-- 014 · Backfill histórico de gamificação
-- Recalcula pontos, streaks e conquistas para todos os registros
-- existentes. Seguro para rodar múltiplas vezes (idempotente).
-- ============================================================

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
  v_total_pts      INTEGER;
  v_running_points INTEGER;
  v_total_interns  INTEGER := 0;
  v_total_points_awarded INTEGER := 0;
BEGIN
  -- Limpa histórico anterior para reprocessar limpo
  DELETE FROM points_history;
  DELETE FROM achievements;
  UPDATE profiles SET points = 0, level = 1, streak_days = 0, last_activity_date = NULL
  WHERE role = 'intern';

  FOR intern_rec IN
    SELECT id FROM profiles WHERE role = 'intern' AND is_active = TRUE
  LOOP
    prev_day         := NULL;
    v_streak         := 0;
    v_running_points := 0;
    v_total_interns  := v_total_interns + 1;

    -- Processa cada dia em que o estagiário teve sessão concluída (ordem cronológica)
    FOR day_rec IN
      SELECT
        DATE(clock_in AT TIME ZONE 'America/Sao_Paulo') AS work_day,
        MIN(clock_in AT TIME ZONE 'America/Sao_Paulo')  AS first_clock_in
      FROM time_records
      WHERE intern_id = intern_rec.id
        AND clock_out IS NOT NULL
      GROUP BY DATE(clock_in AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY work_day
    LOOP
      -- Calcula streak
      IF prev_day IS NOT NULL AND day_rec.work_day = prev_day + 1 THEN
        v_streak := v_streak + 1;
      ELSE
        v_streak := 1;
      END IF;
      prev_day := day_rec.work_day;

      -- Pontos base por comparecer
      v_base_pts := 10;

      -- Verifica pontualidade (dentro de 15min do horário previsto)
      SELECT EXISTS (
        SELECT 1 FROM intern_schedules sch
        WHERE sch.intern_id = intern_rec.id
          AND sch.day_of_week = EXTRACT(DOW FROM day_rec.work_day)::INTEGER
          AND sch.is_active = TRUE
          AND day_rec.first_clock_in::TIME <= (sch.expected_start::TIME + INTERVAL '15 minutes')
      ) INTO v_on_time;

      IF v_on_time THEN
        v_base_pts := v_base_pts + 5;
      END IF;

      -- Multiplicador de streak
      v_mult := CASE
        WHEN v_streak >= 30 THEN 2.0
        WHEN v_streak >= 7  THEN 1.5
        WHEN v_streak >= 3  THEN 1.2
        ELSE 1.0
      END;

      v_total_pts      := ROUND(v_base_pts * v_mult);
      v_running_points := v_running_points + v_total_pts;

      -- Registra no histórico
      INSERT INTO points_history (intern_id, points, reason, multiplier, created_at)
      VALUES (
        intern_rec.id,
        v_total_pts,
        CASE WHEN v_on_time THEN 'Presença pontual' ELSE 'Presença' END,
        v_mult,
        (day_rec.work_day + INTERVAL '12 hours') AT TIME ZONE 'America/Sao_Paulo'
      );

      -- Conquistas de streak
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

    END LOOP; -- fim days loop

    -- Conquista de pontualidade (>= 10 entradas pontuais)
    IF (SELECT COUNT(*) FROM points_history WHERE intern_id = intern_rec.id AND reason = 'Presença pontual') >= 10 THEN
      INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'punctual_10')
      ON CONFLICT (intern_id, type) DO NOTHING;
    END IF;

    -- Conquistas de meta mensal (verifica todos os meses com registro)
    INSERT INTO achievements (intern_id, type)
    SELECT DISTINCT intern_rec.id, 'month_complete'
    FROM (
      SELECT
        DATE_TRUNC('month', clock_in AT TIME ZONE 'America/Sao_Paulo') AS mes,
        SUM(duration_minutes) AS total_min
      FROM time_records
      WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL
      GROUP BY mes
    ) m
    JOIN profiles p ON p.id = intern_rec.id
    WHERE p.total_hours_required IS NOT NULL
      AND m.total_min >= p.total_hours_required * 60
    ON CONFLICT (intern_id, type) DO NOTHING;

    INSERT INTO achievements (intern_id, type)
    SELECT DISTINCT intern_rec.id, 'month_80'
    FROM (
      SELECT
        DATE_TRUNC('month', clock_in AT TIME ZONE 'America/Sao_Paulo') AS mes,
        SUM(duration_minutes) AS total_min
      FROM time_records
      WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL
      GROUP BY mes
    ) m
    JOIN profiles p ON p.id = intern_rec.id
    WHERE p.total_hours_required IS NOT NULL
      AND m.total_min >= p.total_hours_required * 60 * 0.8
    ON CONFLICT (intern_id, type) DO NOTHING;

    -- Atualiza perfil com pontos, nível e streak final
    UPDATE profiles SET
      points             = v_running_points,
      level              = level_from_points(v_running_points),
      streak_days        = v_streak,
      last_activity_date = prev_day
    WHERE id = intern_rec.id;

    v_total_points_awarded := v_total_points_awarded + v_running_points;

  END LOOP; -- fim interns loop

  RETURN jsonb_build_object(
    'interns_processed', v_total_interns,
    'total_points_awarded', v_total_points_awarded
  );
END;
$$;
