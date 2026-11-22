import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { BottomSheet } from '@/components/bits';
import { JoinOrgModal } from '@/components/JoinOrgModal';
import { PressableScale } from '@/components/ui';
import { Agency, user } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { unreadCount, useDemo } from '@/store/demo';
import { colors, shadow } from '@/theme';

// Values below come from the Figma frame "Workspace — Organizations".
const MAIN = colors.primary;
const GRAY = colors.icon;
const FOLDER_START = '#004EEA';
// Folder outline (341 x 161): a 20px tab on the top-left, 16px corners.
const FOLDER =
  'M16 0H107C112.333 0 117 2.333 121 7L133 20H325C335.667 20 341 25.333 341 36V145C341 155.667 335.667 161 325 161H16C5.333 161 0 155.667 0 145V16C0 5.333 5.333 0 16 0Z';

/** One organization shown as a folder: blue-to-color gradient, white text, "…" at the top-right. */
function FolderCard({ agency, onPress, onMenu }: { agency: Agency; onPress: () => void; onMenu: () => void }) {
  const id = `g-${agency.id}`;
  return (
    <PressableScale
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={`Open ${agency.name}`}
      onPress={onPress}
      style={styles.cardWrap}
    >
      {/* The folder's shadow sits on a plain body-shaped view behind the drawing. */}
      <View style={styles.cardShadow} />
      <View style={styles.card}>
        <Svg width="100%" height="100%" viewBox="0 0 341 161" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={id} x1="170.5" y1="0" x2="360" y2="200" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={FOLDER_START} />
              <Stop offset="1" stopColor={agency.cardEnd ?? agency.brand} />
            </LinearGradient>
            <ClipPath id={`c-${agency.id}`}>
              <Path d={FOLDER} />
            </ClipPath>
          </Defs>
          <Path d={FOLDER} fill={`url(#${id})`} />
          <Circle cx={336} cy={136} r={78} fill="#FFFFFF" fillOpacity={0.055} clipPath={`url(#c-${agency.id})`} />
          <Ellipse cx={307.6} cy={45.5} rx={2.5} ry={2.59} fill="#FFFFFF" />
          <Ellipse cx={314.5} cy={45.6} rx={2.5} ry={2.59} fill="#FFFFFF" />
          <Ellipse cx={321.4} cy={45.7} rx={2.5} ry={2.59} fill="#FFFFFF" />
        </Svg>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`More options for ${agency.name}`}
          onPress={onMenu}
          scaleTo={0.9}
          style={styles.dotsHit}
        >
          <View />
        </PressableScale>
        <View style={styles.cardText} pointerEvents="none">
          <Text style={styles.short}>{agency.short}</Text>
          <Text style={styles.agency} numberOfLines={2}>
            {agency.name}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.meta}>
            {agency.role} · {agency.region}
          </Text>
          <Text style={styles.meta}>Member since {agency.memberSince}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

type MenuIcon = React.ComponentProps<typeof Ionicons>['name'];

function MenuRow({ icon, label, onPress, danger, disabled }: { icon: MenuIcon; label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  const color = danger ? colors.danger : disabled ? colors.icon : colors.text;
  return (
    <PressableScale scaleTo={0.98} disabled={disabled} onPress={onPress} accessibilityRole="button" style={styles.menuRow}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </PressableScale>
  );
}

/** Workspace picker. Standalone page: tapping a folder opens that organization's profile page. */
export default function Workspaces() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const { agencies, leaveAgency, moveAgency } = useStore();
  const demo = useDemo();
  const unread = unreadCount(demo, agencies.map((a) => a.id));
  const [menuFor, setMenuFor] = useState<Agency | null>(null);
  const menuIndex = menuFor ? agencies.findIndex((a) => a.id === menuFor.id) : -1;
  const list = useMemo(
    () => agencies.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase())),
    [agencies, q],
  );

  // The greeting and search are the top of the list, so they scroll away with the folders.
  const header = (
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
            style={styles.circle}
          >
            <Ionicons name="notifications-outline" size={22} color={GRAY} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => router.push('/profile')}
            style={[styles.circle, { backgroundColor: MAIN }]}
          >
            <Text style={styles.avatarText}>{user.firstName[0]}</Text>
          </PressableScale>
        </View>

        <Text style={styles.hello}>Hello, {user.firstName}!</Text>
        <Text style={styles.sub}>Welcome to your workspace</Text>

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search"
              placeholderTextColor={GRAY}
              style={styles.input}
            />
            <Ionicons name="search-outline" size={20} color={GRAY} />
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add organization"
            style={styles.circle}
            onPress={() => setJoinOpen(true)}
          >
            <Ionicons name="add" size={26} color={GRAY} />
          </PressableScale>
        </View>
      </View>
  );

  return (
    <View style={styles.screen}>
      <JoinOrgModal visible={joinOpen} onClose={() => setJoinOpen(false)} />

      <BottomSheet
        visible={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name ?? ''}
        subtitle={menuFor?.short}
      >
        <MenuRow
          icon="open-outline"
          label="Open organization"
          onPress={() => {
            const id = menuFor?.id;
            setMenuFor(null);
            if (id) router.push({ pathname: '/org/[agencyId]/org-profile', params: { agencyId: id } });
          }}
        />
        <MenuRow
          icon="arrow-up-outline"
          label="Move up"
          disabled={menuIndex <= 0}
          onPress={() => menuFor && moveAgency(menuFor.id, -1)}
        />
        <MenuRow
          icon="arrow-down-outline"
          label="Move down"
          disabled={menuIndex < 0 || menuIndex >= agencies.length - 1}
          onPress={() => menuFor && moveAgency(menuFor.id, 1)}
        />
        <MenuRow
          icon="log-out-outline"
          label="Leave organization"
          danger
          onPress={() => {
            const target = menuFor;
            setMenuFor(null);
            if (!target) return;
            Alert.alert(`Leave ${target.short}?`, 'You can join again later with an invitation code.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => leaveAgency(target.id) },
            ]);
          }}
        />
      </BottomSheet>

      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <FolderCard
            onMenu={() => setMenuFor(item)}
            agency={item}
            onPress={() =>
              // Straight to the organization's profile page.
              router.push({ pathname: '/org/[agencyId]/org-profile', params: { agencyId: item.id } })
            }
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No workspaces match your search.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 15, backgroundColor: '#FFFFFF' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  hello: { fontSize: 28, fontWeight: '700', color: MAIN, marginTop: 24, marginLeft: 10, lineHeight: 34 },
  sub: { fontSize: 16, color: MAIN, marginTop: 6, marginLeft: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 21 },
  search: {
    flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 20, ...shadow,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, padding: 0 },
  cardWrap: { marginHorizontal: 15, marginBottom: 12, height: 161 },
  cardShadow: {
    position: 'absolute', left: 0, right: 0, top: 20, bottom: 0, borderRadius: 16,
    backgroundColor: FOLDER_START, ...shadow,
  },
  card: { flex: 1 },
  // Invisible button laid over the drawn "..." dots at the folder's top-right.
  dotsHit: { position: 'absolute', top: 24, right: 6, width: 56, height: 44, zIndex: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52 },
  menuText: { fontSize: 16, fontWeight: '500' },
  cardText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 34, paddingBottom: 17 },
  short: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, lineHeight: 16, marginBottom: 2, textAlign: 'left', alignSelf: 'flex-start' },
  agency: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 25, textAlign: 'left', alignSelf: 'flex-start', maxWidth: '68%' },
  meta: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, textAlign: 'left', alignSelf: 'flex-start', maxWidth: '85%' },
  empty: { textAlign: 'center', color: GRAY, marginTop: 32 },
});
