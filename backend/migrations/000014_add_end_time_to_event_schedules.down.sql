ALTER TABLE event_schedules DROP COLUMN IF EXISTS end_time;
ALTER TABLE event_schedules RENAME COLUMN start_time TO time;
