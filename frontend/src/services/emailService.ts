interface SendEmailPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface SendEmailResponse {
    message?: string;
    error?: string;
}

/**
 * ส่งอีเมลติดต่อผ่าน API
 */
export async function sendContactEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
    const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Failed to send email');
    }

    return response.json();
}
