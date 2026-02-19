import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
    return (
        <div className={`container mx-auto px-4 -mt-20 relative z-20 pb-20 ${className}`}>
            {children}
        </div>
    );
}
