ALTER TABLE event_schedules RENAME COLUMN time TO start_time;
ALTER TABLE event_schedules ADD COLUMN end_time TIME;

UPDATE event_schedules SET end_time = start_time WHERE end_time IS NULL;

ALTER TABLE event_schedules ALTER COLUMN end_time SET NOT NULL;
