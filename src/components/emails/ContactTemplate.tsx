import * as React from 'react';

interface ContactTemplateProps {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export const ContactTemplate: React.FC<ContactTemplateProps> = ({
    name,
    email,
    subject,
    message,
}) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#1a1a1a' }}>
        <h2 style={{ color: '#d97706', borderBottom: '2px solid #d97706', paddingBottom: '10px' }}>
            New Contact Form Submission
        </h2>
        <div style={{ marginTop: '20px' }}>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Subject:</strong> {subject}</p>
        </div>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '10px' }}>Message:</p>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message}</p>
        </div>
        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eaeaea' }} />
        <p style={{ fontSize: '12px', color: '#888' }}>
            This email was sent from the Wat Loung Por Sai website contact form.
        </p>
    </div>
);

export default ContactTemplate;
