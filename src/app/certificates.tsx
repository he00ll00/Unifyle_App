import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { StatusPill } from '@/components/bits';
import { CertificateView } from '@/components/CertificateView';
import { useToast } from '@/components/sheets';
import { Button, Card } from '@/components/ui';
import { activities, Activity } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { certificateInfo, certificateStatus, useDemo } from '@/store/demo';
import { colors } from '@/theme';

/** Certificate progress for every started activity, using the same sample progress as Plans & certs. */
export default function Certificates() {
  const { agencies } = useStore();
  const demo = useDemo();
  const { notify, toast } = useToast();
  const [viewing, setViewing] = useState<Activity | null>(null);
  const list = activities.filter(
    (a) => a.status !== 'Upcoming' && agencies.some((agency) => agency.id === a.agencyId),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {list.length === 0 ? (
          <Text style={styles.empty}>Join an organization to track certificate progress.</Text>
        ) : (
          list.map((activity) => {
            const agency = agencies.find((item) => item.id === activity.agencyId);
            const cert = certificateStatus(demo, activity);
            const released = cert.state === 'Released';

            return (
              <Card key={activity.id} style={{ gap: 10 }}>
                <View style={styles.head}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.agency}>{agency?.short ?? 'Agency'}</Text>
                    <Text style={styles.title}>{activity.title}</Text>
                  </View>
                  <StatusPill label={cert.state} tone={released ? 'ok' : cert.state === 'Eligible' ? 'info' : 'muted'} />
                </View>
                {released ? (
                  <>
                    <Text style={styles.meta}>Certificate no. {certificateInfo(activity).number}</Text>
                    <Text style={styles.meta}>Released on {certificateInfo(activity).releasedOn}</Text>
                    <Button label="View certificate" onPress={() => setViewing(activity)} />
                  </>
                ) : (
                  <>
                    {cert.requirements.map((r) => (
                      <Text key={r.key} style={styles.meta}>
                        {r.label} · {r.note}
                      </Text>
                    ))}
                    <View style={styles.note}>
                      <Text style={styles.noteText}>
                        {cert.state === 'Eligible'
                          ? 'Requirements are complete. The agency will release your certificate.'
                          : 'Complete the requirements above to become eligible.'}
                      </Text>
                    </View>
                  </>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      <CertificateView
        activity={viewing}
        onClose={() => setViewing(null)}
        onDownload={() => {
          setViewing(null);
          notify('Certificate saved to your device (sample)');
        }}
      />
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  agency: { fontSize: 12, fontWeight: '700', color: colors.primary },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  note: { backgroundColor: colors.infoSoft, borderRadius: 8, padding: 10 },
  noteText: { fontSize: 12, color: colors.info, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32 },
});
