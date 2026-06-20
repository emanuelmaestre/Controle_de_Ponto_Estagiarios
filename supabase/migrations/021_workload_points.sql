-- ============================================================
-- 021 · Pontuação por carga horária
-- Bloco 1: Marcos de progresso total (únicos)
-- Bloco 2: Consistência mensal
-- Bloco 3: Sessão completa no dia (+3 pts)
-- ============================================================

CREATE OR REPLACE FUNCTION backfill_gamification()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intern_rec             RECORD;
  day_rec                RECORD;
  month_rec              RECORD;
  prev_day               DATE    := NULL;
  v_streak               INTEGER := 0;
  v_mult                 NUMERIC(3,1);
  v_base_pts             INTEGER;
  v_on_time              BOOLEAN;
  v_has_activity         BOOLEAN;
  v_session_complete     BOOLEAN;
  v_total_pts            INTEGER;
  v_running_points       INTEGER;
  v_total_interns        INTEGER := 0;
  v_total_points_awarded INTEGER := 0;
  -- carga horária
  v_total_required_min   INTEGER;
  v_total_worked_min     INTEGER;
  v_internship_months    NUMERIC;
  v_monthly_expected_min NUMERIC;
  v_month_worked_min     INTEGER;
  v_month_pct            NUMERIC;
  v_month_bonus          INTEGER;
  v_workload_pct         NUMERIC;
BEGIN
  TRUNCATE points_history;
  TRUNCATE achievements;
  UPDATE profiles SET points = 0, level = 1, streak_days = 0, last_activity_date = NULL
  WHERE role = 'intern';

  FOR intern_rec IN
    SELECT id, photo_url, full_name, total_hours_required,
           internship_start, internship_end
    FROM profiles WHERE role = 'intern' AND is_active = TRUE
  LOOP
    prev_day             := NULL;
    v_streak             := 0;
    v_running_points     := 0;
    v_total_interns      := v_total_interns + 1;
    v_total_required_min := COALESCE(intern_rec.total_hours_required, 0) * 60;

    -- Meses totais do estágio (mínimo 1)
    v_internship_months := GREATEST(1, COALESCE(
      EXTRACT(YEAR FROM AGE(
        COALESCE(intern_rec.internship_end, CURRENT_DATE),
        COALESCE(intern_rec.internship_start, CURRENT_DATE)
      )) * 12 +
      EXTRACT(MONTH FROM AGE(
        COALESCE(intern_rec.internship_end, CURRENT_DATE),
        COALESCE(intern_rec.internship_start, CURRENT_DATE)
      )),
      1
    ));

    -- Horas esperadas por mês (em minutos)
    v_monthly_expected_min := CASE
      WHEN v_total_required_min > 0 THEN v_total_required_min::NUMERIC / v_internship_months
      ELSE 0
    END;

    -- ── Bônus cadastral ──────────────────────────────────────
    IF intern_rec.photo_url IS NOT NULL AND intern_rec.photo_url <> '' THEN
      v_running_points := v_running_points + 30;
      INSERT INTO points_history (intern_id, points, reason, multiplier)
      VALUES (intern_rec.id, 30, 'Foto de perfil', 1.0);
      INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'has_photo')
      ON CONFLICT (intern_id, type) DO NOTHING;
    END IF;

    IF is_full_name_complete(intern_rec.full_name) THEN
      v_running_points := v_running_points + 20;
      INSERT INTO points_history (intern_id, points, reason, multiplier)
      VALUES (intern_rec.id, 20, 'Nome completo', 1.0);
      INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'full_name')
      ON CONFLICT (intern_id, type) DO NOTHING;
    END IF;

    -- ── Loop diário ──────────────────────────────────────────
    FOR day_rec IN
      SELECT
        DATE(clock_in AT TIME ZONE 'America/Sao_Paulo')                   AS work_day,
        MIN(clock_in AT TIME ZONE 'America/Sao_Paulo')                    AS first_clock_in,
        MAX(clock_out AT TIME ZONE 'America/Sao_Paulo')                   AS last_clock_out,
        SUM(duration_minutes)                                              AS day_minutes,
        ARRAY_AGG(id)                                                      AS record_ids
      FROM time_records
      WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL
      GROUP BY DATE(clock_in AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY work_day
    LOOP
      -- Streak
      IF prev_day IS NOT NULL AND day_rec.work_day = prev_day + 1 THEN
        v_streak := v_streak + 1;
      ELSE
        v_streak := 1;
      END IF;
      prev_day := day_rec.work_day;

      v_base_pts := 10;

      -- Pontualidade
      SELECT EXISTS (
        SELECT 1 FROM intern_schedules sch
        WHERE sch.intern_id = intern_rec.id
          AND sch.day_of_week = EXTRACT(DOW FROM day_rec.work_day)::INTEGER
          AND sch.is_active = TRUE
          AND day_rec.first_clock_in::TIME <= (sch.expected_start::TIME + INTERVAL '15 minutes')
      ) INTO v_on_time;
      IF v_on_time THEN v_base_pts := v_base_pts + 5; END IF;

      -- Atividade registrada
      SELECT EXISTS (
        SELECT 1 FROM activities a
        WHERE a.time_record_id = ANY(day_rec.record_ids)
          AND LENGTH(TRIM(a.description)) >= 10
      ) INTO v_has_activity;
      IF v_has_activity THEN v_base_pts := v_base_pts + 5; END IF;

      -- Bloco 3: Sessão completa (+3 pts)
      -- Cumpriu as horas agendadas do dia (com tolerância de 10 min para menos)
      SELECT EXISTS (
        SELECT 1 FROM intern_schedules sch
        WHERE sch.intern_id = intern_rec.id
          AND sch.day_of_week = EXTRACT(DOW FROM day_rec.work_day)::INTEGER
          AND sch.is_active = TRUE
          AND day_rec.day_minutes >=
              EXTRACT(EPOCH FROM (sch.expected_end::TIME - sch.expected_start::TIME)) / 60 - 10
      ) INTO v_session_complete;
      IF v_session_complete THEN v_base_pts := v_base_pts + 3; END IF;

      -- Multiplicador streak
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
          WHEN v_on_time AND v_has_activity AND v_session_complete THEN 'Presença pontual + atividade + sessão completa'
          WHEN v_on_time AND v_has_activity                        THEN 'Presença pontual + atividade'
          WHEN v_on_time AND v_session_complete                    THEN 'Presença pontual + sessão completa'
          WHEN v_has_activity AND v_session_complete               THEN 'Presença + atividade + sessão completa'
          WHEN v_on_time                                           THEN 'Presença pontual'
          WHEN v_has_activity                                      THEN 'Presença + atividade'
          WHEN v_session_complete                                  THEN 'Presença + sessão completa'
          ELSE 'Presença'
        END,
        v_mult,
        (day_rec.work_day + INTERVAL '12 hours') AT TIME ZONE 'America/Sao_Paulo'
      );

      -- Achievements de streak
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

    END LOOP; -- fim loop diário

    -- ── Achievements de atividades ───────────────────────────
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

    -- ── Bloco 1: Marcos de progresso total ──────────────────
    IF v_total_required_min > 0 THEN
      SELECT COALESCE(SUM(duration_minutes), 0)
      INTO v_total_worked_min
      FROM time_records
      WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL;

      v_workload_pct := v_total_worked_min::NUMERIC / v_total_required_min * 100;

      IF v_workload_pct >= 25 THEN
        IF NOT EXISTS (SELECT 1 FROM achievements WHERE intern_id = intern_rec.id AND type = 'workload_25') THEN
          INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'workload_25')
          ON CONFLICT (intern_id, type) DO NOTHING;
          v_running_points := v_running_points + 50;
          INSERT INTO points_history (intern_id, points, reason, multiplier)
          VALUES (intern_rec.id, 50, '25% da carga horária cumprida', 1.0);
        END IF;
      END IF;

      IF v_workload_pct >= 50 THEN
        IF NOT EXISTS (SELECT 1 FROM achievements WHERE intern_id = intern_rec.id AND type = 'workload_50') THEN
          INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'workload_50')
          ON CONFLICT (intern_id, type) DO NOTHING;
          v_running_points := v_running_points + 100;
          INSERT INTO points_history (intern_id, points, reason, multiplier)
          VALUES (intern_rec.id, 100, '50% da carga horária cumprida', 1.0);
        END IF;
      END IF;

      IF v_workload_pct >= 75 THEN
        IF NOT EXISTS (SELECT 1 FROM achievements WHERE intern_id = intern_rec.id AND type = 'workload_75') THEN
          INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'workload_75')
          ON CONFLICT (intern_id, type) DO NOTHING;
          v_running_points := v_running_points + 150;
          INSERT INTO points_history (intern_id, points, reason, multiplier)
          VALUES (intern_rec.id, 150, '75% da carga horária cumprida', 1.0);
        END IF;
      END IF;

      IF v_workload_pct >= 100 THEN
        IF NOT EXISTS (SELECT 1 FROM achievements WHERE intern_id = intern_rec.id AND type = 'workload_100') THEN
          INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'workload_100')
          ON CONFLICT (intern_id, type) DO NOTHING;
          v_running_points := v_running_points + 250;
          INSERT INTO points_history (intern_id, points, reason, multiplier)
          VALUES (intern_rec.id, 250, '100% da carga horária concluída', 1.0);
        END IF;
      END IF;
    END IF;

    -- ── Bloco 2: Consistência mensal ────────────────────────
    IF v_monthly_expected_min > 0 THEN
      FOR month_rec IN
        SELECT
          DATE_TRUNC('month', clock_in AT TIME ZONE 'America/Sao_Paulo') AS mes,
          SUM(duration_minutes) AS total_min
        FROM time_records
        WHERE intern_id = intern_rec.id AND clock_out IS NOT NULL
        GROUP BY DATE_TRUNC('month', clock_in AT TIME ZONE 'America/Sao_Paulo')
        ORDER BY mes
      LOOP
        v_month_worked_min := month_rec.total_min;
        v_month_pct        := v_month_worked_min::NUMERIC / v_monthly_expected_min * 100;

        -- Apenas o nível mais alto do mês
        IF v_month_pct >= 110 THEN
          v_month_bonus := 80;
        ELSIF v_month_pct >= 100 THEN
          v_month_bonus := 60;
        ELSIF v_month_pct >= 80 THEN
          v_month_bonus := 40;
        ELSIF v_month_pct >= 60 THEN
          v_month_bonus := 20;
        ELSE
          v_month_bonus := 0;
        END IF;

        IF v_month_bonus > 0 THEN
          v_running_points := v_running_points + v_month_bonus;
          INSERT INTO points_history (intern_id, points, reason, multiplier, created_at)
          VALUES (
            intern_rec.id,
            v_month_bonus,
            CASE
              WHEN v_month_pct >= 110 THEN 'Dedicação extra no mês (' || ROUND(v_month_pct) || '%)'
              WHEN v_month_pct >= 100 THEN 'Carga mensal 100% cumprida'
              WHEN v_month_pct >= 80  THEN 'Carga mensal 80% cumprida'
              ELSE                         'Carga mensal 60% cumprida'
            END,
            1.0,
            month_rec.mes + INTERVAL '23 hours'
          );
        END IF;

        -- Achievements mensais existentes (badges, sem pontos extras aqui)
        IF v_month_pct >= 100 THEN
          INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'month_complete')
          ON CONFLICT (intern_id, type) DO NOTHING;
        END IF;
        IF v_month_pct >= 80 THEN
          INSERT INTO achievements (intern_id, type) VALUES (intern_rec.id, 'month_80')
          ON CONFLICT (intern_id, type) DO NOTHING;
        END IF;

      END LOOP;
    END IF;

    -- ── Atualiza perfil ──────────────────────────────────────
    UPDATE profiles SET
      points             = v_running_points,
      level              = level_from_points(v_running_points),
      streak_days        = v_streak,
      last_activity_date = prev_day
    WHERE id = intern_rec.id;

    v_total_points_awarded := v_total_points_awarded + v_running_points;

  END LOOP;

  RETURN jsonb_build_object(
    'interns_processed',   v_total_interns,
    'total_points_awarded', v_total_points_awarded
  );
END;
$$;
