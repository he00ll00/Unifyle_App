import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet, StatusPill } from '@/components/bits';
import { CertificateView } from '@/components/CertificateView';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Button, Card, PressableScale } from '@/components/ui';
import { Activity } from '@/data/mock';
import { notifications } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { demoActions, notificationsFor, useDemo } from '@/store/demo';
import { colors, radius } from '@/theme';

/** Notifications: updates, pending invitations and organizations you no longer have access to (front end only). */
export default function Notifications() {
  const { pending, revoked } = notifications;
  const demo = useDemo();
  const { invitation } = demo;
  const { agencies } = useStore();
  const updates = notificationsFor(demo, agencies.map((a) => a.id));
  const unread = updates.filter((u) => u.unread);
  const [certificate, setCertificate] = useState<Activity | null>(null);
  const { notify, toast } = useToast();
  const [details, setDetails] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.sectionRow}>
          <Text style={styles.section}>UPDATES{unread.length > 0 ? ` · ${unread.length} NEW` : ''}</Text>
          {unread.length > 0 && (
            <PressableScale accessibilityRole="button" scaleTo={0.94} hitSlop={8} onPress={() => demoActions.markRead(unread.map((u) => u.id))}>
              <Text style={[styles.meta, { color: colors.primary, fontWeight: '700' }]}>Mark all as read</Text>
            </PressableScale>
          )}
        </View>
        {updates.length === 0 && (
          <Card>
            <Text style={styles.meta}>No updates yet.</Text>
          </Card>
        )}
        {updates.map((u) => (
          <PressableScale
            key={u.id}
            scaleTo={0.98}
            accessibilityRole="button"
            onPress={() => {
              demoActions.markRead([u.id]);
              if (u.certificate) setCertificate(u.certificate);
              else if (u.link) router.navigate({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: u.link.agencyId, id: u.link.activityId } });
            }}
          >
            <Card style={styles.update}>
              <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={u.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.updateHead}>
                  <Text style={[styles.name, { flex: 1 }]}>{u.title}</Text>
                  {u.unread && <View style={styles.dot} />}
                </View>
                <Text style={styles.meta}>{u.body}</Text>
                <Text style={styles.when}>
                  {u.agencyShort} · {u.when}
                </Text>
              </View>
            </Card>
          </PressableScale>
        ))}

        <Text style={[styles.section, { marginTop: 8 }]}>PENDING INVITATIONS</Text>
        {invitation === 'declined' ? (
          <Card>
            <Text style={styles.meta}>You declined the invitation from {pending.name}.</Text>
          </Card>
        ) : (
          <Card style={{ gap: 10 }}>
            <View style={styles.head}>
              <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.logoText, { color: colors.primary }]}>{pending.short}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{pending.name}</Text>
                <StatusPill
                  label={invitation === 'accepted' ? 'Invitation accepted' : 'Invitation pending'}
                  tone={invitation === 'accepted' ? 'ok' : 'warn'}
                />
              </View>
            </View>
            <Text style={styles.meta}>{pending.by}</Text>
            <Text style={styles.meta}>{pending.expires}</Text>
            {invitation === 'pending' ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Button
                  label="Accept"
                  style={{ flex: 1 }}
                  onPress={() => {
                    demoActions.answerInvitation('accepted');
                    notify(`You joined ${pending.short} (sample)`);
                  }}
                />
                <Button
                  label="Decline"
                  variant="soft"
                  style={{ flex: 1 }}
                  onPress={() => {
                    demoActions.answerInvitation('declined');
                    notify('Invitation declined');
                  }}
                />
              </View>
            ) : (
              <Text style={[styles.meta, { color: colors.success, fontWeight: '600' }]}>
                You’re now a participant of {pending.short}.
              </Text>
            )}
          </Card>
        )}

        <Text style={[styles.section, { marginTop: 8 }]}>NO LONGER ACCESSIBLE</Text>
        <PressableScale scaleTo={0.98} accessibilityRole="button" onPress={() => setDetails(true)}>
          <Card style={{ gap: 8 }}>
            <View style={styles.head}>
              <View style={[styles.logo, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.logoText, { color: colors.danger }]}>{revoked.short}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{revoked.name}</Text>
                <StatusPill label="Access revoked" tone="danger" />
              </View>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
            </View>
            <Text style={styles.meta}>{revoked.when}</Text>
            <Text style={[styles.meta, { color: colors.primary, fontWeight: '600' }]}>Tap for details</Text>
          </Card>
        </PressableScale>
      </ScrollView>

      <BottomSheet visible={details} onClose={() => setDetails(false)} title={revoked.name} subtitle="Access revoked">
        <Text style={styles.detail}>
          Your access to this organization was revoked on May 28, 2025. Your past attendance and certificates stay saved on your
          account, but you can’t see its activities or message its members.
        </Text>
        <Button
          label="Contact the organization"
          onPress={() => {
            setDetails(false);
            notify('Message sent to the organization (sample)');
          }}
        />
        <Button label="Close" variant="soft" onPress={() => setDetails(false)} />
      </BottomSheet>
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

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  update: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  updateHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  when: { fontSize: 11, color: colors.icon, marginTop: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 10, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  detail: { fontSize: 14, lineHeight: 21, color: colors.muted },
});
