'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-3">
                    เกิดข้อผิดพลาด
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    ขออภัย เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw size={18} />
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        </div>
    );
}
