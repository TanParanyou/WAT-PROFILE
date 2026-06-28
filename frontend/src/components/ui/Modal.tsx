'use client';

import React, { useEffect, useCallback, useId } from 'react';
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
    const titleId = useId();
    const descriptionId = useId();
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
                className="fixed inset-0 z-50 bg-zinc-950/45"
                onClick={closeOnOverlayClick ? onClose : undefined}
            />
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pointer-events-none sm:items-center sm:p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? titleId : undefined}
                    aria-describedby={description ? descriptionId : undefined}
                    className={`max-h-[calc(100vh-1.5rem)] w-full ${sizeClasses[size]} overflow-hidden border border-zinc-200 bg-white shadow-2xl pointer-events-auto`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-3 sm:px-5">
                            <div className="min-w-0">
                                {title && <h2 id={titleId} className="text-base font-semibold text-zinc-950">{title}</h2>}
                                {description && <p id={descriptionId} className="mt-1 text-sm text-zinc-500">{description}</p>}
                            </div>
                            {showCloseButton && (
                                <button
                                    type="button"
                                    aria-label="Close modal"
                                    onClick={onClose}
                                    className="shrink-0 border border-transparent p-1 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}
                    {/* Body */}
                    {children && <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-5">{children}</div>}
                    {/* Footer */}
                    {footer && (
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-5">
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
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-zinc-200 bg-zinc-50 ${config.iconColor}`}>
                    <Icon size={24} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-zinc-950">{title}</h3>
                <p className="mb-6 text-sm text-zinc-500">{message}</p>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
                        {cancelText}
                    </button>
                    <button type="button" onClick={onConfirm} disabled={isLoading} className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${config.btnClass}`}>
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
                <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
                    <button type="button" onClick={onClose} disabled={isLoading} className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
                        {cancelText}
                    </button>
                    <button type="submit" disabled={isLoading || submitDisabled} className="flex items-center gap-2 bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
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
