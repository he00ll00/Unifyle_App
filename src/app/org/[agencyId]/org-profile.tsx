import { Ionicons } from '@expo/vector-icons';
import { Bell, BellRing, ChevronLeft, Landmark, MapPin, Share2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@/components/auth';
import { BottomSheet } from '@/components/bits';
import { useBrand } from '@/components/Brand';
import { FullscreenImage } from '@/components/FullscreenImage';
import { HeroArt } from '@/components/HeroArt';
import { ActivityCard } from '@/components/cards';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Button, PressableScale } from '@/components/ui';
import { Activity, activitiesOf, agencies as sampleAgencies, isRegistered } from '@/data/mock';
import { orgContact, orgStats } from '@/data/extras';
import { membershipExtras, orgAbout } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { demoActions, useDemo } from '@/store/demo';
import { colors, shadow } from '@/theme';

const TABS = ['Activities', 'About', 'Contact'] as const;
const FILTERS = ['Upcoming', 'Past', 'All'] as const;

// Ongoing first, then upcoming, then completed
const RANK = { Ongoing: 0, Upcoming: 1, Completed: 2 } as const;

/** The line at the bottom of an activity card: where the participant stands with it. */
function footerOf(a: Activity, joined: Record<string, true>) {
  if (isRegistered(a, joined)) return { text: a.status === 'Completed' ? 'Completed · you took part' : 'You are registered', action: undefined };
  const left = a.capacity ? a.capacity.max - a.capacity.taken : 9;
  return left > 0 ? { text: `${left} slots left`, action: 'Register' } : { text: 'Registration full', action: undefined };
}

/**
 * The agency's page, laid out like the public page on the web: banner and logo, name and handle, Subscribe
 * and Share, three numbers, then Activities / About / Contact. This is where you browse and register.
 */
export default function OrgPage() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const demo = useDemo();
  const insets = useSafeAreaInsets();
  const { notify, toast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Activities');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Upcoming');
  const [subscribed, setSubscribed] = useState(true);
  const [viewer, setViewer] = useState<'logo' | 'cover' | null>(null);
  const [registering, setRegistering] = useState<Activity | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();

  const all = [...activitiesOf(agency.id)].sort((a, b) => RANK[a.status] - RANK[b.status]);
  const data = all.filter((a) => (filter === 'All' ? true : filter === 'Past' ? a.status === 'Completed' : a.status !== 'Completed'));
  const contact = orgContact(agency.id);
  const handle = `@${agency.short.toLowerCase()}`;

  const open = (a: Activity) => router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: agency.id, id: a.id } });
  const share = async () => {
    try {
      await Share.share({ message: `${agency.name} on UniFyle: https://unifyle.app/a/${agency.short.toLowerCase()}` });
    } catch {
      notify('Could not open sharing');
    }
  };
  const closeRegister = () => {
    setRegistering(null);
    setCode('');
    setCodeError(undefined);
  };
  const register = () => {
    if (!registering) return;
    if (code.trim().toUpperCase() !== (registering.joinCode ?? '').toUpperCase()) {
      setCodeError('That code does not match this activity. Check it and try again.');
      return;
    }
    demoActions.joinActivity(registering.id);
    notify(`You are registered for ${registering.title}`);
    closeRegister();
  };

  const header = (
    <View>
      {/* Band: the agency's colour with a quiet drawing. Back on the left, share on the right. */}
      <HeroArt height={150 + insets.top} variant="agency">
        {/* Tapping the band opens it full screen. It sits under the back and share buttons, not around them. */}
        <Pressable accessibilityRole="imagebutton" accessibilityLabel="View cover photo" onPress={() => setViewer('cover')} style={StyleSheet.absoluteFill} />
        <View style={[s.heroBar, { top: insets.top + 8 }]} pointerEvents="box-none">
          <PressableScale accessibilityRole="button" accessibilityLabel="Back to workspaces" onPress={() => router.replace('/workspaces')} style={s.heroBtn}>
            <ChevronLeft size={22} color="#fff" />
          </PressableScale>
          <View style={s.heroActions} pointerEvents="box-none">
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Open ${agency.short} group chat`}
              onPress={() => router.push({ pathname: '/messages/[agencyId]', params: { agencyId: agency.id } })}
              style={s.heroBtn}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
            </PressableScale>
            <PressableScale accessibilityRole="button" accessibilityLabel="Share this agency" onPress={share} style={s.heroBtn}>
              <Share2 size={19} color="#fff" />
            </PressableScale>
          </View>
        </View>
      </HeroArt>

      {/* Who they are. Edge to edge and left-aligned, like the public page on the web: the logo sits on the left. */}
      <View style={s.sheet}>
        <View style={s.idRow}>
          <PressableScale scaleTo={0.96} accessibilityRole="imagebutton" accessibilityLabel={`${agency.name} logo, open full screen`} onPress={() => setViewer('logo')} style={s.logoRing}>
            <View style={[s.logo, { backgroundColor: agency.logoColor ?? brand.dark }]}>
              <Text style={s.logoText} numberOfLines={1} adjustsFontSizeToFit>
                {agency.short}
              </Text>
            </View>
          </PressableScale>
          <PressableScale accessibilityRole="button" accessibilityState={{ selected: subscribed }} scaleTo={0.96} onPress={() => setSubscribed((v) => !v)} style={[s.sub, subscribed ? s.subOn : { backgroundColor: brand.primary }]}>
            {subscribed ? <BellRing size={18} color={brand.primary} /> : <Bell size={18} color="#fff" />}
            <Text style={[s.subText, { color: subscribed ? brand.primary : '#fff' }]}>{subscribed ? 'Subscribed' : 'Subscribe'}</Text>
          </PressableScale>
        </View>

        <Text style={[s.name, { color: brand.dark }]} accessibilityRole="header">
          {agency.name}
        </Text>
        <Text style={s.handle}>{handle}</Text>
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Landmark size={16} color={colors.muted} />
            <Text style={s.metaText}>{orgAbout.type}</Text>
          </View>
          <View style={s.metaItem}>
            <MapPin size={16} color={colors.muted} />
            <Text style={s.metaText}>{agency.region}</Text>
          </View>
        </View>
      </View>

      {/* Three numbers, divided by thin lines */}
      <View style={s.stats}>
        {[
          [orgStats.subscribers, 'Subscribers'],
          [String(all.length), 'Activities'],
          [orgStats.participantsReached, 'Participants reached'],
        ].map(([v, k], i) => (
          <View key={k} style={[s.stat, i > 0 && s.statLine]}>
            <Text style={s.statValue}>{v}</Text>
            <Text style={s.statLabel}>{k}</Text>
          </View>
        ))}
      </View>

      {/* Pills, left-aligned */}
      <View style={s.tabs} accessibilityRole="tablist">
        {TABS.map((t) => (
          <PressableScale key={t} scaleTo={0.96} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={[s.tab, tab === t && { backgroundColor: brand.primary, borderColor: brand.primary }]}>
            <Text style={[s.tabText, tab === t && { color: '#fff', fontWeight: '600' }]}>{t}</Text>
          </PressableScale>
        ))}
      </View>

      {tab === 'Activities' && (
        <View style={s.filters}>
          <View style={s.seg}>
            {FILTERS.map((f) => (
              <PressableScale key={f} scaleTo={0.95} accessibilityRole="button" accessibilityState={{ selected: filter === f }} onPress={() => setFilter(f)} style={[s.segItem, filter === f && s.segOn]}>
                <Text style={[s.segText, filter === f && { color: colors.text, fontWeight: '600' }]}>{f}</Text>
              </PressableScale>
            ))}
          </View>
          <Text style={s.found}>
            {data.length} {data.length === 1 ? 'activity' : 'activities'}
          </Text>
        </View>
      )}
    </View>
  );

  const sheet = (
    <BottomSheet visible={registering !== null} onClose={closeRegister} title="Register" subtitle={registering?.title}>
      <View style={{ gap: 16 }}>
        <AuthField label="Activity code" value={code} onChangeText={(v) => { setCode(v); setCodeError(undefined); }} error={codeError} placeholder="e.g. PRRI-2025-A" autoCapitalize="characters" autoCorrect={false} returnKeyType="done" onSubmitEditing={register} />
        <Button label="Register" size="lg" onPress={register} />
      </View>
    </BottomSheet>
  );

  if (tab !== 'Activities') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <FlatList
          data={[]}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => null}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListFooterComponent={
            tab === 'About' ? (
              <View style={{ gap: 14, padding: 16 }}>
                <View style={s.box}>
                  <Text style={[s.boxTitle, { color: brand.dark }]}>About</Text>
                  <Text style={s.about}>{orgAbout.description}</Text>
                </View>
                <View style={s.box}>
                  <Text style={[s.boxTitle, { color: brand.dark }]}>Organization details</Text>
                  {orgAbout.facts.map(([k, v]) => (
                    <View key={k} style={s.kv}>
                      <Text style={s.k}>{k}</Text>
                      <Text style={s.v}>{v}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.box}>
                  <Text style={[s.boxTitle, { color: brand.dark }]}>My membership</Text>
                  {[
                    ['Role', agency.role],
                    ['Category', agency.category ?? 'Farmer'],
                    ['Affiliation', membershipExtras.affiliation],
                    ['Status', membershipExtras.status],
                    ['Joined', agency.memberSince || 'Today'],
                  ].map(([k, v]) => (
                    <View key={k} style={s.kv}>
                      <Text style={s.k}>{k}</Text>
                      <Text style={[s.v, k === 'Status' && { color: colors.success }]}>{v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <View style={s.box}>
                  <Text style={[s.boxTitle, { color: brand.dark }]}>Get in touch</Text>
                  {[
                    { icon: 'mail-outline' as const, label: 'Email', value: contact.email, url: `mailto:${contact.email}` },
                    { icon: 'globe-outline' as const, label: 'Website', value: contact.website, url: `https://${contact.website}` },
                    { icon: 'location-outline' as const, label: 'Address', value: contact.address, url: `https://maps.google.com/?q=${encodeURIComponent(contact.address)}` },
                    { icon: 'time-outline' as const, label: 'Office hours', value: contact.hours, url: undefined },
                  ].map((r) => (
                    <PressableScale key={r.label} scaleTo={0.99} accessibilityRole={r.url ? 'link' : 'text'} disabled={!r.url} onPress={() => r.url && Linking.openURL(r.url).catch(() => notify('Could not open this link'))} style={s.contactRow}>
                      <View style={[s.contactIcon, { backgroundColor: brand.soft }]}>
                        <Ionicons name={r.icon} size={20} color={brand.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.k}>{r.label}</Text>
                        <Text style={s.v2}>{r.value}</Text>
                      </View>
                      {r.url ? <Ionicons name="open-outline" size={18} color={colors.icon} /> : null}
                    </PressableScale>
                  ))}
                  <Text style={s.sampleNote}>Sample contact details for this preview.</Text>
                </View>
              </View>
            )
          }
        />
        <FullscreenImage kind={viewer} agency={agency} onClose={() => setViewer(null)} />
        {toast}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Text style={s.empty}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}activities.</Text>}
        renderItem={({ item }) => {
          const f = footerOf(item, demo.joined);
          return <ActivityCard activity={item} footerText={f.text} action={f.action} onPress={() => open(item)} onAction={() => setRegistering(item)} />;
        }}
      />
      {sheet}
      <FullscreenImage kind={viewer} agency={agency} onClose={() => setViewer(null)} />
      {toast}
    </View>
  );
}

const s = StyleSheet.create({
  heroBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sheet: { backgroundColor: '#fff', marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 18, gap: 4 },
  idRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 10 },
  logoRing: { width: 92, height: 92, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  logo: { width: 82, height: 82, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
  subOn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border },
  subText: { fontSize: 15, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '700', lineHeight: 30, color: colors.text, letterSpacing: -0.3 },
  handle: { fontSize: 15, color: colors.muted },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: colors.muted },
  stats: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statLine: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '600', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { minHeight: 42, paddingHorizontal: 20, borderRadius: 21, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 15, color: colors.text },
  filters: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  seg: { flexDirection: 'row', backgroundColor: '#E9EDF5', borderRadius: 999, padding: 3 },
  segItem: { minHeight: 36, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: '#fff' },
  segText: { fontSize: 14, color: colors.muted },
  found: { fontSize: 14, color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32, fontSize: 15 },
  box: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, ...shadow },
  boxTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  about: { fontSize: 15, lineHeight: 23, color: colors.muted },
  kv: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  k: { fontSize: 14, color: colors.muted },
  v: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'right' },
  v2: { fontSize: 16, color: colors.text },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingTop: 8 },
  contactIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sampleNote: { fontSize: 13, color: colors.icon, marginTop: 4 },
  sheetText: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
