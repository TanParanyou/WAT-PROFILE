'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ShareButton() {
    const pathname = usePathname();
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (isSharing) return;

        const url = window.location.origin + pathname;

        if (navigator.share) {
            try {
                setIsSharing(true);
                await navigator.share({
                    title: document.title,
                    url: url,
                });
            } catch (err) {
                // Ignore AbortError (user cancelled)
                if ((err as Error).name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            } finally {
                setIsSharing(false);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-all font-medium active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-lg"
            aria-label="Share this event"
        >
            {copied ? (
                <>
                    <Check size={20} className="text-green-500" />
                    <span className="text-green-600">Copied!</span>
                </>
            ) : (
                <>
                    <Share2 size={20} />
                    Share
                </>
            )}
        </button>
    );
}
