import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { BottomSheet, DateBlock } from '@/components/bits';
import { Button, Card, PressableScale } from '@/components/ui';
import { activitiesOf, agencies as sampleAgencies, dateParts, isRegistered } from '@/data/mock';
import { attendanceDays } from '@/data/sample';
import { demoActions, useDemo } from '@/store/demo';
import { useStore } from '@/store/AppStore';
import { colors, radius } from '@/theme';

/** QR check-in: front end only, with example info from the design. */
export default function CheckIn() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies } = useStore();
  const agency = agencies.find((a) => a.id === agencyId) ?? sampleAgencies[0];
  const brand = useBrand();
  const demo = useDemo();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const list = activitiesOf(agency.id).filter((a) => a.status !== 'Completed');
  const [chosen, setChosen] = useState(list.find((a) => a.status === 'Ongoing')?.id ?? list[0]?.id);
  const [picking, setPicking] = useState(false);
  const activity = list.find((a) => a.id === chosen);
  const today = attendanceDays.find((d) => d.today);

  // Registers for an upcoming activity with its own code (activity.join_code).
  const joinActivity = () => {
    const code = joinCode.trim().toUpperCase();
    const found = list.find((a) => a.joinCode === code);
    if (!found) return setJoinError('That activity code is not valid. Check it and try again.');
    if (isRegistered(found, demo.joined)) return setJoinError('You are already registered for this activity.');
    if (found.capacity && found.capacity.taken >= found.capacity.max) return setJoinError('This activity is full.');
    demoActions.joinActivity(found.id);
    setChosen(found.id);
    setJoinCode('');
    setJoinError(null);
    setPicking(false);
  };

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
        <Text style={styles.meta}>June 18, 2025 · Day 2 · {activity && isRegistered(activity, demo.joined) ? 'Registered' : 'Not registered'}</Text>
      </Card>

      <View style={[styles.scanBox, { backgroundColor: brand.soft }]}>
        <View style={styles.frame}>
          <Ionicons name="scan-outline" size={84} color={brand.primary} />
          <Ionicons name="camera-outline" size={30} color={brand.primary} style={styles.camera} />
        </View>
        <Text style={styles.scanText}>Scan the QR code of the check point</Text>
        <Button label="Open scanner" onPress={() => router.push('/scanner')} style={{ alignSelf: 'stretch' }} />
      </View>

      <Card style={{ gap: 2 }}>
        <Text style={styles.h}>Before check in</Text>
        <Text style={styles.meta}>Offline scans use saved details; validation syncs later.</Text>
      </Card>

      <Text style={[styles.h, { marginTop: 4 }]}>Today’s attendance</Text>
      <Card>
        {(today?.rows ?? []).map((r, i) => (
          <View key={r.name} style={[styles.row, i > 0 && styles.rowBorder]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.period}>{r.name}</Text>
              <Text style={[styles.meta, r.status === 'Pending sync' && { color: colors.warn }]}>
                {r.status === 'Not checked in' ? r.note : r.status + ' · ' + r.note}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <BottomSheet
        visible={picking}
        onClose={() => setPicking(false)}
        title="Choose activity"
        subtitle={`Active and upcoming ${agency.short} activities only.`}
      >
        {list.map((a) => {
          const date = dateParts(a);
          const registered = isRegistered(a, demo.joined);
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
                  {registered ? (a.status === 'Ongoing' ? 'Day 2 of 3 · Registered' : 'Registered') : 'Upcoming · Not registered'}
                </Text>
              </View>
              {chosen === a.id && <Ionicons name="checkmark-circle" size={20} color={brand.primary} />}
            </PressableScale>
          );
        })}
        <Text style={[styles.meta, { textAlign: 'center' }]}>Only registered activities are available for check-in.</Text>
        <Text style={styles.h}>Join with an activity code</Text>
        <TextInput
          value={joinCode}
          onChangeText={(v) => {
            setJoinCode(v);
            setJoinError(null);
          }}
          placeholder="e.g. PRRI-BW01"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={joinActivity}
          style={[styles.codeInput, joinError ? { borderColor: colors.danger } : null]}
        />
        {joinError && <Text style={[styles.meta, { color: colors.danger }]}>{joinError}</Text>}
        <Button label="Join activity" variant="soft" disabled={!joinCode.trim()} onPress={joinActivity} />
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
  period: { fontSize: 12, fontWeight: '700', color: colors.text },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  codeInput: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, fontSize: 16, letterSpacing: 1, color: colors.text },
  choiceTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
});
