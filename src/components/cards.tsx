import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { useBrand } from '@/components/Brand';
import { DateBlock } from '@/components/bits';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/ui';
import { Activity, ActivityStatus, dateParts } from '@/data/mock';
import { colors, shadow } from '@/theme';

const STATUS: Record<ActivityStatus, { dot: string; label: string }> = {
  Ongoing: { dot: colors.primary, label: 'Ongoing' },
  Upcoming: { dot: '#F59E0B', label: 'Upcoming' },
  Completed: { dot: colors.success, label: 'Completed' },
};

/**
 * One activity, laid out like the cards on the web's public agency page: a date block, then the status
 * and type, the title, the venue and dates, and a footer with the registration state and one button.
 */
export function ActivityCard({
  activity,
  footerText,
  action,
  onPress,
  onAction,
}: {
  activity: Activity;
  footerText: string;
  /** Label of the small button on the right. Leave out for a plain arrow. */
  action?: string;
  onPress: () => void;
  onAction?: () => void;
}) {
  const brand = useBrand();
  const date = dateParts(activity);
  const st = STATUS[activity.status];
  return (
    <PressableScale scaleTo={0.985} accessibilityRole={Platform.OS === 'web' ? undefined : 'button'} accessibilityLabel={`${activity.title}. ${activity.status}. ${footerText}`} onPress={onPress} style={s.card}>
      <View style={s.top}>
        <DateBlock month={date.month} day={date.day} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={s.tags}>
            <View style={[s.dot, { backgroundColor: st.dot }]} />
            <Text style={s.status}>{st.label}</Text>
            <Text style={s.type}>· {activity.category}</Text>
          </View>
          <Text style={[s.title, { color: brand.dark }]}>{activity.title}</Text>
        </View>
      </View>

      <View style={s.facts}>
        <View style={s.fact}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={s.factText}>{activity.venue}</Text>
        </View>
        <View style={s.fact}>
          <Ionicons name="calendar-outline" size={16} color={colors.muted} />
          <Text style={s.factText}>{activity.dates}</Text>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={[s.footText, { color: brand.primary }]}>{footerText}</Text>
        {action ? (
          <PressableScale accessibilityRole="button" scaleTo={0.94} onPress={onAction ?? onPress} hitSlop={8} style={[s.btn, { backgroundColor: brand.primary }]}>
            <Text style={s.btnText}>{action}</Text>
          </PressableScale>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={brand.primary} />
        )}
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 12, marginHorizontal: 16, marginBottom: 12, ...shadow },
  top: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontSize: 13, fontWeight: '600', color: colors.text },
  type: { fontSize: 13, color: colors.muted },
  title: { fontSize: 17, fontWeight: '600', lineHeight: 23, color: colors.text },
  facts: { gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factText: { flex: 1, fontSize: 14, color: colors.muted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  footText: { flex: 1, fontSize: 14, fontWeight: '600' },
  btn: { minHeight: 40, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
