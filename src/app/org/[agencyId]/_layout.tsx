import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { BrandProvider } from '@/components/Brand';
import { PressableScale } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { colors, makeBrand } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

// "Active text" navigation: inactive tabs are icon-only, the active tab shows its label
// in a tinted pill. The first cell is the organization's logo, which opens its profile page.
const NAV: { name: string; label: string; text: string; icon: IconName; active: IconName }[] = [
  { name: '(home)', label: 'Dashboard', text: 'Dashboard', icon: 'calendar-outline', active: 'calendar' },
  { name: 'checkin', label: 'QR check-in', text: 'Check-in', icon: 'scan-outline', active: 'scan' },
  { name: 'plans', label: 'Plans and certificates', text: 'Plans', icon: 'ribbon-outline', active: 'ribbon' },
];

function OrgTabBar({
  state,
  navigateToTab,
  insets,
  agencyId,
  short,
  fullName,
  color,
}: BottomTabBarProps & { agencyId: string; short: string; fullName: string; color: string }) {
  const current = state.routes[state.index]?.name;
  const soft = makeBrand(color).soft;

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: 62 + insets.bottom }]}>
      {/* The organization's logo is the button for its profile page. */}
      <PressableScale
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${fullName} profile`}
        accessibilityState={{ selected: current === 'org-profile' }}
        style={styles.logoCell}
        onPress={() => {
          const route = state.routes.find((r) => r.name === 'org-profile');
          if (route) navigateToTab(route.key);
        }}
      >
        <View style={[styles.logoRing, { borderColor: current === 'org-profile' ? color : 'transparent' }]}>
          <View style={[styles.logo, { backgroundColor: color }]}>
            <Text style={styles.logoText} numberOfLines={1}>
              {short}
            </Text>
          </View>
        </View>
      </PressableScale>

      {/* Items size to their content, so a growing pill pushes the other icons aside. */}
      <View style={styles.items}>
        {NAV.map((item) => {
          const route = state.routes.find((r) => r.name === item.name);
          if (!route) return null;
          return (
            <NavItem
              key={item.name}
              item={item}
              focused={current === item.name}
              color={color}
              soft={soft}
              onPress={() => {
                // Dashboard: also return to the top of its stack (leave an open activity or profile).
                if (item.name === '(home)') router.navigate({ pathname: '/org/[agencyId]', params: { agencyId } });
                else navigateToTab(route.key);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function NavItem({
  item,
  focused,
  color,
  soft,
  onPress,
}: {
  item: (typeof NAV)[number];
  focused: boolean;
  color: string;
  soft: string;
  onPress: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(focused ? 1 : 0));
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    // Layout properties (width) can't use the native driver, so this runs on the JS thread.
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  const labelWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, textWidth] });
  const labelGap = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });

  return (
    <PressableScale
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: focused }}
      hitSlop={{ top: 8, bottom: 8 }}
      onPress={onPress}
    >
      <View style={styles.pill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.pillBg, { backgroundColor: soft, opacity: progress }]} />
        <Ionicons name={focused ? item.active : item.icon} size={22} color={focused ? color : colors.muted} />
        <Animated.View style={{ width: labelWidth, marginLeft: labelGap, opacity: progress, overflow: 'hidden' }}>
          <Text style={[styles.pillText, { color, width: textWidth + 2 }]} numberOfLines={1}>
            {item.text}
          </Text>
        </Animated.View>
        {/* Invisible copy, only used to measure how wide the label is. */}
        <View style={styles.measure} pointerEvents="none">
          <Text
            style={styles.pillText}
            onTextLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
              if (w && w !== textWidth) setTextWidth(w);
            }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

/** Organization navigator, themed with the agency's brand colour. */
export default function OrgLayout() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies, hydrated } = useStore();
  const agency = agencies.find((a) => a.id === agencyId);
  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!agency) return <Redirect href="/workspaces" />;

  const brand = makeBrand(agency.brand);

  return (
    <BrandProvider color={agency.brand}>
      <Tabs
        // Opening an organization lands on its profile; back should return to the workspaces.
        backBehavior="history"
        tabBar={(props) => (
          <OrgTabBar {...props} agencyId={agency.id} short={agency.short} fullName={agency.name} color={brand.primary} />
        )}
        screenOptions={{
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { color: colors.text, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
        }}
      >
        {/* Dashboard tab is a stack: dashboard, activity workspace and profile. */}
        <Tabs.Screen name="(home)" options={{ headerShown: false }} />
        {/* Organization profile: opened from the logo button, not part of the icon list. */}
        <Tabs.Screen name="org-profile" options={{ headerShown: false }} />
        <Tabs.Screen name="checkin" options={{ headerTitle: 'QR check-in' }} />
        <Tabs.Screen name="plans" options={{ headerTitle: 'Plans & certs' }} />
      </Tabs>
    </BrandProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  logoCell: { width: 64, alignItems: 'center', justifyContent: 'center' },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingRight: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', minHeight: 42, paddingHorizontal: 13, borderRadius: 999 },
  pillBg: { borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  measure: { position: 'absolute', width: 240, opacity: 0, left: 0, top: 0 },
  logoRing: { padding: 2, borderRadius: 11, borderWidth: 2 },
  logo: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  logoText: { color: '#fff', fontSize: 7, fontWeight: '700' },
});
