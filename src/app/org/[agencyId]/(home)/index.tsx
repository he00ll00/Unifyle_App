import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { ActivityCard } from '@/components/cards';
import { Text } from '@/components/Text';
import { Button, Chip, PressableScale } from '@/components/ui';
import { Activity, activitiesOf, agencies as sampleAgencies, isRegistered } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { useDemo } from '@/store/demo';
import { colors } from '@/theme';

const FILTERS = ['All', 'Ongoing', 'Upcoming', 'Completed'] as const;

/**
 * My activities: only the activities you are registered for, with the one to open next on top.
 * Browsing and registering for others happens on the agency page.
 */
export default function MyActivities() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const demo = useDemo();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const mine = activitiesOf(agency.id).filter((a) => isRegistered(a, demo.joined));
  const data = mine.filter((a) => filter === 'All' || a.status === filter);
  const next: Activity | undefined = mine.find((a) => a.status === 'Ongoing') ?? mine.find((a) => a.status === 'Upcoming');

  const open = (a: Activity) => router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: agency.id, id: a.id } });
  const browse = () => router.navigate({ pathname: '/org/[agencyId]/org-profile', params: { agencyId: agency.id } });

  const header = (
    <View>
      <View style={[s.topBar, { paddingTop: insets.top }]}>
        <View style={s.topRow}>
          <PressableScale accessibilityRole="button" accessibilityLabel="Back to workspaces" onPress={() => router.replace('/workspaces')} style={s.back} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </PressableScale>
          <Text style={s.topTitle} accessibilityRole="header">
            My activities
          </Text>
          <View style={s.back} />
        </View>
      </View>

      {next ? (
        <PressableScale scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`Next: ${next.title}`} onPress={() => open(next)} style={[s.next, { backgroundColor: brand.primary }]}>
          <Text style={s.nextKicker}>{next.status === 'Ongoing' ? 'HAPPENING NOW' : 'UP NEXT'}</Text>
          <Text style={s.nextTitle}>{next.title}</Text>
          <View style={s.nextLine}>
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={s.nextMeta}>{next.dates}</Text>
          </View>
          <View style={s.nextLine}>
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={s.nextMeta}>{next.venue}</Text>
          </View>
          <View style={s.nextFoot}>
            <Text style={s.nextProgress}>{next.progress}</Text>
            <View style={s.nextBtn}>
              <Text style={[s.nextBtnText, { color: brand.primary }]}>Open</Text>
            </View>
          </View>
        </PressableScale>
      ) : null}

      {mine.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chips}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={data}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 28 }}
      ListEmptyComponent={
        mine.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: brand.soft }]}>
              <Ionicons name="calendar-outline" size={30} color={brand.primary} />
            </View>
            <Text style={s.emptyTitle}>No activities yet</Text>
            <Text style={s.emptyText}>Activities you register for appear here. Find one on {agency.short}’s page.</Text>
            <Button label="Browse activities" size="lg" onPress={browse} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </View>
        ) : (
          <Text style={s.emptyText}>No {filter.toLowerCase()} activities.</Text>
        )
      }
      renderItem={({ item }) => <ActivityCard activity={item} footerText={item.progress} onPress={() => open(item)} />}
    />
  );
}

const s = StyleSheet.create({
  topBar: { backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  topRow: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  back: { width: 32, height: 40, justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  next: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 18, gap: 8 },
  nextKicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.85)' },
  nextTitle: { fontSize: 20, fontWeight: '700', lineHeight: 26, color: '#fff' },
  nextLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextMeta: { flex: 1, fontSize: 14, color: '#fff' },
  nextFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  nextProgress: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  nextBtn: { minHeight: 40, paddingHorizontal: 22, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontSize: 15, fontWeight: '700' },
  // Padding gives the chips' shadow room inside the clipping scroll view; the negative margin gives the space back.
  chipsScroll: { marginVertical: -6 },
  chips: { gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingTop: 56 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
