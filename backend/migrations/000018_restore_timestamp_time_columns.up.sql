BEGIN;

ALTER TABLE events
  ALTER COLUMN start_time TYPE TIMESTAMPTZ
    USING CASE
      WHEN start_time IS NULL THEN NULL
      ELSE (start_date::DATE + start_time) AT TIME ZONE 'Europe/Berlin'
    END,
  ALTER COLUMN end_time TYPE TIMESTAMPTZ
    USING CASE
      WHEN end_time IS NULL THEN NULL
      ELSE (end_date::DATE + end_time) AT TIME ZONE 'Europe/Berlin'
    END;

ALTER TABLE event_schedules
  ALTER COLUMN start_time TYPE TIMESTAMPTZ
    USING CASE
      WHEN start_time IS NULL THEN NULL
      ELSE (TIMESTAMP '2000-01-01 00:00:00' + start_time) AT TIME ZONE 'Europe/Berlin'
    END,
  ALTER COLUMN end_time TYPE TIMESTAMPTZ
    USING CASE
      WHEN end_time IS NULL THEN NULL
      ELSE (TIMESTAMP '2000-01-01 00:00:00' + end_time) AT TIME ZONE 'Europe/Berlin'
    END;

ALTER TABLE schedules
  ALTER COLUMN time_start TYPE TIMESTAMPTZ
    USING CASE
      WHEN time_start IS NULL THEN NULL
      ELSE (TIMESTAMP '2000-01-01 00:00:00' + time_start) AT TIME ZONE 'Europe/Berlin'
    END,
  ALTER COLUMN time_end TYPE TIMESTAMPTZ
    USING CASE
      WHEN time_end IS NULL THEN NULL
      ELSE (TIMESTAMP '2000-01-01 00:00:00' + time_end) AT TIME ZONE 'Europe/Berlin'
    END;

COMMIT;
