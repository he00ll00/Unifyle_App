import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import Svg, { ClipPath, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
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
      <KeyboardAvoidingView
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const FRONT =
  'M30.1251 21.2969H84.0906C93.4339 21.2969 99.8775 28.5075 97.4611 38.4013L90.0509 67.2439C87.7957 76.1315 82.8018 81.1622 74.264 81.1622H16.7545C7.08903 81.1622 1.45084 74.79 3.70612 64.7286L11.9218 35.0475C14.3381 26.4953 20.6207 21.2969 30.1251 21.2969Z';

/** UNIFYLE mark (the folder with a face), drawn from the supplied SVG. Width is `size`; height follows 99:82. */
export function Logo({ size = 99 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 82) / 99} viewBox="0 0 99 82" accessibilityLabel="UNIFYLE logo">
      <Defs>
        <LinearGradient id="p0" x1="8.85" y1="0" x2="48.5686" y2="82.1391" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.22" stopColor="#A4DBFF" />
          <Stop offset="0.55" stopColor="#97D0FF" />
          <Stop offset="1" stopColor="#D1F8FF" />
        </LinearGradient>
        <LinearGradient id="p1" x1="0.48" y1="0.5" x2="81.59" y2="55.97" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A1EFFF" />
          <Stop offset="0.5" stopColor="#70B4FF" />
          <Stop offset="1" stopColor="#1959E8" />
        </LinearGradient>
        <LinearGradient id="p2" x1="1.29" y1="46.451" x2="81.8825" y2="0.135" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#5DBAFF" />
          <Stop offset="0.4" stopColor="#358AF2" />
          <Stop offset="1" stopColor="#0B46D9" />
        </LinearGradient>
        <LinearGradient id="p3" x1="14.0976" y1="10.2295" x2="16.5216" y2="20.1301" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.5" stopColor="#B8E8FF" />
          <Stop offset="1" stopColor="#7FC2FF" />
        </LinearGradient>
        <LinearGradient id="p4" x1="12.4062" y1="10.5645" x2="12.4062" y2="13.5829" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="p5" x1="12.0491" y1="20.457" x2="37.1156" y2="91.8099" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.22" stopColor="#A4DBFF" />
          <Stop offset="0.55" stopColor="#97D0FF" />
          <Stop offset="1" stopColor="#D1F8FF" />
        </LinearGradient>
        <LinearGradient id="p6" x1="10.7918" y1="81.1622" x2="44.8883" y2="8.187" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#6BC9FF" />
          <Stop offset="0.28" stopColor="#3D97F7" />
          <Stop offset="0.7" stopColor="#286BED" />
          <Stop offset="1" stopColor="#5898FA" />
        </LinearGradient>
        <RadialGradient id="p7" cx="89.4432" cy="77.5703" rx="80.5466" ry="50.8855" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#B8EAFF" stopOpacity="0.9" />
          <Stop offset="0.5" stopColor="#9BD5FF" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#B7E8FF" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="p8" x1="11.6154" y1="23.8115" x2="22.2415" y2="51.9558" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E6FAFF" stopOpacity="0.65" />
          <Stop offset="0.45" stopColor="#B1DDFF" stopOpacity="0.15" />
          <Stop offset="1" stopColor="#B1DDFF" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="p9" x1="11.7578" y1="20.793" x2="11.7578" y2="34.7112" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="p10" x1="37.531" y1="43.2646" x2="41.6721" y2="49.2921" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.45" stopColor="#EDFAFF" />
          <Stop offset="1" stopColor="#A5D4FF" />
        </LinearGradient>
        <LinearGradient id="p11" x1="64.5955" y1="43.2646" x2="68.7365" y2="49.2921" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.45" stopColor="#EDFAFF" />
          <Stop offset="1" stopColor="#A5D4FF" />
        </LinearGradient>
        <LinearGradient id="p12" x1="47.8527" y1="51.9443" x2="49.1323" y2="59.126" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.45" stopColor="#EDFAFF" />
          <Stop offset="1" stopColor="#A5D4FF" />
        </LinearGradient>
        <ClipPath id="frontClip">
          <Path d={FRONT} />
        </ClipPath>
      </Defs>

      {/* Back folder */}
      <Path
        d="M0 61.3745V23.1412C0 10.2291 9.18219 0 20.9418 0H33.668C38.0175 0 41.2393 1.50921 44.3001 4.69532C46.7164 7.37836 49.455 8.04912 53.1601 8.04912H71.0412C79.0957 8.04912 84.895 13.2475 85.8616 20.9613L88.439 60.2007C89.2445 70.2621 81.9954 77.8082 72.0077 77.8082H15.7869C5.96037 77.8082 0 71.7713 0 61.3745Z"
        fill="url(#p0)"
      />
      <Path
        d="M0.480469 61.3744V23.1411C0.480469 10.5643 9.34048 0.50293 20.939 0.50293H33.6652C38.0147 0.50293 41.0754 2.01214 43.9751 5.19825C46.5525 7.88129 49.6133 8.55205 53.1573 8.55205H71.0384C78.7707 8.55205 84.4089 13.5828 85.3755 21.1288L87.9529 60.2006C88.7584 69.9266 81.6704 77.305 72.0049 77.305H15.7841C6.27975 77.305 0.480469 71.6035 0.480469 61.3744Z"
        fill="url(#p1)"
      />
      <Path
        d="M1.28906 61.2077V23.3097C1.28906 11.0684 9.98798 1.67773 21.1033 1.67773H33.6684C37.8567 1.67773 40.7564 3.01925 43.4949 6.03767C46.2335 8.72071 49.4553 9.22378 53.3215 9.22378H70.8804C78.4517 9.22378 83.6066 14.0868 84.5732 21.4652L86.9895 60.3692C87.795 69.5922 81.3513 76.2998 71.847 76.2998H15.9484C6.76616 76.2998 1.28906 71.1014 1.28906 61.2077Z"
        fill="url(#p2)"
      />
      <Path
        d="M15.4669 10.2295H28.9985C30.9316 10.2295 32.2204 11.7387 32.2204 13.751C32.2204 15.7633 30.9316 17.2725 28.9985 17.2725H15.4669C13.5338 17.2725 12.084 15.7633 12.084 13.751C12.084 11.7387 13.5338 10.2295 15.4669 10.2295Z"
        fill="url(#p3)"
      />
      <Path
        d="M15.467 10.5645H28.8375C30.4485 10.5645 31.5761 11.4029 31.8983 12.9121C30.9317 11.5706 30.1263 11.2352 28.6765 11.2352H15.6281C13.8561 11.2352 12.8895 12.2414 12.4062 13.5829C12.4062 11.906 13.695 10.5645 15.467 10.5645Z"
        fill="url(#p4)"
      />

      {/* Front folder */}
      <Path
        d="M29.9617 20.457H84.2494C94.0759 20.457 100.681 28.1708 98.2643 38.5676L90.8541 67.4102C88.5988 76.6332 83.1217 81.9993 74.4228 81.9993H16.5911C6.44237 81.9993 0.643087 75.124 2.89836 64.5595L11.114 34.7107C13.6915 25.8231 20.1351 20.457 29.9617 20.457Z"
        fill="url(#p5)"
      />
      <Path d={FRONT} fill="url(#p6)" />
      <Path d={FRONT} fill="url(#p7)" />
      {/* Inner 1px outline: a 2px stroke clipped to the folder shape. */}
      <Path d={FRONT} stroke="#F9F9FC" strokeWidth={2} fill="none" clipPath="url(#frontClip)" />
      <Path
        d="M13.0491 36.2206C15.4655 27.6684 21.748 23.8115 30.1248 23.8115H56.7048C36.0851 25.153 18.6873 38.0652 6.60547 55.3372L13.0491 36.2206Z"
        fill="url(#p8)"
      />
      <Path
        d="M30.1222 20.793H84.2488C91.9812 20.793 97.6194 25.656 98.2637 32.3636C96.0085 25.656 91.1757 21.7991 83.9266 21.7991H30.1222C21.1011 21.7991 14.8185 26.6621 11.7578 34.7112C14.0131 25.8237 20.7789 20.793 30.1222 20.793Z"
        fill="url(#p9)"
      />

      {/* Face */}
      <Path
        d="M36.5645 45.78C36.5645 44.4385 37.6921 43.2646 38.9808 43.2646C40.2695 43.2646 41.3972 44.4385 41.3972 45.78V48.1277C41.3972 49.4692 40.4306 50.643 38.9808 50.643C37.531 50.643 36.5645 49.4692 36.5645 48.1277V45.78Z"
        fill="url(#p10)"
      />
      <Path
        d="M63.6289 45.78C63.6289 44.4385 64.7565 43.2646 66.0453 43.2646C67.334 43.2646 68.4616 44.4385 68.4616 45.78V48.1277C68.4616 49.4692 67.4951 50.643 66.0453 50.643C64.5955 50.643 63.6289 49.4692 63.6289 48.1277V45.78Z"
        fill="url(#p11)"
      />
      <Path
        d="M45.1051 54.3332C44.2996 53.1593 44.944 51.9855 45.9105 51.9855C46.716 51.8178 47.1993 52.3209 47.8436 53.1593C49.9378 55.8424 54.9316 55.8424 57.348 53.1593C57.9924 52.1532 58.4756 51.8178 59.2811 51.9855C60.4087 52.1532 60.5698 53.327 59.9255 54.3332C56.8647 59.3639 48.488 59.3639 45.1051 54.3332Z"
        fill="url(#p12)"
      />
    </Svg>
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
