import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

import { Text } from './Text';

type ToastTone = 'info' | 'success' | 'error';
interface ToastState { message: string; tone: ToastTone; id: number }

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
    }, 2600);
    return () => clearTimeout(t);
  }, [toast, opacity]);

  const value = useMemo<ToastContextValue>(
    () => ({ show, error: (m) => show(m, 'error'), success: (m) => show(m, 'success') }),
    [show],
  );

  const bg = toast?.tone === 'error' ? theme.colors.danger : toast?.tone === 'success' ? theme.colors.success : theme.colors.text;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" style={[styles.toast, { opacity, top: insets.top + 12, backgroundColor: bg }]}>
          <Text variant="small" tone="inverse" style={styles.text}>
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    ...theme.shadow.card,
  },
  text: { textAlign: 'center', fontWeight: '600' },
});
