import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventSchema } from './event.schema';

test('eventSchema: validates correctly with valid dates and times', () => {
  const validData = {
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    start_time: '09:00',
    end_time: '12:00',
    event_type: 'religious',
    is_active: true,
    registration_enabled: false,
    schedule: [
      {
        start_time: '09:00',
        end_time: '10:00',
        activity: { th: 'สวดมนต์เช้า', en: 'Morning Pray', de: 'Morgengebet' }
      }
    ]
  };

  const result = eventSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test('eventSchema: fails when end_date is before start_date', () => {
  const invalidData = {
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-02',
    end_date: '2026-10-01', // Error: end_date is before start_date
    event_type: 'religious',
    is_active: true,
    registration_enabled: false
  };

  const result = eventSchema.safeParse(invalidData);
  assert.equal(result.success, false);
  
  if (!result.success) {
    const errorMsg = result.error.issues.find(i => i.path.includes('end_date'))?.message;
    assert.equal(errorMsg, 'End date must be on or after start date');
  }
});

test('eventSchema: fails when schedule end_time is before start_time', () => {
  const invalidScheduleData = {
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-01',
    event_type: 'religious',
    is_active: true,
    registration_enabled: false,
    schedule: [
      {
        start_time: '10:00',
        end_time: '09:00', // Error: end_time before start_time
        activity: { th: 'กิจกรรม 1', en: 'Activity 1', de: 'Aktivität 1' }
      }
    ]
  };

  const result = eventSchema.safeParse(invalidScheduleData);
  assert.equal(result.success, false);
  
  if (!result.success) {
    const errorMsg = result.error.issues[0]?.message;
    assert.equal(errorMsg, 'End time must be after start time');
  }
});
