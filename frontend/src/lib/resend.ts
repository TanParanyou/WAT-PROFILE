import { Resend } from 'resend';

// ใช้ placeholder key ตอน build เพื่อไม่ให้ Resend constructor crash
// Email จะส่งได้จริงก็ต่อเมื่อตั้ง RESEND_API_KEY ใน .env
export const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
