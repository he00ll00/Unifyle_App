import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { DateBlock } from '@/components/bits';
import { PressableScale } from '@/components/ui';
import { activitiesOf, agencies as sampleAgencies, dateParts } from '@/data/mock';
import { orgAbout } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { colors, radius, shadow } from '@/theme';

const TABS = ['Activities', 'About'] as const;

// Example registration line per activity status, as in the design.
const REGISTRATION = {
  Ongoing: { label: 'Registered', open: false },
  Completed: { label: 'Registered', open: false },
  Upcoming: { label: 'Registration open · 9 slots left', open: true },
} as const;

// Design order: ongoing first, then completed, then upcoming (ties keep their listed order).
const RANK = { Ongoing: 0, Completed: 1, Upcoming: 2 } as const;

/** Organization page: branded header with subscribe, then Activities / About. */
export default function OrgPage() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Activities');
  const [subscribed, setSubscribed] = useState(true);
  const data = [...activitiesOf(agency.id)].sort((a, b) => RANK[a.status] - RANK[b.status]);

  const header = (
    <View>
      <LinearGradient
        colors={[brand.primary, brand.light]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.topRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back to workspaces"
            onPress={() => router.replace('/workspaces')}
            style={styles.circle}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </PressableScale>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            <Text style={styles.name}>{agency.name}</Text>
            <Text style={styles.handle}>
              @{agency.short.toLowerCase()} · {orgAbout.type}
            </Text>
            <Text style={styles.handle}>{orgAbout.subscribers}</Text>
          </View>

          {/* The organization's logo, large, directly above the subscribe button. */}
          <View style={styles.logoCol}>
            <View style={styles.badgeRing} accessible accessibilityLabel={`${agency.name} logo`}>
              <View style={[styles.badge, { backgroundColor: agency.logoColor ?? brand.dark }]}>
                <Text style={styles.badgeText} numberOfLines={1} adjustsFontSizeToFit>
                  {agency.short}
                </Text>
              </View>
            </View>
            <PressableScale
              accessibilityRole="button"
              onPress={() => setSubscribed((s) => !s)}
              style={[styles.subBtn, subscribed ? styles.subBtnOn : styles.subBtnOff]}
            >
              <Text style={[styles.subText, { color: subscribed ? brand.dark : '#fff' }]}>
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <PressableScale key={t} scaleTo={0.96} onPress={() => setTab(t)} style={styles.tab}>
            <Text style={[styles.tabText, tab === t && { color: brand.primary, fontWeight: '700' }]}>{t}</Text>
            <View style={[styles.tabLine, tab === t && { backgroundColor: brand.primary }]} />
          </PressableScale>
        ))}
      </View>

      {tab === 'Activities' && (
        <PressableScale
          scaleTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Search and filter all activities"
          onPress={() => router.navigate({ pathname: '/org/[agencyId]', params: { agencyId: agency.id } })}
          style={styles.search}
        >
          <Ionicons name="search" size={16} color={colors.muted} />
          <Text style={styles.searchText}>Search and filter all activities</Text>
          <Ionicons name="options-outline" size={16} color={colors.muted} />
        </PressableScale>
      )}
    </View>
  );

  if (tab === 'About') {
    return (
      <FlatList
        style={{ flex: 1, backgroundColor: colors.bg }}
        data={orgAbout.facts}
        keyExtractor={(f) => f[0]}
        ListHeaderComponent={
          <View>
            {header}
            <Text style={styles.about}>{orgAbout.description}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.fact}>
            <Text style={styles.factLabel}>{item[0]}</Text>
            <Text style={styles.factValue}>{item[1]}</Text>
          </View>
        )}
      />
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={data}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 24 }}
      ListEmptyComponent={<Text style={styles.empty}>No activities yet.</Text>}
      renderItem={({ item, index }) => {
        const date = dateParts(item);
        const reg = REGISTRATION[item.status];
        const first = index === 0;
        const last = index === data.length - 1;
        return (
          <PressableScale
            scaleTo={0.98}
            style={[styles.row, first && styles.rowFirst, last && styles.rowLast]}
            onPress={() => router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: agency.id, id: item.id } })}
          >
            <DateBlock month={date.month} day={date.day} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={[styles.reg, { color: reg.open ? colors.info : brand.primary }]}>{reg.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </PressableScale>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  infoText: { flex: 1, paddingBottom: 4 },
  logoCol: { alignItems: 'center', gap: 12 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  badgeRing: {
    width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  badgeText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 26 },
  handle: { color: '#fff', opacity: 0.95, fontSize: 12, marginTop: 4 },
  subBtn: { minHeight: 34, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  subBtnOn: { backgroundColor: '#fff' },
  subBtnOff: { backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 1, borderColor: '#fff' },
  subText: { fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 22, paddingHorizontal: 18, marginTop: 6 },
  tab: { paddingTop: 12, alignItems: 'center' },
  tabText: { fontSize: 14, color: colors.muted, paddingBottom: 8 },
  tabLine: { height: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: 'transparent' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, marginBottom: 12,
    minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 14, backgroundColor: '#fff', ...shadow,
  },
  searchText: { flex: 1, fontSize: 14, color: colors.muted },
  // The activity list reads as one white card with hairline dividers.
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  rowFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderTopWidth: 0 },
  rowLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  title: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 19 },
  reg: { fontSize: 12, fontWeight: '600' },
  about: { fontSize: 14, lineHeight: 20, color: colors.muted, padding: 16 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  factLabel: { fontSize: 14, color: colors.muted },
  factValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
