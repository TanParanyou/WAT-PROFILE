import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML เพื่อป้องกัน XSS
 * อนุญาตเฉพาะ tags ที่ปลอดภัยสำหรับ content แสดงผล
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'strong', 'b', 'em', 'i', 'u', 's',
            'ul', 'ol', 'li',
            'a', 'img',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    });
}
