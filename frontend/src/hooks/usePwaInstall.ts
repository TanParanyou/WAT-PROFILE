'use client';

import { useCallback, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPromptHolder: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function notifyPromptListeners() {
  promptListeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptHolder = e as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPromptHolder = null;
    notifyPromptListeners();
  });
}

function subscribeToPrompt(callback: () => void) {
  promptListeners.add(callback);
  return () => {
    promptListeners.delete(callback);
  };
}

function getPromptSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPromptHolder;
}

function getPromptServerSnapshot(): null {
  return null;
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  mediaQuery.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    mediaQuery.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari specific property
    window.navigator.standalone === true
  );
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

function getIsIosSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  const isStandalone = getStandaloneSnapshot();
  return isIosDevice && !isStandalone;
}

export function usePwaInstall() {
  const deferredPrompt = useSyncExternalStore(
    subscribeToPrompt,
    getPromptSnapshot,
    getPromptServerSnapshot
  );

  const isInstalled = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );

  const isIOS = useSyncExternalStore(
    subscribeStandalone,
    getIsIosSnapshot,
    getStandaloneServerSnapshot
  );

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptHolder) {
      return false;
    }

    const currentPrompt = deferredPromptHolder;
    await currentPrompt.prompt();
    const choiceResult = await currentPrompt.userChoice;

    deferredPromptHolder = null;
    notifyPromptListeners();

    return choiceResult.outcome === 'accepted';
  }, []);

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    isIOS,
    promptInstall,
  };
}
