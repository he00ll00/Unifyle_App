import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CertificateView } from '@/components/CertificateView';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/ui';
import { Activity } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { demoActions, NotificationRow, notificationsFor, useDemo } from '@/store/demo';
import { colors, shadow } from '@/theme';

/** Which heading a notification sits under, from how long ago it was sent. */
const groupOf = (when: string) => (/just now|minute|hour|today/i.test(when) ? 'Today' : /yesterday/i.test(when) ? 'Yesterday' : 'Earlier');
const ORDER = ['Today', 'Yesterday', 'Earlier'];

/**
 * Notifications: news only. Invitations and lost access are answered on the Workspaces page, so
 * those show up here as a single row that points there, instead of a second set of buttons.
 */
export default function Notifications() {
  const demo = useDemo();
  const { agencies } = useStore();
  const rows = notificationsFor(demo, agencies.map((a) => a.id));
  const unread = rows.filter((r) => r.unread);
  const [certificate, setCertificate] = useState<Activity | null>(null);
  const { notify, toast } = useToast();

  const groups = ORDER.map((name) => ({ name, rows: rows.filter((r) => groupOf(r.when) === name) })).filter((g) => g.rows.length);

  const open = (r: NotificationRow) => {
    demoActions.markRead([r.id]);
    if (r.certificate) setCertificate(r.certificate);
    else if (r.to) router.navigate(r.to);
    else if (r.link) router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: r.link.agencyId, id: r.link.activityId } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        {unread.length > 0 && (
          <View style={s.bar}>
            <Text style={s.count}>{unread.length} new</Text>
            <PressableScale accessibilityRole="button" scaleTo={0.94} hitSlop={10} onPress={() => demoActions.markRead(unread.map((u) => u.id))}>
              <Text style={s.markAll}>Mark all as read</Text>
            </PressableScale>
          </View>
        )}

        {groups.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-outline" size={30} color={colors.primary} />
            </View>
            <Text style={s.emptyTitle}>You’re all caught up</Text>
            <Text style={s.emptyText}>New updates from your agencies will show up here.</Text>
          </View>
        )}

        {groups.map((g) => (
          <View key={g.name} style={{ gap: 8 }}>
            <Text style={s.group} accessibilityRole="header">
              {g.name}
            </Text>
            <View style={s.card}>
              <View style={s.cardInner}>
                {g.rows.map((r, i) => (
                  <PressableScale key={r.id} scaleTo={0.99} accessibilityRole="button" accessibilityLabel={`${r.title}. ${r.body}`} onPress={() => open(r)} style={[s.row, i > 0 && s.rowLine, r.unread && s.rowUnread]}>
                    <View style={[s.tile, r.icon === 'lock-closed-outline' && { backgroundColor: colors.dangerSoft }]}>
                      <Ionicons name={r.icon} size={20} color={r.icon === 'lock-closed-outline' ? colors.danger : colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={s.head}>
                        <Text style={[s.title, r.unread && { fontWeight: '700' }]} numberOfLines={1}>
                          {r.title}
                        </Text>
                        {r.unread ? <View style={s.dot} /> : null}
                      </View>
                      <Text style={s.body} numberOfLines={2}>
                        {r.body}
                      </Text>
                      <Text style={s.when}>
                        {r.agencyShort} · {r.when}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <CertificateView
        activity={certificate}
        onClose={() => setCertificate(null)}
        onDownload={() => {
          setCertificate(null);
          notify('Certificate saved to your device (sample)');
        }}
      />
      {toast}
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 18, paddingBottom: 40 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4 },
  count: { fontSize: 15, fontWeight: '600', color: colors.text },
  markAll: { fontSize: 15, fontWeight: '600', color: colors.primary },
  group: { fontSize: 14, fontWeight: '600', color: colors.muted, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, ...shadow },
  cardInner: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.border },
  rowUnread: { backgroundColor: '#F7FAFF' },
  tile: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  body: { fontSize: 14, lineHeight: 20, color: colors.muted },
  when: { fontSize: 13, color: colors.icon },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 15, color: colors.muted, textAlign: 'center' },
});
