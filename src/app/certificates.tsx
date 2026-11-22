import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { StatusPill } from '@/components/bits';
import { Card } from '@/components/ui';
import { activities } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { certificateStatus, useDemo } from '@/store/demo';
import { colors } from '@/theme';

/** Certificate progress for every started activity, using the same sample progress as Plans & certs. */
export default function Certificates() {
  const { agencies } = useStore();
  const demo = useDemo();
  const list = activities.filter(
    (a) => a.status !== 'Upcoming' && agencies.some((agency) => agency.id === a.agencyId),
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.bg }}>
      {list.length === 0 ? (
        <Text style={styles.empty}>Join an organization to track certificate progress.</Text>
      ) : (
        list.map((activity) => {
          const agency = agencies.find((item) => item.id === activity.agencyId);
          const cert = certificateStatus(demo, activity);

          return (
            <Card key={activity.id} style={{ gap: 10 }}>
              <View style={styles.head}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.agency}>{agency?.short ?? 'Agency'}</Text>
                  <Text style={styles.title}>{activity.title}</Text>
                </View>
                <StatusPill label={cert.state} tone={cert.state === 'Released' ? 'ok' : cert.state === 'Eligible' ? 'info' : 'muted'} />
              </View>
              {cert.requirements.map((r) => (
                <Text key={r.key} style={styles.meta}>
                  {r.label} · {r.note}
                </Text>
              ))}
              <View style={styles.note}>
                <Text style={styles.noteText}>
                  {cert.state === 'Released'
                    ? 'Your certificate has been released.'
                    : cert.state === 'Eligible'
                      ? 'Requirements are complete. The agency will release your certificate.'
                      : 'Complete the requirements above to become eligible.'}
                </Text>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
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
