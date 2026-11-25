import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAvoiding } from '@/components/keyboard';
import { Text } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { colors, radius } from '@/theme';

/** Date block used in activity lists: the day on top, the month below (e.g. 17 / JUN). */
export function DateBlock({ month, day }: { month: string; day: string }) {
  const brand = useBrand();
  return (
    <View style={[styles.date, { backgroundColor: brand.soft }]}>
      <Text style={[styles.dateDay, { color: brand.dark }]}>{day.padStart(2, '0')}</Text>
      <Text style={[styles.dateMonth, { color: brand.primary }]}>{month}</Text>
    </View>
  );
}

/** Small coloured status text pill. */
export function StatusPill({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'muted' | 'info' | 'danger' }) {
  const map = {
    ok: [colors.successSoft, colors.success],
    warn: [colors.warnSoft, colors.warn],
    muted: [colors.border, colors.muted],
    info: [colors.infoSoft, colors.info],
    danger: [colors.dangerSoft, colors.danger],
  } as const;
  return (
    <View style={[styles.pill, { backgroundColor: map[tone][0] }]}>
      <Text style={[styles.pillText, { color: map[tone][1] }]}>{label}</Text>
    </View>
  );
}

/**
 * Bottom sheet over the current screen. The dark backdrop fades in by itself while the panel
 * glides up, so the whole screen never slides (a plain `slide` Modal moves the backdrop too).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  // Stay mounted until the closing animation has finished.
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(t, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setShown(false);
    });
  }, [visible, t]);

  return (
    <Modal visible={shown} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: t }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoiding
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetLayer}
      >
        <Animated.View
          style={[
            styles.sheet,
            { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoiding>
    </Modal>
  );
}

const styles = StyleSheet.create({
  date: { width: 46, height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { fontSize: 10, fontWeight: '700' },
  dateDay: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontSize: 12, fontWeight: '700' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheetLayer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', padding: 18, paddingBottom: 28,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sheetSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
