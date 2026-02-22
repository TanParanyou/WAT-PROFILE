'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '@/services/api';

interface ImageUploadProps {
    label?: string;
    value?: string;
    onChange: (url: string) => void;
    className?: string;
}

export function ImageUpload({ label, value, onChange, className = '' }: ImageUploadProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ตรวจสอบ file type
        if (!file.type.startsWith('image/')) {
            setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        // ตรวจสอบขนาด (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/admin/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onChange(res.data.data?.url || res.data.data);
        } catch {
            setError('อัปโหลดไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setIsUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-gray-700">{label}</label>
            )}

            {value ? (
                <div className="relative inline-block">
                    <img
                        src={value}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                    {isUploading ? (
                        <div className="h-6 w-6 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
                    ) : (
                        <>
                            <Upload size={20} className="text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">อัปโหลดรูป</span>
                        </>
                    )}
                </button>
            )}

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
