import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventSchema, eventSchema } from './event.schema';

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
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
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
    registration_enabled: false,
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
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
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
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

test('eventSchema: allows optional location with empty string values', () => {
  const dataWithEmptyLocation = {
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    event_type: 'religious',
    location: { th: '', en: '', de: '' },
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
    is_active: true,
    registration_enabled: false
  };

  const result = eventSchema.safeParse(dataWithEmptyLocation);
  assert.equal(result.success, true);
});

test('eventSchema: allows a registration deadline before the event start', () => {
  const result = eventSchema.safeParse({
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    start_time: '09:00',
    event_type: 'religious',
    is_active: true,
    registration_enabled: true,
    registration_deadline: '2026-09-30',
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
  });

  assert.equal(result.success, true);
});

test('eventSchema: rejects a registration deadline on the event start date', () => {
  const result = eventSchema.safeParse({
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    start_time: '09:00',
    event_type: 'religious',
    is_active: true,
    registration_enabled: true,
    registration_deadline: '2026-10-01',
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues.find((issue) => issue.path.includes('registration_deadline'))?.message, 'Registration deadline must be on or before the event start.');
  }
});

test('eventSchema: allows an event without a registration deadline', () => {
  const result = eventSchema.safeParse({
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    event_type: 'religious',
    is_active: true,
    registration_enabled: true,
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
  });

  assert.equal(result.success, true);
});

test('createEventSchema: uses the localized registration deadline message', () => {
  const schema = createEventSchema((key) => key === 'registrationDeadlineAfterStart' ? 'localized deadline error' : key);
  const result = schema.safeParse({
    title: { th: 'งานสวดมนต์', en: 'Praying Event', de: 'Beten Event' },
    slug: 'praying-event',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    event_type: 'religious',
    is_active: true,
    registration_enabled: true,
    registration_deadline: '2026-10-01',
    location: {},
    dress_code: {},
    what_to_bring: {},
    transport_info: {},
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues.find((issue) => issue.path.includes('registration_deadline'))?.message, 'localized deadline error');
  }
});
