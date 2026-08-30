import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML เพื่อป้องกัน XSS
 * อนุญาตเฉพาะ tags และ attributes ที่ปลอดภัยสำหรับ content แสดงผลระดับ Production
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br',
            'strong', 'b', 'em', 'i', 'u', 's', 'strike',
            'code', 'pre', 'mark', 'sub', 'sup', 'span',
            'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'img'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'target', 'rel', 'class',
            'title', 'width', 'height', 'start', 'style', 'data-align', 'data-color'
        ],
    });
}
