'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConfirmModal } from '@/components/ui/Modal';
import type { ModalVariant } from '@/components/ui/Modal';

export interface UseConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ModalVariant;
    onConfirm?: () => Promise<void> | void;
}

export const useConfirm = () => {
    const [state, setState] = useState<{
        isOpen: boolean;
        options: UseConfirmOptions | null;
        isLoading: boolean;
    }>({ isOpen: false, options: null, isLoading: false });

    // Store the promise resolver in useRef to avoid React state re-render triggers
    // and keep it safe from closure issues.
    const resolverRef = useRef<((accepted: boolean) => void) | null>(null);

    // Settle resolves the current promise and closes the dialog
    const settle = useCallback((accepted: boolean) => {
        const resolve = resolverRef.current;
        resolverRef.current = null;
        if (resolve) {
            resolve(accepted);
        }
        setState({ isOpen: false, options: null, isLoading: false });
    }, []);

    // Initiates the confirmation dialog
    const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
        // Resolve any older pending promise as false to prevent leaks
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
            setState({ isOpen: true, options, isLoading: false });
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!state.options) return;

        if (state.options.onConfirm) {
            setState((prev) => ({ ...prev, isLoading: true }));
            try {
                await state.options.onConfirm();
                settle(true);
            } catch (error) {
                // Keep the dialog open, only reset the loading state
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        } else {
            settle(true);
        }
    }, [state.options, settle]);

    const handleClose = useCallback(() => {
        if (state.isLoading) return; // Do not close while loading
        settle(false);
    }, [state.isLoading, settle]);

    // Cleanup logic when the hook unmounts to prevent leaks
    useEffect(() => {
        return () => {
            if (resolverRef.current) {
                resolverRef.current(false);
                resolverRef.current = null;
            }
        };
    }, []);

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
                isLoading={state.isLoading}
            />
        );
    }, [state.isOpen, state.options, state.isLoading, handleClose, handleConfirm]);

    return { confirm, ConfirmDialog };
};
