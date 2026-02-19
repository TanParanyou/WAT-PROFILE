import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
    return (
        <div className="relative bg-primary overflow-hidden pb-32 pt-40">
            <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[url('/images/thai-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            <div className="container mx-auto px-4 relative z-10 text-center">
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4 tracking-tight drop-shadow-sm">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xl text-white/90 font-light max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
        </div>
    );
}
