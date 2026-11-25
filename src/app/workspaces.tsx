import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useId, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/bits';
import { JoinOrgModal } from '@/components/JoinOrgModal';
import { Button, PressableScale } from '@/components/ui';
import { Agency, user } from '@/data/mock';
import { notifications as membershipNotices } from '@/data/sample';
import { useToast } from '@/components/sheets';
import { useStore } from '@/store/AppStore';
import { demoActions, unreadCount, useDemo } from '@/store/demo';
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
  // The gradient id must be unique per card instance. On the web, a page that stays mounted behind another one
  // (after going back to Workspaces) would otherwise share the id, and the card drew its fill from the hidden copy.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = `g-${agency.id}-${uid}`;
  return (
    <PressableScale
      scaleTo={0.97}
      // On the web a button cannot contain the "…" button, so the card is only a button on phones.
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
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
          </Defs>
          <Path d={FOLDER} fill={`url(#${id})`} />
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

/** An invitation from an agency: answered here, not in Notifications. */
function InvitationCard({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const n = membershipNotices.pending;
  return (
    <View style={styles.invite}>
      <View style={styles.inviteHead}>
        <View style={styles.inviteLogo}>
          <Text style={styles.inviteLogoText}>{n.short}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.inviteKicker}>Invitation</Text>
          <Text style={styles.inviteTitle}>{n.name}</Text>
          <Text style={styles.inviteMeta}>{n.by}</Text>
          <Text style={styles.inviteMeta}>{n.expires}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Accept" size="lg" style={{ flex: 1 }} onPress={onAccept} />
        <Button label="Decline" size="lg" variant="soft" style={{ flex: 1 }} onPress={onDecline} />
      </View>
    </View>
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
  const { agencies, leaveAgency, moveAgency, joinAgency } = useStore();
  const demo = useDemo();
  const unread = unreadCount(demo, agencies.map((a) => a.id));
  const [menuFor, setMenuFor] = useState<Agency | null>(null);
  const [noAccess, setNoAccess] = useState(false);
  const { notify, toast } = useToast();
  const revoked = membershipNotices.revoked;
  const pending = membershipNotices.pending;
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
          <View style={styles.headerActions}>
            <PressableScale accessibilityRole="button" accessibilityLabel="Messages" onPress={() => router.push('/messages')} style={styles.circle}>
              <Ionicons name="chatbubbles-outline" size={22} color={GRAY} />
            </PressableScale>
            <PressableScale accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={styles.circle}>
              <Avatar name={user.name} size={40} />
            </PressableScale>
          </View>
        </View>

        <Text style={styles.hello} accessibilityRole="header">
          Workspaces
        </Text>

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

        {demo.invitation === 'pending' && (
          <InvitationCard
            onAccept={() => {
              // Joining adds the organization's card to the list right away; the toast goes away by itself.
              const res = joinAgency(pending.code, 'Farmer');
              if (!res.ok && !res.error.startsWith('You are already')) return notify(res.error);
              demoActions.answerInvitation('accepted');
              notify(`You joined ${pending.short}`);
            }}
            onDecline={() => {
              demoActions.answerInvitation('declined');
              notify('Invitation declined');
            }}
          />
        )}
      </View>
  );

  // Access that was removed: kept at the bottom, greyed, so it is clear why it is not tappable like the others
  const footer = (
    <View style={{ paddingHorizontal: 15, marginTop: 12, gap: 10 }}>
      <Text style={styles.sectionLabel} accessibilityRole="header">
        No longer accessible
      </Text>
      <PressableScale scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${revoked.name}, access removed. Tap for details`} onPress={() => setNoAccess(true)} style={styles.locked}>
        <View style={styles.lockedLogo}>
          <Text style={styles.lockedLogoText}>{revoked.short}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.lockedTitle}>{revoked.name}</Text>
          <Text style={styles.lockedMeta}>Access removed · {revoked.when.replace('Revoked ', '')}</Text>
        </View>
        <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
      </PressableScale>
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
        ListFooterComponent={footer}
      />

      <BottomSheet visible={noAccess} onClose={() => setNoAccess(false)} title={revoked.name} subtitle="Access removed">
        <Text style={styles.sheetText}>
          This agency removed your access on May 28, 2025. Your past attendance and certificates stay saved on your account, but you can’t see its activities or message its members.
        </Text>
        <Button label="Contact the agency" size="lg" onPress={() => { setNoAccess(false); notify('Message sent to the agency (sample)'); }} />
        <Button label="Close" size="lg" variant="soft" onPress={() => setNoAccess(false)} />
      </BottomSheet>

      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 15, backgroundColor: '#FFFFFF' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  short: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', letterSpacing: 0.4, lineHeight: 16, marginBottom: 2, textAlign: 'left', alignSelf: 'flex-start' },
  agency: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 25, textAlign: 'left', alignSelf: 'flex-start', maxWidth: '68%' },
  meta: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, textAlign: 'left', alignSelf: 'flex-start', maxWidth: '85%' },
  empty: { textAlign: 'center', color: GRAY, marginTop: 32 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.muted, marginLeft: 4, marginTop: 4, marginBottom: 4 },
  invite: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, marginBottom: 16, borderWidth: 1.5, borderColor: colors.primarySoft, ...shadow },
  inviteHead: { flexDirection: 'row', gap: 14 },
  inviteLogo: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  inviteLogoText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  inviteKicker: { fontSize: 12, fontWeight: '600', color: colors.warn },
  inviteTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  inviteMeta: { fontSize: 14, color: colors.muted },
  joined: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successSoft, borderRadius: 14, padding: 14, marginBottom: 16 },
  joinedText: { flex: 1, fontSize: 15, color: colors.success },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 14, opacity: 0.9, ...shadow },
  lockedLogo: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  lockedLogoText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  lockedTitle: { fontSize: 16, fontWeight: '600', color: colors.muted },
  lockedMeta: { fontSize: 14, color: colors.danger },
  sheetText: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
