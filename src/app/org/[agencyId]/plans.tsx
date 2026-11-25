import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useBrand } from '@/components/Brand';
import { ChecklistRows, FormOpener, useSubmissionForms } from '@/components/forms';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Button, Card, PressableScale, Segmented } from '@/components/ui';
import { Activity, activitiesOf, agencies as sampleAgencies } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { certificateStatus, CertificateState, useDemo } from '@/store/demo';
import { StatusPill } from '@/components/bits';
import { CertificateView } from '@/components/CertificateView';
import { colors, radius } from '@/theme';

const TABS = ['Plans', 'Certificates'] as const;

/** Plans & certs: front end only. The buttons open sample forms and the status updates as you submit. */
export default function Plans() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const { notify, toast } = useToast();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Plans');
  const [viewing, setViewing] = useState<Activity | null>(null);
  const list = activitiesOf(agency.id).filter((a) => a.status !== 'Upcoming').slice(0, 3);
  // The forms (and their activity dropdown) only offer activities that are completed.
  const { open, node } = useSubmissionForms(list.filter((a) => a.status === 'Completed'), notify);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <Segmented options={TABS} value={tab} onChange={setTab} />

        {list.length === 0 && <Text style={styles.empty}>Nothing here yet</Text>}

        {list.map((a) => {
          return (
            <View key={a.id} style={{ gap: 8 }}>
              <View>
                <Text style={[styles.kicker, { color: brand.primary }]}>
                  {a.category} · {a.dates}
                </Text>
                <Text style={[styles.title, { color: brand.dark }]}>{a.title}</Text>
              </View>

              {tab === 'Plans' ? (
                <Card style={{ paddingVertical: 4 }}>
                  <ChecklistRows activity={a} open={open} locked={a.status !== 'Completed'} />
                </Card>
              ) : (
                <CertCard
                  activity={a}
                  open={open}
                  onCertificate={() => setViewing(a)}
                  onView={() =>
                    router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: agency.id, id: a.id } })
                  }
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <CertificateView
        activity={viewing}
        onClose={() => setViewing(null)}
        onDownload={() => {
          setViewing(null);
          notify('Certificate saved to your device (sample)');
        }}
      />
      {node}
      {toast}
    </View>
  );
}

function Step({
  label,
  ok,
  note,
  onPress,
}: {
  label: string;
  ok?: boolean;
  note?: string;
  onPress?: () => void;
}) {
  const brand = useBrand();
  return (
    <PressableScale scaleTo={0.98} disabled={!onPress} onPress={onPress} style={styles.step}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ok ? brand.primary : colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{label}</Text>
        {note ? <Text style={styles.meta}>{note}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
    </PressableScale>
  );
}

const stateTone = { 'Not eligible': 'muted', Eligible: 'info', Released: 'ok' } as const;
const FORM_FOR: Record<string, 'feedback' | 'reentry' | 'outputs' | undefined> = { feedback: 'feedback', reentry: 'reentry', output: 'outputs' };

function CertCard({ activity, open, onView, onCertificate }: { activity: Activity; open: FormOpener; onView: () => void; onCertificate: () => void }) {
  const brand = useBrand();
  const demo = useDemo();
  const done = activity.status === 'Completed';
  const cert = certificateStatus(demo, activity);
  const state: CertificateState = cert.state;

  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.certHead}>
        <Text style={[styles.name, { color: brand.dark }]}>Certificate</Text>
        <StatusPill label={state} tone={stateTone[state]} />
      </View>
      {cert.requirements.map((r) => {
        const form = FORM_FOR[r.key];
        return (
          <Step
            key={r.key}
            label={r.label}
            ok={r.ok}
            note={!done && form ? undefined : r.note}
            onPress={done && form ? () => open[form](activity.id) : undefined}
          />
        );
      })}
      {state === 'Released' && <Button label="View certificate" onPress={onCertificate} />}
      <PressableScale accessibilityRole="button" onPress={onView} style={{ alignSelf: 'flex-start' }}>
        <Text style={[styles.link, { color: brand.primary }]}>View activity</Text>
      </PressableScale>
    </Card>
  );
}
const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 21 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  certHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  note: { borderRadius: radius.sm, padding: 10 },
  noteText: { fontSize: 12, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
