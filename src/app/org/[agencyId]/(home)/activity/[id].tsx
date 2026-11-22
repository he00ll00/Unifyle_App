import { Ionicons } from '@expo/vector-icons';
import { Bookmark, BookmarkCheck, CalendarDays, Clock, Ellipsis, MapPin, Users } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { AttendanceTab, GoTo, MaterialsTab, OverviewTab, SessionFocus, SessionsTab, SubmissionsTab, TabName, UpdatesTab } from '@/components/ActivityTabs';
import { AuthField } from '@/components/auth';
import { useBrand } from '@/components/Brand';
import { BottomSheet } from '@/components/bits';
import { HeroArt } from '@/components/HeroArt';
import { CertificateView } from '@/components/CertificateView';
import { useSubmissionForms } from '@/components/forms';
import { useToast } from '@/components/sheets';
import { Button, PressableScale } from '@/components/ui';
import { activities, isRegistered } from '@/data/mock';
import { certificateRules, overviewOf } from '@/data/sample';
import { certificateStatus, demoActions, useDemo } from '@/store/demo';
import { colors, shadowTop } from '@/theme';

const TABS: TabName[] = ['Overview', 'Sessions', 'Materials', 'Attendance', 'Submissions', 'Updates'];

/** Activity workspace: front end only, with example info from the design. */
export default function ActivityWorkspace() {
  const { agencyId, id } = useLocalSearchParams<{ agencyId: string; id: string }>();
  const activity = activities.find((a) => a.id === id);
  const brand = useBrand();
  const demo = useDemo();
  const [tab, setTab] = useState<TabName>('Overview');
  const [focus, setFocus] = useState<SessionFocus | null>(null);
  const [materialsFor, setMaterialsFor] = useState('');
  const [options, setOptions] = useState(false);
  const [details, setDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [certificate, setCertificate] = useState(false);
  const { notify, toast } = useToast();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const forms = useSubmissionForms(activity ? [activity] : [], notify);
  const goTo: GoTo = (next, opts) => {
    setTab(next);
    setFocus(opts?.session ?? null);
    setMaterialsFor(opts?.materials ?? '');
  };

  if (!activity) return <Text style={styles.empty}>Activity not found.</Text>;

  const registered = isRegistered(activity, demo.joined);
  const cert = certificateStatus(demo, activity);
  const time = overviewOf(activity).schedule.time;
  const closeRegister = () => {
    setRegisterOpen(false);
    setCode('');
    setCodeError(undefined);
  };
  const register = () => {
    if (code.trim().toUpperCase() !== (activity.joinCode ?? '').toUpperCase()) {
      setCodeError('That code does not match this activity. Check it and try again.');
      return;
    }
    demoActions.joinActivity(activity.id);
    notify(`You are registered for ${activity.title}`);
    closeRegister();
  };

  // The one thing to do next, chosen from where the participant stands with this activity
  const primary: { label: string; run: () => void } = !registered
    ? { label: 'Register with activity code', run: () => setRegisterOpen(true) }
    : activity.status === 'Ongoing'
      ? { label: 'Scan QR to check in', run: () => router.navigate({ pathname: '/org/[agencyId]/checkin', params: { agencyId } }) }
      : activity.status === 'Completed'
        ? cert.state === 'Released'
          ? { label: 'View my certificate', run: () => setCertificate(true) }
          : { label: 'See what you still need', run: () => goTo('Submissions') }
        : { label: 'View the schedule', run: () => goTo('Sessions') };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: tab === 'Attendance' ? 130 : 28 }}>
        {/* 1. Where you stand with this activity, and the one thing to do next */}
        <View>
          <HeroArt height={176} variant="activity">
            <View style={styles.heroBar}>
              <View style={styles.badges}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{activity.status}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{registered ? 'Registered' : 'Not registered'}</Text>
                </View>
              </View>
              <View style={styles.heroRight}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={saved ? 'Remove from favorites' : 'Add to favorites'}
                  onPress={() => {
                    setSaved((v) => !v);
                    notify(saved ? 'Removed from favorites' : 'Added to favorites');
                  }}
                  style={styles.heroBtn}
                >
                  {saved ? <BookmarkCheck size={20} color="#fff" /> : <Bookmark size={20} color="#fff" />}
                </PressableScale>
                <PressableScale accessibilityRole="button" accessibilityLabel="Activity options" onPress={() => setOptions(true)} style={styles.heroBtn}>
                  <Ellipsis size={20} color="#fff" />
                </PressableScale>
              </View>
            </View>
          </HeroArt>

          {/* White, edge to edge, with only its top corners rounded: it rises over the band instead of floating as a card */}
          <View style={styles.sheet}>
            <View style={{ gap: 4 }}>
              <Text style={styles.sub}>{activity.category}</Text>
              <Text style={styles.title} accessibilityRole="header">
                {activity.title}
              </Text>
            </View>

            <View style={styles.facts}>
              {[
                [CalendarDays, activity.dates],
                [Clock, time],
                [MapPin, activity.venue],
                [Users, activity.capacity ? `${activity.capacity.taken} of ${activity.capacity.max} slots taken` : 'Open to registered participants'],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof CalendarDays;
                return (
                  <View key={i} style={styles.factRow}>
                    <I size={20} color={brand.primary} />
                    <Text style={styles.factText}>{text as string}</Text>
                  </View>
                );
              })}
            </View>

            <Button label={primary.label} size="lg" onPress={primary.run} />
          </View>
        </View>

        {/* 2. Tabs (they stay at the top while you scroll) */}
        <View style={styles.tabsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} accessibilityRole="tablist">
            {TABS.map((t) => (
              <PressableScale key={t} scaleTo={0.96} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => goTo(t)} style={styles.tab}>
                <Text style={[styles.tabText, tab === t && { color: brand.primary, fontWeight: '700' }]}>{t}</Text>
                <View style={[styles.tabLine, tab === t && { backgroundColor: brand.primary }]} />
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {/* 3. The chosen tab */}
        <View style={styles.content}>
          {tab === 'Overview' && <OverviewTab activity={activity} goTo={goTo} open={forms.open} />}
          {tab === 'Sessions' && <SessionsTab focus={focus} onFocus={setFocus} goTo={goTo} notify={notify} />}
          {tab === 'Materials' && <MaterialsTab notify={notify} session={materialsFor} />}
          {tab === 'Attendance' && <AttendanceTab title={activity.title} />}
          {tab === 'Submissions' && <SubmissionsTab activity={activity} open={forms.open} onCertificate={() => setCertificate(true)} />}
          {tab === 'Updates' && <UpdatesTab activity={activity} />}
        </View>
      </ScrollView>

      <BottomSheet visible={registerOpen} onClose={closeRegister} title="Register" subtitle={activity.title}>
        <View style={{ gap: 16 }}>
          <Text style={styles.sheetText}>Type the activity code your agency gave you. It confirms that you are invited to this activity.</Text>
          <AuthField label="Activity code" value={code} onChangeText={(v) => { setCode(v); setCodeError(undefined); }} error={codeError} placeholder="e.g. PRRI-2025-A" autoCapitalize="characters" autoCorrect={false} returnKeyType="done" onSubmitEditing={register} />
          <Button label="Register" size="lg" onPress={register} />
        </View>
      </BottomSheet>

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
          ['Registration', isRegistered(activity, demo.joined) ? 'Registered' : 'Not registered'],
          ['Capacity', activity.capacity ? `${activity.capacity.taken} of ${activity.capacity.max} slots taken` : '42 of 50 slots taken'],
          ['Activity type', activity.category],
          ['Status', activity.status],
          ['Min. attendance', `${certificateRules.minAttendance}% of check points`],
          ['Required for certificate', ['Feedback', 'Reentry plan', 'Output'].filter((_, i) => [certificateRules.requireFeedback, certificateRules.requireReentry, certificateRules.requireOutput][i]).join(', ')],
          ['Certificate release', certificateRules.release],
        ].map(([k, v]) => (
          <View key={k} style={styles.detailRow}>
            <Text style={styles.meta}>{k}</Text>
            <Text style={styles.detailValue}>{v}</Text>
          </View>
        ))}
        <Button label="Close" variant="soft" onPress={() => setDetails(false)} />
      </BottomSheet>

      <CertificateView
        activity={certificate ? activity : null}
        onClose={() => setCertificate(false)}
        onDownload={() => {
          setCertificate(false);
          notify('Certificate saved to your device (sample)');
        }}
      />
      {forms.node}
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32, color: colors.text, letterSpacing: -0.3 },
  meta: { fontSize: 12, color: colors.muted },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroBar: { position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  tag: { minHeight: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  sheet: { backgroundColor: '#fff', marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 18 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 },
  sub: { fontSize: 15, fontWeight: '500', color: colors.muted },
  facts: { gap: 14 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  factText: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.text },
  tabsBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: 12, gap: 6 },
  tab: { paddingHorizontal: 10, paddingTop: 14, minHeight: 50, alignItems: 'center' },
  tabText: { fontSize: 16, fontWeight: '500', color: colors.muted, paddingBottom: 10 },
  tabLine: { height: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },
  sheetText: { fontSize: 15, lineHeight: 22, color: colors.muted },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 14, gap: 6, backgroundColor: '#fff', ...shadowTop },
  stickyText: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  optIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
