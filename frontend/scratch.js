const axios = require('axios');

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: "admin@watloungporsai.de",
      password: "changeme123"
    });
    const token = loginRes.data.data.access_token;
    
    const res = await axios.post('http://localhost:3000/api/v1/admin/events', {
      title: { th: "test", en: "test", de: "test" },
      description: { th: "", en: "", de: "" },
      slug: "test-event-" + Date.now(),
      event_date: "2026-07-12T20:55:00.000Z",
      start_time: "2026-07-12T20:55:00.000Z",
      end_time: "2026-07-12T20:55:00.000Z",
      event_type: "ceremony",
      location: { th: "", en: "", de: "" },
      is_active: true,
      registration_enabled: false,
      schedule: [{
        time: "2026-07-12T20:55:00.000Z",
        activity: { th: "111", en: "", de: "" }
      }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}

run();
