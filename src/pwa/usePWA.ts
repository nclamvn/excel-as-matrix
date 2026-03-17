// Phase 10: PWA Hook
// Provides PWA installation and update functionality

import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { loggers } from '@/utils/logger';

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface PWAActions {
  install: () => Promise<boolean>;
  update: () => Promise<void>;
  dismissInstall: () => void;
  dismissUpdate: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setInstallable] = useState(false);
  const [isInstalled, setInstalled] = useState(false);
  const [isOffline, setOffline] = useState(!navigator.onLine);
  const [isUpdateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Register Service Worker
    const update = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        // App is ready for offline use
      },
      onRegistered(r) {
        if (r) {
          setRegistration(r);
        }
      },
      onRegisterError(error) {
        loggers.pwa.error('SW registration error:', error);
      },
    });

    setUpdateSW(() => update);

    // Handle install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallable(false);
      setDeferredPrompt(null);
    };

    // Handle network status
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    // Check if already installed (standalone mode)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.matches) {
      setInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setInstalled(true);
        setInstallable(false);
      }

      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      loggers.pwa.error('Install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const update = useCallback(async (): Promise<void> => {
    if (!updateSW) return;

    setUpdating(true);
    try {
      await updateSW();
      setUpdateAvailable(false);
    } finally {
      setUpdating(false);
    }
  }, [updateSW]);

  const dismissInstall = useCallback(() => {
    setInstallable(false);
    setDeferredPrompt(null);
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOffline,
    isUpdateAvailable,
    isUpdating,
    registration,
    install,
    update,
    dismissInstall,
    dismissUpdate,
  };
}
