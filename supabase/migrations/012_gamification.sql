-- ============================================================
-- 012 · Gamification: points, levels, streaks, achievements
-- ============================================================

-- 1. Add gamification columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS points          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level           INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak_days     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 2. Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (intern_id, type)
);

-- 3. Points history table
CREATE TABLE IF NOT EXISTS points_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points      INTEGER     NOT NULL,
  reason      TEXT        NOT NULL,
  multiplier  NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS
ALTER TABLE achievements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Interns can read their own data
CREATE POLICY "intern_read_own_achievements" ON achievements
  FOR SELECT USING (intern_id = auth.uid());

CREATE POLICY "intern_read_own_history" ON points_history
  FOR SELECT USING (intern_id = auth.uid());

-- Managers can read all
CREATE POLICY "manager_read_achievements" ON achievements
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'
  ));

CREATE POLICY "manager_read_history" ON points_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'
  ));

-- Service role full access (for pg_cron function)
CREATE POLICY "service_all_achievements" ON achievements
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_all_history" ON points_history
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Helper: compute level from points
CREATE OR REPLACE FUNCTION level_from_points(p INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p >= 4000 THEN 6
    WHEN p >= 2000 THEN 5
    WHEN p >= 1000 THEN 4
    WHEN p >= 500  THEN 3
    WHEN p >= 200  THEN 2
    ELSE 1
  END;
$$;

-- 6. Main daily gamification function
CREATE OR REPLACE FUNCTION calculate_daily_gamification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yesterday        DATE := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE - 1;
  v_month_start      DATE := DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  rec                RECORD;
  v_had_session      BOOLEAN;
  v_on_time          BOOLEAN;
  v_base_pts         INTEGER;
  v_mult             NUMERIC(3,1);
  v_total_pts        INTEGER;
  v_new_streak       INTEGER;
  v_new_points       INTEGER;
BEGIN
  FOR rec IN
    SELECT id, streak_days, last_activity_date, points
    FROM profiles
    WHERE role = 'intern' AND is_active = TRUE
  LOOP
    -- Did the intern have a completed session yesterday?
    SELECT EXISTS (
      SELECT 1 FROM time_records
      WHERE intern_id = rec.id
        AND (clock_in AT TIME ZONE 'America/Sao_Paulo')::DATE = v_yesterday
        AND clock_out IS NOT NULL
    ) INTO v_had_session;

    IF NOT v_had_session THEN
      -- Break streak if they had a scheduled day and missed it
      IF EXISTS (
        SELECT 1 FROM intern_schedules
        WHERE intern_id = rec.id
          AND day_of_week = EXTRACT(DOW FROM v_yesterday)::INTEGER
          AND is_active = TRUE
      ) AND rec.last_activity_date IS NOT NULL AND rec.last_activity_date < v_yesterday - 1 THEN
        UPDATE profiles SET streak_days = 0 WHERE id = rec.id;
      END IF;
      CONTINUE;
    END IF;

    -- Base points: 10 for showing up
    v_base_pts := 10;

    -- Punctuality check: clocked in within 15 min of expected start
    SELECT EXISTS (
      SELECT 1
      FROM time_records tr
      JOIN intern_schedules sch
        ON sch.intern_id = tr.intern_id
       AND sch.day_of_week = EXTRACT(DOW FROM v_yesterday)::INTEGER
       AND sch.is_active = TRUE
      WHERE tr.intern_id = rec.id
        AND (tr.clock_in AT TIME ZONE 'America/Sao_Paulo')::DATE = v_yesterday
        AND (tr.clock_in AT TIME ZONE 'America/Sao_Paulo')::TIME
            <= (sch.expected_start::TIME + INTERVAL '15 minutes')
    ) INTO v_on_time;

    IF v_on_time THEN
      v_base_pts := v_base_pts + 5;
    END IF;

    -- Update streak
    IF rec.last_activity_date = v_yesterday - 1 THEN
      v_new_streak := rec.streak_days + 1;
    ELSE
      v_new_streak := 1;
    END IF;

    -- Multiplier
    v_mult := CASE
      WHEN v_new_streak >= 30 THEN 2.0
      WHEN v_new_streak >= 7  THEN 1.5
      WHEN v_new_streak >= 3  THEN 1.2
      ELSE 1.0
    END;

    v_total_pts  := ROUND(v_base_pts * v_mult);
    v_new_points := rec.points + v_total_pts;

    -- Update profile
    UPDATE profiles SET
      points            = v_new_points,
      level             = level_from_points(v_new_points),
      streak_days       = v_new_streak,
      last_activity_date = v_yesterday
    WHERE id = rec.id;

    -- Log to history
    INSERT INTO points_history (intern_id, points, reason, multiplier)
    VALUES (
      rec.id,
      v_total_pts,
      CASE WHEN v_on_time THEN 'Presença pontual' ELSE 'Presença' END,
      v_mult
    );

    -- ── Unlock achievements ──────────────────────────────────

    -- First day ever
    INSERT INTO achievements (intern_id, type)
    VALUES (rec.id, 'first_day')
    ON CONFLICT (intern_id, type) DO NOTHING;

    -- Streak badges
    IF v_new_streak >= 3 THEN
      INSERT INTO achievements (intern_id, type) VALUES (rec.id, 'streak_3')
      ON CONFLICT DO NOTHING;
    END IF;
    IF v_new_streak >= 7 THEN
      INSERT INTO achievements (intern_id, type) VALUES (rec.id, 'streak_7')
      ON CONFLICT DO NOTHING;
    END IF;
    IF v_new_streak >= 30 THEN
      INSERT INTO achievements (intern_id, type) VALUES (rec.id, 'streak_30')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Punctuality badge (10 punctual check-ins)
    IF (
      SELECT COUNT(*) FROM points_history
      WHERE intern_id = rec.id AND reason = 'Presença pontual'
    ) >= 10 THEN
      INSERT INTO achievements (intern_id, type) VALUES (rec.id, 'punctual_10')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Monthly hours badges (check for current month)
    DECLARE
      v_month_minutes  INTEGER;
      v_hours_required INTEGER;
    BEGIN
      SELECT COALESCE(SUM(duration_minutes), 0)
      INTO v_month_minutes
      FROM time_records
      WHERE intern_id = rec.id
        AND clock_out IS NOT NULL
        AND (clock_in AT TIME ZONE 'America/Sao_Paulo')::DATE >= v_month_start;

      SELECT COALESCE(total_hours_required, 0) * 60
      INTO v_hours_required
      FROM profiles WHERE id = rec.id;

      IF v_hours_required > 0 THEN
        IF v_month_minutes >= v_hours_required THEN
          INSERT INTO achievements (intern_id, type) VALUES (rec.id, 'month_complete')
          ON CONFLICT DO NOTHING;
        ELSIF v_month_minutes >= (v_hours_required * 0.8)::INTEGER THEN
          INSERT INTO achievements (intern_id, type) VALUES (rec.id, 'month_80')
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END;

  END LOOP;
END;
$$;

-- 7. Schedule: daily at 02:00 UTC = 23:00 BRT
SELECT cron.schedule(
  'gamification-daily',
  '0 2 * * *',
  'SELECT calculate_daily_gamification()'
);
