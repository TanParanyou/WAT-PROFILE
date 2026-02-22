'use client';

import React from 'react';
import {
    Calendar,
    Users,
    Image,
    Heart,
    UserCheck,
    Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import type { PermissionResource } from '@/types/auth';
import type { LucideIcon } from 'lucide-react';

interface StatCard {
    label: string;
    icon: LucideIcon;
    color: string;
    resource?: PermissionResource;
}

const stats: StatCard[] = [
    { label: 'กิจกรรม', icon: Calendar, color: 'bg-blue-50 text-blue-600', resource: 'events' },
    { label: 'พระสงฆ์', icon: Users, color: 'bg-purple-50 text-purple-600', resource: 'monks' },
    { label: 'อัลบั้มภาพ', icon: Image, color: 'bg-green-50 text-green-600', resource: 'gallery' },
    { label: 'การบริจาค', icon: Heart, color: 'bg-red-50 text-red-600', resource: 'donations' },
    { label: 'สมาชิก', icon: UserCheck, color: 'bg-amber-50 text-amber-600', resource: 'members' },
    { label: 'ข้อความติดต่อ', icon: Mail, color: 'bg-cyan-50 text-cyan-600', resource: 'contacts' },
];

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { can } = usePermission();

    const visibleStats = stats.filter(
        (s) => !s.resource || can(s.resource, 'read')
    );

    return (
        <div>
            {/* Welcome */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    สวัสดี, {user?.name}
                </h1>
                <p className="text-gray-500 mt-1">ยินดีต้อนรับสู่ระบบจัดการวัด</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">—</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
