import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { BottomSheet, DateBlock } from '@/components/bits';
import { Button, Card, PressableScale } from '@/components/ui';
import { activitiesOf, agencies as sampleAgencies, dateParts } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { colors, radius } from '@/theme';

/** QR check-in: front end only, with example info from the design. */
export default function CheckIn() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const list = activitiesOf(agency.id).filter((a) => a.status !== 'Completed');
  const [chosen, setChosen] = useState(list.find((a) => a.status === 'Ongoing')?.id ?? list[0]?.id);
  const [picking, setPicking] = useState(false);
  const activity = list.find((a) => a.id === chosen);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} style={{ backgroundColor: colors.bg }}>
      <Card style={{ gap: 4 }}>
        <View style={styles.between}>
          <Text style={[styles.kicker, { color: brand.primary }]}>{agency.short} · REGISTERED ACTIVITY</Text>
          <PressableScale accessibilityRole="button" scaleTo={0.94} onPress={() => setPicking(true)} hitSlop={8}>
            <Text style={[styles.change, { color: brand.primary }]}>Change</Text>
          </PressableScale>
        </View>
        <Text style={styles.title}>{activity?.title ?? 'Choose an activity'}</Text>
        <Text style={styles.meta}>June 18, 2025 · Day 2 · PM session</Text>
      </Card>

      <View style={[styles.scanBox, { backgroundColor: brand.soft }]}>
        <View style={styles.frame}>
          <Ionicons name="scan-outline" size={84} color={brand.primary} />
          <Ionicons name="camera-outline" size={30} color={brand.primary} style={styles.camera} />
        </View>
        <Text style={styles.scanText}>Scan the facilitator’s session QR</Text>
        <Button label="Open scanner" onPress={() => router.push('/scanner')} style={{ alignSelf: 'stretch' }} />
      </View>

      <Card style={{ gap: 2 }}>
        <Text style={styles.h}>Before check in</Text>
        <Text style={styles.meta}>Offline scans use saved details; validation syncs later.</Text>
      </Card>

      <Text style={[styles.h, { marginTop: 4 }]}>Today’s attendance</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.period}>AM</Text>
          <Text style={[styles.meta, { color: colors.warn }]}>8:12 AM · Saved on device</Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.period}>PM</Text>
          <Text style={styles.meta}>Not checked in · Window: 1:00–5:00 PM</Text>
        </View>
      </Card>

      <BottomSheet
        visible={picking}
        onClose={() => setPicking(false)}
        title="Choose activity"
        subtitle={`Active and upcoming ${agency.short} activities only.`}
      >
        {list.map((a) => {
          const date = dateParts(a);
          const registered = a.status === 'Ongoing';
          return (
            <PressableScale
              key={a.id}
              scaleTo={0.98}
              style={[styles.choice, chosen === a.id && { borderColor: brand.primary, backgroundColor: brand.soft }]}
              onPress={() => {
                setChosen(a.id);
                setPicking(false);
              }}
            >
              <DateBlock month={date.month} day={date.day} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.choiceTitle}>{a.title}</Text>
                <Text style={styles.meta}>
                  {registered ? 'Day 2 of 3 · Registered' : 'Upcoming · Not registered'}
                </Text>
              </View>
              {chosen === a.id && <Ionicons name="checkmark-circle" size={20} color={brand.primary} />}
            </PressableScale>
          );
        })}
        <Text style={[styles.meta, { textAlign: 'center' }]}>Only registered activities are available for check-in.</Text>
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 10, fontWeight: '700' },
  change: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  h: { fontSize: 14, fontWeight: '600', color: colors.text },
  scanBox: { borderRadius: radius.md, padding: 20, alignItems: 'center', gap: 14 },
  frame: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  camera: { position: 'absolute' },
  scanText: { fontSize: 14, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', gap: 16, paddingVertical: 10, alignItems: 'center' },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  period: { fontSize: 12, fontWeight: '700', color: colors.text, width: 26 },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  choiceTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
});
