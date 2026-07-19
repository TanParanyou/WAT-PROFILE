BEGIN;

ALTER TABLE events
  ALTER COLUMN start_time TYPE TIME USING start_time::TIME,
  ALTER COLUMN end_time TYPE TIME USING end_time::TIME;
ALTER TABLE event_schedules
  ALTER COLUMN start_time TYPE TIME USING start_time::TIME,
  ALTER COLUMN end_time TYPE TIME USING end_time::TIME;
ALTER TABLE schedules
  ALTER COLUMN time_start TYPE TIME USING time_start::TIME,
  ALTER COLUMN time_end TYPE TIME USING time_end::TIME;

COMMIT;
