import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML เพื่อป้องกัน XSS
 * อนุญาตเฉพาะ tags ที่ปลอดภัยสำหรับ content แสดงผล
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'h2', 'h3', 'p', 'br', 'strong', 'em', 's',
            'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'img'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class'],
    });
}
