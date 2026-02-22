import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import ContactTemplate from "@/components/emails/ContactTemplate";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // ตรวจสอบ required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ตรวจสอบ email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // ตรวจสอบความยาว message
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 },
      );
    }

    // ใช้ env แทน hard-coded email
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const toEmail = process.env.CONTACT_EMAIL;

    if (!toEmail || !process.env.RESEND_API_KEY) {
      console.error(
        "Email environment variables are not configured (CONTACT_EMAIL / RESEND_API_KEY)",
      );
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 },
      );
    }

    const emailTemplate = (
      <ContactTemplate
        name={name}
        email={email}
        subject={subject}
        message={message}
      />
    );

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      react: emailTemplate,
    });

    if (data.error) {
      console.error("Resend error:", data.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
