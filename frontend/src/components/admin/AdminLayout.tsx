'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { cn } from '@/utils/cn';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <div className={cn('transition-all duration-300', collapsed ? 'ml-16' : 'ml-64')}>
                <AdminHeader />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
