import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useBrand } from '@/components/Brand';
import { FeedbackSheet, ReentrySheet, useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Card, PressableScale, Segmented } from '@/components/ui';
import { Activity, activitiesOf, agencies as sampleAgencies } from '@/data/mock';
import { SampleSession } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { demoActions, pendingFeedback, useDemo } from '@/store/demo';
import { colors, radius } from '@/theme';

const TABS = ['Plans', 'Certificates'] as const;

/** Plans & certs: front end only. The buttons open sample forms and the status updates as you submit. */
export default function Plans() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const demo = useDemo();
  const { notify, toast } = useToast();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Plans');
  const [rating, setRating] = useState<{ activity: Activity; session: SampleSession } | null>(null);
  const [writing, setWriting] = useState<Activity | null>(null);
  const list = activitiesOf(agency.id).filter((a) => a.status !== 'Upcoming').slice(0, 3);

  const giveFeedback = (activity: Activity) => {
    const next = pendingFeedback(demo, activity.id)[0];
    if (next) setRating({ activity, session: next });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <Segmented options={TABS} value={tab} onChange={setTab} />

        <Text style={styles.meta}>
          {tab === 'Plans'
            ? `Reentry plans and feedback for your ${agency.short} activities.`
            : `Certificates are released by ${agency.short} once you meet the activity requirements.`}
        </Text>

        {list.length === 0 && <Text style={styles.empty}>Nothing here yet.</Text>}

        {list.map((a) => {
          const pending = pendingFeedback(demo, a.id).length;
          const plan = demo.reentry[a.id];
          return (
            <View key={a.id} style={{ gap: 8 }}>
              <View>
                <Text style={[styles.kicker, { color: brand.primary }]}>
                  {a.category} · {a.dates}
                </Text>
                <Text style={styles.title}>{a.title}</Text>
              </View>

              {tab === 'Plans' ? (
                <Card style={{ paddingVertical: 4 }}>
                  <PlanRow
                    label="Session feedback"
                    action={pending ? 'Give feedback' : 'Done'}
                    done={!pending}
                    onPress={() => giveFeedback(a)}
                  />
                  <View style={styles.divider} />
                  <PlanRow
                    label="Reentry plan"
                    action={plan ? (plan.status === 'submitted' ? 'View plan' : 'Continue draft') : 'Write plan'}
                    done={plan?.status === 'submitted'}
                    onPress={() => setWriting(a)}
                  />
                </Card>
              ) : (
                <CertCard
                  activity={a}
                  feedbackDone={!pending}
                  planDone={plan?.status === 'submitted'}
                  onFeedback={() => giveFeedback(a)}
                  onPlan={() => setWriting(a)}
                  onView={() =>
                    router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: agency.id, id: a.id } })
                  }
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <FeedbackSheet
        visible={rating !== null}
        onClose={() => setRating(null)}
        sessionTitle={rating?.session.title ?? ''}
        onSubmit={(r, c) => {
          if (rating) demoActions.submitFeedback(rating.activity.id, rating.session.id, r, c);
          notify('Feedback submitted. Thank you!');
        }}
      />
      <ReentrySheet
        visible={writing !== null}
        onClose={() => setWriting(null)}
        activityTitle={writing?.title ?? ''}
        existing={writing ? demo.reentry[writing.id] : undefined}
        onSave={(text, submit) => {
          if (writing) demoActions.saveReentry(writing.id, text, submit);
          notify(submit ? 'Reentry plan submitted' : 'Draft saved');
        }}
      />
      {toast}
    </View>
  );
}

function ActionButton({ label, done, onPress }: { label: string; done?: boolean; onPress: () => void }) {
  const brand = useBrand();
  return (
    <PressableScale
      accessibilityRole="button"
      disabled={label === 'Done'}
      onPress={onPress}
      style={[styles.smallBtn, { backgroundColor: done ? brand.soft : brand.primary }]}
    >
      <Text style={[styles.smallBtnText, done && { color: brand.dark }]}>{label}</Text>
    </PressableScale>
  );
}

function PlanRow({ label, action, done, onPress }: { label: string; action: string; done?: boolean; onPress: () => void }) {
  return (
    <View style={styles.planRow}>
      <Text style={styles.name}>{label}</Text>
      <ActionButton label={action} done={done} onPress={onPress} />
    </View>
  );
}

function Step({
  label,
  ok,
  note,
  action,
  onPress,
}: {
  label: string;
  ok?: boolean;
  note?: string;
  action?: string;
  onPress?: () => void;
}) {
  const brand = useBrand();
  return (
    <View style={styles.step}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ok ? brand.primary : colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{label}</Text>
        {note ? <Text style={styles.meta}>{note}</Text> : null}
      </View>
      {action && onPress ? <ActionButton label={action} onPress={onPress} /> : null}
    </View>
  );
}

function CertCard({
  activity,
  feedbackDone,
  planDone,
  onFeedback,
  onPlan,
  onView,
}: {
  activity: Activity;
  feedbackDone: boolean;
  planDone: boolean;
  onFeedback: () => void;
  onPlan: () => void;
  onView: () => void;
}) {
  const brand = useBrand();
  const done = activity.status === 'Completed';
  const all = done && feedbackDone && planDone;

  return (
    <Card style={{ gap: 10 }}>
      {done ? (
        <>
          <Step label="Attendance complete" ok />
          <Step label="Session feedback" ok={feedbackDone} action={feedbackDone ? undefined : 'Give feedback'} onPress={onFeedback} />
          <Step label="Reentry plan" ok={planDone} action={planDone ? undefined : 'Write plan'} onPress={onPlan} />
          <View style={[styles.note, { backgroundColor: brand.soft }]}>
            <Text style={[styles.noteText, { color: brand.dark }]}>
              {all ? 'All steps complete. Your certificate will be released soon.' : 'Finish the steps above to unlock your certificate'}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Step label="Attendance · 0 check-ins so far" />
          <Step label="Session feedback" ok={feedbackDone} />
          <Step label="Reentry plan" ok={planDone} note={planDone ? undefined : 'Available after the activity ends'} />
        </>
      )}
      <PressableScale accessibilityRole="button" onPress={onView} style={{ alignSelf: 'flex-start' }}>
        <Text style={[styles.link, { color: brand.primary }]}>View activity</Text>
      </PressableScale>
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 22 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  smallBtn: { minHeight: 32, paddingHorizontal: 12, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  note: { borderRadius: radius.sm, padding: 10 },
  noteText: { fontSize: 12, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
