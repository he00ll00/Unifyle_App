import React, { useState } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { colors, radius, shadow } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that springs down slightly while pressed and back up on release. */
export function PressableScale({
  style,
  scaleTo = 0.95,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 50, bounciness: 7 }).start();

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        spring(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        spring(1);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    />
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'soft';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const brand = useBrand();
  const primary = variant === 'primary';
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.96}
      style={[styles.btn, { backgroundColor: primary ? brand.primary : brand.soft }, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={[styles.btnText, { color: primary ? '#fff' : brand.dark }]}>{label}</Text>
    </PressableScale>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const brand = useBrand();
  return (
    <View style={styles.seg}>
      {options.map((o) => (
        <PressableScale
          key={o}
          onPress={() => onChange(o)}
          scaleTo={0.94}
          style={[styles.segItem, value === o && { backgroundColor: brand.primary }]}
        >
          <Text style={[styles.segText, value === o && { color: '#fff' }]}>{o}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const brand = useBrand();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      style={[styles.chip, active && { backgroundColor: brand.primary }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow },
  btn: { minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { fontSize: 14, fontWeight: '600' },
  seg: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 4, ...shadow },
  segItem: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segText: { fontSize: 14, fontWeight: '500', color: colors.muted },
  chip: {
    paddingHorizontal: 18,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.muted },
});
