'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/navigation";
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
    const t = useTranslations("Admin");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // ถ้า login แล้ว redirect ไป dashboard
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace('/admin');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email, password });
            router.push('/admin');
        } catch (err) {
            if (err instanceof Error) {
                setError(t("login.invalidCredentials"));
            } else {
                setError(t("login.genericError"));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">{t("login.title")}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t("login.subtitle")}</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            id="email"
                            type="email"
                            label={t("login.email")}
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        <Input
                            id="password"
                            type="password"
                            label={t("login.password")}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full"
                            size="lg"
                        >
                            {t("login.submit")}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
