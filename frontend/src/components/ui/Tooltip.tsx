'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  containerClassName?: string;
  delayMs?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  containerClassName,
  delayMs = 150,
  disabled = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    const gap = 6;
    if (position === 'top') {
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
    } else if (position === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    setCoords({ top, left });
  };

  const handleOpen = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, delayMs);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const transformMap = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  };

  const tooltipPortal =
    isMounted && isOpen && coords && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: transformMap[position],
            }}
            className={cn(
              'pointer-events-none z-[9999] whitespace-nowrap rounded-none border border-admin-border bg-admin-action px-2 py-1 text-xs font-medium text-admin-on-action shadow-md transition-opacity animate-in fade-in duration-100',
              className
            )}
          >
            {content}
          </div>,
          document.body
        )
      : null;

  return (
    <span
      ref={triggerRef}
      className={cn('inline-flex', containerClassName)}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      {children}
      {tooltipPortal}
    </span>
  );
}
