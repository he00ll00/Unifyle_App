import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Group, Row, SectionTitle } from '@/components/lists';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/ui';
import { TEXT_SIZES, useSettings } from '@/store/Settings';
import { colors, shadow } from '@/theme';

/**
 * App settings kept on this phone: text size (applies to the whole app, with a live preview),
 * language, notifications and sync information.
 */
export default function Settings() {
  const { textSize, setTextSize } = useSettings();
  const [prefs, setPrefs] = useState({ reminders: true, updates: true, messages: false });

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <SectionTitle>Display</SectionTitle>
      <View style={s.card}>
        <Text style={s.cardTitle}>Text size</Text>

        <View style={s.preview} accessibilityLabel="Preview of the chosen text size">
          <Text style={s.previewTitle}>Rubber Production and Tapping Technology</Text>
          <Text style={s.previewBody}>Day 2 of 3 · Check-in opens at 8:00 AM at the training center.</Text>
        </View>

        <View style={s.sizes}>
          {TEXT_SIZES.map((t) => {
            const on = t.value === textSize;
            return (
              <PressableScale key={t.value} scaleTo={0.96} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={t.label} onPress={() => setTextSize(t.value)} style={[s.size, on && s.sizeOn]}>
                {/* the "Aa" sample is drawn at a fixed size so the four choices always look different from each other */}
                <Text style={[s.aa, { fontSize: 14 + t.scale * 8 }, on && { color: colors.primary }]}>Aa</Text>
                <Text style={[s.sizeLabel, on && { color: colors.primary, fontWeight: '600' }]}>{t.label}</Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <SectionTitle>General</SectionTitle>
      <Group>
        <Row icon="language-outline" label="Language" value="English" />
      </Group>

      <SectionTitle>Notifications</SectionTitle>
      <Group>
        {([
          ['reminders', 'Session reminders'],
          ['updates', 'Activity updates'],
          ['messages', 'Messages'],
        ] as const).map(([key, label]) => (
          <Row
            key={key}
            icon="notifications-outline"
            label={label}
            right={<Switch value={prefs[key]} onValueChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel={label} />}
          />
        ))}
      </Group>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12, ...shadow },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  preview: { backgroundColor: colors.bg, borderRadius: 12, padding: 14, gap: 4 },
  previewTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  previewBody: { fontSize: 14, lineHeight: 20, color: colors.muted },
  sizes: { flexDirection: 'row', gap: 8 },
  size: { flex: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', paddingVertical: 8 },
  sizeOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  aa: { fontWeight: '600', color: colors.text },
  sizeLabel: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
