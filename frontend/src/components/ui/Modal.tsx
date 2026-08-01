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
    default: { icon: Info, iconColor: 'text-admin-info', btnClass: 'bg-admin-info text-admin-on-action hover:brightness-90' },
    danger: { icon: AlertTriangle, iconColor: 'text-admin-danger', btnClass: 'bg-admin-danger text-admin-on-action hover:brightness-90' },
    success: { icon: CheckCircle, iconColor: 'text-admin-success', btnClass: 'bg-admin-success text-admin-on-action hover:brightness-90' },
    warning: { icon: AlertCircle, iconColor: 'text-admin-warning', btnClass: 'bg-admin-warning text-admin-on-action hover:brightness-90' },
    info: { icon: Info, iconColor: 'text-admin-info', btnClass: 'bg-admin-info text-admin-on-action hover:brightness-90' },
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
        <div className="admin-theme">
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/45"
                onClick={closeOnOverlayClick ? onClose : undefined}
            />
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pointer-events-none sm:items-center sm:p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? titleId : undefined}
                    aria-describedby={description ? descriptionId : undefined}
                    className={`max-h-[calc(100vh-1.5rem)] w-full ${sizeClasses[size]} overflow-hidden border border-admin-border bg-admin-surface rounded-none shadow-2xl pointer-events-auto`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-start justify-between gap-4 border-b border-admin-border px-4 py-3 sm:px-5">
                            <div className="min-w-0">
                                {title && <h2 id={titleId} className="text-base font-semibold text-admin-foreground">{title}</h2>}
                                {description && <p id={descriptionId} className="mt-1 text-sm text-admin-muted">{description}</p>}
                            </div>
                            {showCloseButton && (
                                <button
                                    type="button"
                                    aria-label="Close modal"
                                    onClick={onClose}
                                    className="shrink-0 rounded-none p-1.5 text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground focus-visible:outline-2 focus-visible:outline-admin-focus"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}
                    {/* Body */}
                    {children && <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-5 text-admin-body">{children}</div>}
                    {/* Footer */}
                    {footer && (
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-admin-border bg-admin-surface-muted px-4 py-3 sm:px-5">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
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
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-admin-border bg-admin-surface-muted rounded-full ${config.iconColor}`}>
                    <Icon size={24} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-admin-foreground">{title}</h3>
                <p className="mb-6 text-sm text-admin-muted">{message}</p>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 border border-admin-control-border bg-admin-surface px-4 py-2 min-h-11 rounded-none text-sm font-medium text-admin-body hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus">
                        {cancelText}
                    </button>
                    <button type="button" onClick={onConfirm} disabled={isLoading} className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 min-h-11 rounded-none text-sm font-medium disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus ${config.btnClass}`}>
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
                <div className="mt-6 flex justify-end gap-3 border-t border-admin-border pt-4">
                    <button type="button" onClick={onClose} disabled={isLoading} className="border border-admin-control-border bg-admin-surface px-4 py-2 min-h-11 rounded-none text-sm font-medium text-admin-body hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus">
                        {cancelText}
                    </button>
                    <button type="submit" disabled={isLoading || submitDisabled} className="flex items-center gap-2 bg-admin-action px-6 py-2 min-h-11 rounded-none text-sm font-medium text-admin-on-action hover:bg-admin-action-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus">
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
export { Modal, ConfirmModal, FormModal, useModal };
export type { ModalProps, ConfirmModalProps, FormModalProps, ModalSize, ModalVariant };
