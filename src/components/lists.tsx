import { Ionicons } from '@expo/vector-icons';
import { Children, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { shadow, colors } from '@/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

/** Small grey heading above a group, like "Account" or "Support". */
export function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={s.section} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** A white card of rows with a thin line between them. */
export function Group({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={s.group}>
      <View style={s.groupInner}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View style={s.divider} /> : null}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * One row: an icon in a soft tile, the label, then either a value and an arrow (it opens something)
 * or any control you pass as `right` (a switch, for example). A row with no `onPress` is not tappable.
 */
export function Row({
  icon,
  label,
  value,
  note,
  onPress,
  danger,
  right,
}: {
  icon: Icon;
  label: string;
  value?: string;
  note?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: ReactNode;
}) {
  const tint = danger ? colors.danger : colors.primary;
  const body = (
    <View style={s.row}>
      <View style={[s.tile, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.label, danger && { color: colors.danger }]}>{label}</Text>
        {note ? <Text style={s.note}>{note}</Text> : null}
      </View>
      {right ?? (
        <>
          {value ? <Text style={s.value}>{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.icon} /> : null}
        </>
      )}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: colors.bg }}>
      {body}
    </Pressable>
  );
}

const s = StyleSheet.create({
  section: { fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 6, marginLeft: 4 },
  // the shadow and the rounded clipping live on two layers, because iOS clips a shadow on a clipped view
  group: { backgroundColor: colors.card, borderRadius: 16, ...shadow },
  groupInner: { borderRadius: 16, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingHorizontal: 16, paddingVertical: 10 },
  tile: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '500', color: colors.text },
  note: { fontSize: 13, color: colors.muted, marginTop: 2 },
  value: { fontSize: 14, color: colors.muted },
});
