import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { hapticSuccess, hapticError } from '@/lib/haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
  id: string;
  message: string;
  type: ToastType;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const MAX_VISIBLE = 3;

const TOAST_COLORS: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.error,
  info: Colors.secondary,
  warning: Colors.accent,
};

const TOAST_ICONS: Record<ToastType, React.ComponentProps<typeof FontAwesome>['name']> = {
  success: 'check',
  error: 'times',
  info: 'info-circle',
  warning: 'exclamation-triangle',
};

function ToastIcon({ type }: { type: ToastType }) {
  return (
    <View style={styles.iconContainer}>
      <FontAwesome name={TOAST_ICONS[type]} size={14} color="#FFF" />
    </View>
  );
}

function ToastItem({
  item,
  index,
  onDismiss,
}: {
  item: ToastEntry;
  index: number;
  onDismiss: (id: string) => void;
}) {
  return (
    <Animated.View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={item.message}
      style={[
        styles.toast,
        {
          backgroundColor: TOAST_COLORS[item.type],
          opacity: item.opacity,
          transform: [{ translateY: item.translateY }],
          top: index * 60,
        },
        Shadows.medium,
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.toastContent, pressed && { opacity: 0.8 }]}
        onPress={() => onDismiss(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss: ${item.message}`}
        accessibilityHint="Tap to dismiss this notification"
      >
        <ToastIcon type={item.type} />
        <Text style={styles.toastText} numberOfLines={2}>
          {item.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toastIdRef = useRef(0);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (!toast) return prev;

      // Clear auto-dismiss timer
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }

      // Animate out
      Animated.parallel([
        Animated.timing(toast.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toast.translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      });

      return prev;
    });
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${++toastIdRef.current}`;
      const opacity = new Animated.Value(0);
      const translateY = new Animated.Value(-20);

      const newToast: ToastEntry = { id, message, type, opacity, translateY };

      // Trigger haptic feedback based on toast type
      if (type === 'success') {
        hapticSuccess();
      } else if (type === 'error') {
        hapticError();
      }

      setToasts((prev) => {
        // If at max, remove the oldest
        const updated = prev.length >= MAX_VISIBLE ? prev.slice(1) : prev;
        return [...updated, newToast];
      });

      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(id);
      }, 3000);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = insets.top || (Platform.OS === 'web' ? 16 : 44);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: topInset + 8 }]} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} item={toast} index={index} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastText: {
    flex: 1,
    color: Colors.white,
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
