const { fromZonedTime, formatInTimeZone } = require('date-fns-tz');

const d = fromZonedTime("2026-07-12T22:55:00", "Europe/Berlin");
console.log(d.toISOString());

const d2 = fromZonedTime("2026-07-12T00:00:00", "Europe/Berlin");
console.log(d2.toISOString());

console.log(formatInTimeZone(d2, "Europe/Berlin", "yyyy-MM-dd"));
