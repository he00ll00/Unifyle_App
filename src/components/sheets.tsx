import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { radius, shadow } from '@/theme';

/** A short message at the bottom of the screen, for actions that finish instantly (front end only). */
export function useToast(): { notify: (message: string) => void; toast: ReactNode } {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toast = message ? (
    <View style={styles.toastWrap} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </View>
  ) : null;

  return { notify, toast };
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  toast: { backgroundColor: '#1F2937', borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11, ...shadow },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
});
