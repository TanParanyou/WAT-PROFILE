'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Image,
    Clock,
    Heart,
    UserCheck,
    Mail,
    ClipboardList,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';
import type { PermissionResource } from '@/types/auth';
import type { LucideIcon } from 'lucide-react';

interface MenuItem {
    label: string;
    href: string;
    icon: LucideIcon;
    resource?: PermissionResource;
    alwaysShow?: boolean;
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, alwaysShow: true },
    { label: 'กิจกรรม', href: '/admin/events', icon: Calendar, resource: 'events' },
    { label: 'พระสงฆ์', href: '/admin/monks', icon: Users, resource: 'monks' },
    { label: 'อัลบั้มภาพ', href: '/admin/gallery', icon: Image, resource: 'gallery' },
    { label: 'ตารางเวลา', href: '/admin/schedules', icon: Clock, resource: 'schedules' },
    { label: 'การบริจาค', href: '/admin/donations', icon: Heart, resource: 'donations' },
    { label: 'สมาชิก', href: '/admin/members', icon: UserCheck, resource: 'members' },
    { label: 'ลงทะเบียน', href: '/admin/registrations', icon: ClipboardList, resource: 'events' },
    { label: 'ติดต่อ', href: '/admin/contacts', icon: Mail, resource: 'contacts' },
    { label: 'ตั้งค่า', href: '/admin/settings', icon: Settings, resource: 'settings' },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
    const pathname = usePathname();
    const { can } = usePermission();

    // กรองเมนูตาม permission
    const visibleItems = menuItems.filter(
        (item) => item.alwaysShow || (item.resource && can(item.resource, 'read'))
    );

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-30 transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                {!collapsed && (
                    <span className="text-lg font-semibold text-gray-800 truncate">
                        WAT Admin
                    </span>
                )}
                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                                active
                                    ? 'bg-amber-50 text-amber-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} className={cn(active && 'text-amber-600')} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
