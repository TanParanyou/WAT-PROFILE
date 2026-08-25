"use client";

import { useCallback, useState } from "react";

export interface UseDisclosureOptions<T = void> {
  defaultIsOpen?: boolean;
  defaultData?: T | null;
  onOpen?: (data?: T) => void;
  onClose?: () => void;
}

export interface DisclosureState<T = void> {
  isOpen: boolean;
  data: T | null;
  open: (payload?: T) => void;
  close: () => void;
  toggle: () => void;
  setData: (data: T | null) => void;
  setIsOpen: (isOpen: boolean) => void;
}

export type UseDisclosureReturn<T = void> = DisclosureState<T>;

/**
 * createDisclosureState: Pure state container for disclosures, useful for tests and non-React contexts.
 */
export function createDisclosureState<T = void>(
  options: UseDisclosureOptions<T> = {},
): DisclosureState<T> {
  let isOpen = options.defaultIsOpen ?? false;
  let data: T | null = options.defaultData ?? null;

  return {
    get isOpen() {
      return isOpen;
    },
    get data() {
      return data;
    },
    open(payload?: T) {
      if (payload !== undefined) {
        data = payload;
      }
      isOpen = true;
      options.onOpen?.(payload);
    },
    close() {
      isOpen = false;
      data = null;
      options.onClose?.();
    },
    toggle() {
      isOpen = !isOpen;
    },
    setData(newData: T | null) {
      data = newData;
    },
    setIsOpen(newIsOpen: boolean) {
      isOpen = newIsOpen;
    },
  };
}

/**
 * useDisclosure: Standard hook to manage open/closed state for Modals, Drawers, Dialogs, and Menus.
 * Optionally supports attaching typed data/payload when opening (e.g. `useDisclosure<Donation>()`).
 */
export function useDisclosure<T = void>(
  options: UseDisclosureOptions<T> = {},
): UseDisclosureReturn<T> {
  const { defaultIsOpen = false, defaultData = null, onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState<boolean>(defaultIsOpen);
  const [data, setData] = useState<T | null>(defaultData);

  const open = useCallback(
    (payload?: T) => {
      if (payload !== undefined) {
        setData(payload);
      }
      setIsOpen(true);
      onOpen?.(payload);
    },
    [onOpen],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
    setIsOpen,
  };
}
