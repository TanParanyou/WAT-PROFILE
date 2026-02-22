'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import type { MultiLangText } from '@/types/api';

interface MultiLangInputProps {
    label: string;
    value: MultiLangText;
    onChange: (value: MultiLangText) => void;
    type?: 'input' | 'textarea';
    required?: boolean;
    placeholder?: string;
}

const langs = [
    { key: 'th' as const, label: 'TH' },
    { key: 'en' as const, label: 'EN' },
    { key: 'de' as const, label: 'DE' },
];

export function MultiLangInput({
    label,
    value,
    onChange,
    type = 'input',
    required = false,
    placeholder,
}: MultiLangInputProps) {
    const [activeLang, setActiveLang] = useState<'th' | 'en' | 'de'>('th');

    const handleChange = (text: string) => {
        onChange({ ...value, [activeLang]: text });
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="flex gap-1">
                    {langs.map((lang) => (
                        <button
                            key={lang.key}
                            type="button"
                            onClick={() => setActiveLang(lang.key)}
                            className={cn(
                                'px-2 py-0.5 text-xs rounded font-medium transition-colors',
                                activeLang === lang.key
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            {type === 'textarea' ? (
                <textarea
                    value={value[activeLang] || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder || `${label} (${activeLang.toUpperCase()})`}
                    required={required && activeLang === 'th'}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
            ) : (
                <input
                    type="text"
                    value={value[activeLang] || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder || `${label} (${activeLang.toUpperCase()})`}
                    required={required && activeLang === 'th'}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
            )}
        </div>
    );
}
