import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { Text } from '@/components/Text';
import { Button, PressableScale } from '@/components/ui';
import type { Activity } from '@/data/mock';
import { certificateInfo } from '@/store/demo';
import { colors, radius, shadow } from '@/theme';

/** A released certificate: the printed look, its number and a download button (nothing is downloaded yet). */
export function CertificateView({ activity, onClose, onDownload }: { activity: Activity | null; onClose: () => void; onDownload: () => void }) {
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const info = activity ? certificateInfo(activity) : null;

  return (
    <Modal visible={!!activity} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.barBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.barTitle}>Certificate</Text>
          <View style={styles.barBtn} />
        </View>

        {activity && info && (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View style={[styles.paper, { borderColor: brand.primary }]}>
              <View style={[styles.inner, { borderColor: brand.mid }]}>
                <View style={[styles.seal, { backgroundColor: brand.primary }]}>
                  <Ionicons name="ribbon" size={26} color="#fff" />
                </View>
                <Text style={[styles.org, { color: brand.primary }]}>{info.agencyName.toUpperCase()}</Text>
                <Text style={styles.heading}>Certificate of Completion</Text>
                <Text style={styles.small}>This certifies that</Text>
                <Text style={[styles.name, { color: brand.dark }]}>{info.participant}</Text>
                <Text style={styles.small}>has successfully completed</Text>
                <Text style={styles.activity}>{activity.title}</Text>
                <Text style={styles.small}>
                  {activity.dates} · {activity.venue}
                </Text>
                <View style={styles.sign}>
                  <View style={styles.line} />
                  <Text style={styles.small}>Authorized signatory, {info.agencyShort}</Text>
                </View>
              </View>
            </View>

            <View style={styles.facts}>
              <Fact label="Certificate no." value={info.number} />
              <Fact label="Released on" value={info.releasedOn} />
              <Fact label="Status" value="Released" />
            </View>

            <Button label="Download certificate" onPress={onDownload} />
            <Text style={styles.note}>Sample certificate: nothing is downloaded yet.</Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  barBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  paper: { backgroundColor: '#fff', borderWidth: 3, borderRadius: radius.md, padding: 8, ...shadow },
  inner: { borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', gap: 8, paddingVertical: 24, paddingHorizontal: 16 },
  seal: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  org: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textAlign: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  small: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  name: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  activity: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 22 },
  sign: { alignItems: 'center', gap: 4, marginTop: 16, alignSelf: 'stretch' },
  line: { height: 1, width: '60%', backgroundColor: colors.icon },
  facts: { backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, ...shadow },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  factLabel: { fontSize: 14, color: colors.muted },
  factValue: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right' },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
