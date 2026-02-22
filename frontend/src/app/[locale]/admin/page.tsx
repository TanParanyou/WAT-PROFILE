'use client';

import React, { useEffect, useState } from 'react';
import { Link } from "@/navigation";
import {
    Calendar,
    Users,
    Image,
    Heart,
    UserCheck,
    Mail,
    Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { Loading } from '@/components/ui/Loading';
import { dashboardService, DashboardStats } from '@/services/adminService';
import type { PermissionResource } from '@/types/auth';
import type { LucideIcon } from 'lucide-react';

interface StatCard {
    label: string;
    icon: LucideIcon;
    color: string;
    resource: PermissionResource;
    statKey: keyof DashboardStats;
    href: string;
}

const stats: StatCard[] = [
    { label: 'กิจกรรม', icon: Calendar, color: 'bg-blue-50 text-blue-600', resource: 'events', statKey: 'events', href: '/admin/events' },
    { label: 'พระสงฆ์', icon: Users, color: 'bg-purple-50 text-purple-600', resource: 'monks', statKey: 'monks', href: '/admin/monks' },
    { label: 'อัลบั้มภาพ', icon: Image, color: 'bg-green-50 text-green-600', resource: 'gallery', statKey: 'gallery', href: '/admin/gallery' },
    { label: 'ตารางเวลา', icon: Clock, color: 'bg-indigo-50 text-indigo-600', resource: 'schedules', statKey: 'schedules', href: '/admin/schedules' },
    { label: 'การบริจาค', icon: Heart, color: 'bg-red-50 text-red-600', resource: 'donations', statKey: 'donations', href: '/admin/donations' },
    { label: 'สมาชิก', icon: UserCheck, color: 'bg-amber-50 text-amber-600', resource: 'members', statKey: 'members', href: '/admin/members' },
    { label: 'ข้อความติดต่อ', icon: Mail, color: 'bg-cyan-50 text-cyan-600', resource: 'contacts', statKey: 'contacts', href: '/admin/contacts' },
];

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { can } = usePermission();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        dashboardService.getStats()
            .then(setData)
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    const visibleStats = stats.filter((s) => can(s.resource, 'read'));

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleStats.map((stat) => {
                    const Icon = stat.icon;
                    const count = data ? data[stat.statKey] : null;
                    return (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                    {isLoading ? (
                                        <Loading size="sm" />
                                    ) : (
                                        <p className="text-2xl font-bold text-gray-900">
                                            {count !== null ? count.toLocaleString() : '—'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
