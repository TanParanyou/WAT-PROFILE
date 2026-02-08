'use client';

import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

interface NavigationItem {
    id: string;
    label: string;
}

interface PageNavigationProps {
    items: NavigationItem[];
}

export default function PageNavigation({ items }: PageNavigationProps) {
    const [activeId, setActiveId] = useState<string>(items[0]?.id || '');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -60% 0px', // Adjust trigger point
                threshold: 0,
            }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            items.forEach((item) => {
                const element = document.getElementById(item.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, [items]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Adjust for sticky header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
            setActiveId(id);
        }
    };

    return (
        <nav className="sticky top-20 z-10 w-full lg:w-64 shrink-0 self-start">
            {/* Mobile / Tablet Horizontal Scroll */}
            <div className="lg:hidden w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-2">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={cn(
                                'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all',
                                activeId === item.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Vertical List */}
            <div className="hidden lg:block bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                <h3 className="font-heading font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    Contents
                </h3>
                <ul className="space-y-1">
                    {items.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => scrollToSection(item.id)}
                                className={cn(
                                    'w-full text-left px-4 py-2 rounded-lg text-sm transition-all border-l-2',
                                    activeId === item.id
                                        ? 'border-primary text-primary font-bold bg-primary/5'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800'
                                )}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
