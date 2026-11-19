import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { AttendanceTab, GoTo, MaterialsTab, OverviewTab, SessionsTab, SubKey, SubmissionsTab, TabName } from '@/components/ActivityTabs';
import { useBrand } from '@/components/Brand';
import { BottomSheet, StatusPill } from '@/components/bits';
import { useToast } from '@/components/sheets';
import { Button, PressableScale } from '@/components/ui';
import { activities } from '@/data/mock';
import { colors, radius, shadow, shadowTop } from '@/theme';

const TABS: TabName[] = ['Overview', 'Sessions', 'Materials', 'Attendance', 'Submissions'];

/** Activity workspace: front end only, with example info from the design. */
export default function ActivityWorkspace() {
  const { agencyId, id } = useLocalSearchParams<{ agencyId: string; id: string }>();
  const activity = activities.find((a) => a.id === id);
  const brand = useBrand();
  const [tab, setTab] = useState<TabName>('Overview');
  const [sub, setSub] = useState<SubKey>('feedback');
  const [options, setOptions] = useState(false);
  const [details, setDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const { notify, toast } = useToast();
  const goTo: GoTo = (next, nextSub) => {
    setTab(next);
    if (nextSub) setSub(nextSub);
  };

  if (!activity) return <Text style={styles.empty}>Activity not found.</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: tab === 'Attendance' ? 130 : 28 }}>
        <View style={[styles.hero, { backgroundColor: brand.soft }]}>
          <View style={styles.heroTop}>
            <Text style={[styles.kicker, { color: brand.primary }]}>Registered Participant</Text>
            {/* Status, favorite and options sit inside the activity card itself. */}
            <View style={styles.heroRight}>
              <StatusPill label={activity.status} tone="info" />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Remove from favorites' : 'Add to favorites'}
                onPress={() => {
                  setSaved((v) => !v);
                  notify(saved ? 'Removed from favorites' : 'Added to favorites');
                }}
                style={styles.iconBtn}
              >
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? brand.primary : colors.text} />
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Activity options"
                onPress={() => setOptions(true)}
                style={styles.iconBtn}
              >
                <Ionicons name="ellipsis-horizontal" size={19} color={colors.text} />
              </PressableScale>
            </View>
          </View>
          <Text style={[styles.title, { color: brand.primary }]}>{activity.title}</Text>
          <Text style={styles.meta}>
            {activity.dates} · {activity.progress.replace('Happening now · ', '')}
          </Text>
          <View style={styles.venue}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text style={styles.meta}>{activity.venue}</Text>
          </View>
        </View>

        {/* Shadow lives on the outer view; the inner scroller clips its own content. */}
        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {TABS.map((t) => (
              <PressableScale
                key={t}
                scaleTo={0.94}
                onPress={() => setTab(t)}
                style={[styles.tab, tab === t && { backgroundColor: brand.primary }]}
              >
                <Text style={[styles.tabText, tab === t && { color: '#fff' }]}>{t}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {tab === 'Overview' && <OverviewTab activity={activity} goTo={goTo} />}
        {tab === 'Sessions' && <SessionsTab activityId={activity.id} goTo={goTo} notify={notify} />}
        {tab === 'Materials' && <MaterialsTab notify={notify} />}
        {tab === 'Attendance' && <AttendanceTab title={activity.title} />}
        {tab === 'Submissions' && (
          <SubmissionsTab activityId={activity.id} activityTitle={activity.title} sub={sub} onSub={setSub} notify={notify} />
        )}
      </ScrollView>

      {tab === 'Attendance' && (
        <View style={styles.sticky}>
          <Button label="Scan QR Code" onPress={() => router.navigate({ pathname: '/org/[agencyId]/checkin', params: { agencyId } })} />
          <Text style={styles.stickyText}>Scan the QR code displayed at the training hall entrance.</Text>
        </View>
      )}

      <BottomSheet visible={options} onClose={() => setOptions(false)} title="Activity options">
        <PressableScale
          scaleTo={0.98}
          style={styles.opt}
          onPress={() => {
            setOptions(false);
            setDetails(true);
          }}
        >
          <View style={[styles.optIcon, { backgroundColor: brand.soft }]}>
            <Ionicons name="information-circle-outline" size={20} color={brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optTitle}>Full activity details</Text>
            <Text style={styles.meta}>Registration info and capacity</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </PressableScale>
        <PressableScale
          scaleTo={0.98}
          style={styles.opt}
          onPress={() => {
            setOptions(false);
            notify('Activity link copied (sample)');
          }}
        >
          <View style={[styles.optIcon, { backgroundColor: brand.soft }]}>
            <Ionicons name="link-outline" size={20} color={brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optTitle}>Copy activity link</Text>
            <Text style={styles.meta}>Demo action · nothing is copied</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </PressableScale>
      </BottomSheet>

      <BottomSheet visible={details} onClose={() => setDetails(false)} title="Full activity details" subtitle={activity.title}>
        {[
          ['Registration', 'Confirmed'],
          ['Registered on', 'June 2, 2025'],
          ['Capacity', '41 of 50 slots taken'],
          ['Registration closed', 'June 16, 2025'],
          ['Certificate rules', '4 of 6 check-ins, all feedback, reentry plan'],
        ].map(([k, v]) => (
          <View key={k} style={styles.detailRow}>
            <Text style={styles.meta}>{k}</Text>
            <Text style={styles.detailValue}>{v}</Text>
          </View>
        ))}
        <Button label="Close" variant="soft" onPress={() => setDetails(false)} />
      </BottomSheet>

      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.md, padding: 14, gap: 6 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  meta: { fontSize: 12, color: colors.muted },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabsWrap: { borderRadius: radius.md, backgroundColor: '#fff', ...shadow },
  tabs: { padding: 4, gap: 4 },
  tab: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 14, gap: 6, backgroundColor: '#fff', ...shadowTop },
  stickyText: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  optIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
