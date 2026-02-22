'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Loading } from './Loading';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
type ModalVariant = 'default' | 'danger' | 'success' | 'warning' | 'info';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children?: React.ReactNode;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    footer?: React.ReactNode;
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ModalVariant;
    isLoading?: boolean;
}

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void | Promise<void>;
    title: string;
    children: React.ReactNode;
    submitText?: string;
    cancelText?: string;
    isLoading?: boolean;
    size?: ModalSize;
    submitDisabled?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
};

const variantConfig: Record<ModalVariant, { icon: React.ElementType; iconColor: string; btnClass: string }> = {
    default: { icon: Info, iconColor: 'text-blue-500', btnClass: 'bg-blue-600 hover:bg-blue-700' },
    danger: { icon: AlertTriangle, iconColor: 'text-red-500', btnClass: 'bg-red-600 hover:bg-red-700' },
    success: { icon: CheckCircle, iconColor: 'text-green-500', btnClass: 'bg-green-600 hover:bg-green-700' },
    warning: { icon: AlertCircle, iconColor: 'text-amber-500', btnClass: 'bg-amber-600 hover:bg-amber-700' },
    info: { icon: Info, iconColor: 'text-cyan-500', btnClass: 'bg-cyan-600 hover:bg-cyan-700' },
};

// Base Modal
const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    footer,
}) => {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) onClose();
        },
        [closeOnEscape, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50"
                onClick={closeOnOverlayClick ? onClose : undefined}
            />
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl pointer-events-auto overflow-hidden`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
                                {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
                            </div>
                            {showCloseButton && (
                                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}
                    {/* Body */}
                    {children && <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>}
                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
};

// Confirm Modal
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'ยืนยันการดำเนินการ',
    message,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    variant = 'default',
    isLoading = false,
}) => {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false} closeOnOverlayClick={!isLoading} closeOnEscape={!isLoading}>
            <div className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 ${config.iconColor}`}>
                    <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} disabled={isLoading} className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 flex items-center justify-center gap-2 ${config.btnClass}`}>
                        {isLoading ? <Loading size="sm" /> : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Form Modal
const FormModal: React.FC<FormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    children,
    submitText = 'บันทึก',
    cancelText = 'ยกเลิก',
    isLoading = false,
    size = 'md',
    submitDisabled = false,
}) => {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(e);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} closeOnOverlayClick={!isLoading} closeOnEscape={!isLoading}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">{children}</div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                        {cancelText}
                    </button>
                    <button type="submit" disabled={isLoading || submitDisabled} className="px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white disabled:opacity-50 flex items-center gap-2">
                        {isLoading ? <Loading size="sm" /> : submitText}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// useModal Hook
const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] = React.useState(initialState);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    return { isOpen, open, close };
};

// useConfirm Hook
interface UseConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ModalVariant;
}

const useConfirm = () => {
    const [state, setState] = React.useState<{
        isOpen: boolean;
        options: UseConfirmOptions | null;
        resolve: ((value: boolean) => void) | null;
    }>({ isOpen: false, options: null, resolve: null });

    const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ isOpen: true, options, resolve });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState({ isOpen: false, options: null, resolve: null });
    }, [state]);

    const handleClose = useCallback(() => {
        state.resolve?.(false);
        setState({ isOpen: false, options: null, resolve: null });
    }, [state]);

    const ConfirmDialog: React.FC = useCallback(() => {
        if (!state.options) return null;
        return (
            <ConfirmModal
                isOpen={state.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={state.options.title}
                message={state.options.message}
                confirmText={state.options.confirmText}
                cancelText={state.options.cancelText}
                variant={state.options.variant}
            />
        );
    }, [state, handleClose, handleConfirm]);

    return { confirm, ConfirmDialog };
};

export { Modal, ConfirmModal, FormModal, useModal, useConfirm };
export type { ModalProps, ConfirmModalProps, FormModalProps, ModalSize, ModalVariant };
