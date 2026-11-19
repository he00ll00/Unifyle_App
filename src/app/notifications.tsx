import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet, StatusPill } from '@/components/bits';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Button, Card, PressableScale } from '@/components/ui';
import { notifications } from '@/data/sample';
import { demoActions, useDemo } from '@/store/demo';
import { colors, radius } from '@/theme';

/** Notifications: pending invitations and organizations you no longer have access to (front end only). */
export default function Notifications() {
  const { pending, revoked } = notifications;
  const { invitation } = useDemo();
  const { notify, toast } = useToast();
  const [details, setDetails] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={styles.section}>PENDING INVITATIONS</Text>
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
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 10, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  detail: { fontSize: 14, lineHeight: 21, color: colors.muted },
});
