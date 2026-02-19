import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import ContactTemplate from '@/components/emails/ContactTemplate';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        // Simple validation
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const data = await resend.emails.send({
            from: 'onboarding@resend.dev', // ✅ ใช้ Email นี้ทดสอบได้เลย (ไม่ต้อง verify domain)
            to: ['paranyou791@gmail.com'], // ⚠️ เปลี่ยนเป็น Email ที่ใช้สมัคร Resend (paranyou791@gmail.com) เพื่อทดสอบ
            replyTo: email,
            subject: `[Contact Form] ${subject}`,
            react: <ContactTemplate name={name} email={email} subject={subject} message={message} />,
        });

        if (data.error) {
            console.error('Resend error:', data.error);
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Email sent successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

