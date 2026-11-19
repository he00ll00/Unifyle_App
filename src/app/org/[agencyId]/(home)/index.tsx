import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { Text } from '@/components/Text';
import { Chip, PressableScale } from '@/components/ui';
import { activitiesOf, ActivityStatus, agencies as sampleAgencies } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { colors, shadow } from '@/theme';

const FILTERS = ['All', 'Ongoing', 'Upcoming', 'Completed'] as const;

// "Ongoing" is the blue pill from the design; the other statuses follow the same shape.
const STATUS_PILL: Record<ActivityStatus, { bg: string; fg: string }> = {
  Ongoing: { bg: colors.infoSoft, fg: colors.info },
  Upcoming: { bg: colors.warnSoft, fg: colors.warn },
  Completed: { bg: colors.successSoft, fg: colors.success },
};

/** Dashboard: the organization's activities (white header, filter chips, activity cards). */
export default function Dashboard() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const data = activitiesOf(agency.id).filter((a) => filter === 'All' || a.status === filter);

  // The header and chips are the top of the list, so they scroll away with the cards.
  const header = (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back to workspaces"
            onPress={() => router.replace('/workspaces')}
            style={styles.back}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.topTitle}>{agency.short} Activities</Text>
          <View style={styles.back} />
        </View>
      </View>

      {/* Padding gives the chips' shadow room inside the clipping scroll view. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={data}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 24 }}
      ListEmptyComponent={<Text style={styles.empty}>No {filter.toLowerCase()} activities.</Text>}
      renderItem={({ item }) => {
        const pill = STATUS_PILL[item.status];
        return (
          <PressableScale
            scaleTo={0.98}
            style={styles.cardWrap}
            onPress={() =>
              router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: agency.id, id: item.id } })
            }
          >
            <View style={styles.card}>
              <View style={styles.clip}>
                <LinearGradient
                  colors={[brand.soft, brand.mid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.banner}
                >
                  <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.pillText, { color: pill.fg }]}>{item.status}</Text>
                  </View>
                </LinearGradient>

                <View style={styles.body}>
                  <Text style={[styles.category, { color: brand.primary }]}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.line}>
                    <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                    <Text style={styles.meta}>{item.dates}</Text>
                  </View>
                  <View style={styles.line}>
                    <Ionicons name="location-outline" size={16} color={colors.muted} />
                    <Text style={styles.meta}>{item.venue}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.footer}>
                    <Text style={[styles.progress, { color: brand.primary }]}>{item.progress}</Text>
                    <Ionicons name="chevron-forward" size={18} color={brand.primary} />
                  </View>
                </View>
              </View>
            </View>
          </PressableScale>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  topBar: { backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  topBarRow: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  back: { width: 32, height: 40, justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  // The scroll view clips to its bounds, so the chips' shadow needs padding room;
  // the negative margin gives that space back so the spacing matches the design.
  chipsScroll: { flexGrow: 0, marginBottom: -4 },
  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  cardWrap: { marginHorizontal: 20, marginBottom: 38 },
  card: { borderRadius: 12, backgroundColor: '#FFFFFF', ...shadow, shadowOpacity: 0.12 },
  clip: { borderRadius: 12, overflow: 'hidden' },
  banner: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 10 },
  pill: { paddingHorizontal: 14, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 13, fontWeight: '700' },
  body: { paddingHorizontal: 15, paddingTop: 16, paddingBottom: 16, gap: 9 },
  category: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontSize: 16, fontWeight: '500', color: colors.text, lineHeight: 20, marginBottom: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  progress: { fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
