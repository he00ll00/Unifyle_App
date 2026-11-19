import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { BottomSheet } from '@/components/bits';
import { useToast } from '@/components/sheets';
import { Text, TextInput } from '@/components/Text';
import { Button, Card } from '@/components/ui';
import { user } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

function Item({ icon, label, danger, onPress }: { icon: Icon; label: string; danger?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress} style={[styles.item, !onPress && styles.disabledItem]}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.muted} />
      <Text style={[styles.itemText, danger && { color: colors.danger, fontWeight: '600' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

export function ProfileView() {
  const { online } = useStore();
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<'profile' | 'password' | 'notifications' | null>(null);
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [prefs, setPrefs] = useState({ reminders: true, updates: true, messages: false });
  const { notify, toast } = useToast();
  const offline = !online;
  const done = (message: string) => {
    setSheet(null);
    notify(message);
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Card style={styles.who}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Participant number ${user.participantId}. Tap to copy.`}
          onPress={() => {
            // Demo action: shows the confirmation only; nothing is copied yet.
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          style={styles.pid}
        >
          <Text style={styles.pidText}>{user.participantId}</Text>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? colors.primary : colors.muted} />
        </Pressable>
      </Card>

      <Text style={styles.section}>Account</Text>
      <Card style={{ paddingVertical: 4 }}>
        <Item icon="person-outline" label="Manage Profile" onPress={() => setSheet('profile')} />
        <Item icon="lock-closed-outline" label="Password & Security" onPress={() => setSheet('password')} />
        <Item icon="notifications-outline" label="Notifications" onPress={() => setSheet('notifications')} />
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Item icon="ribbon-outline" label="My certificates" onPress={() => router.push('/certificates')} />
        <Item icon="log-out-outline" label="Sign out" danger onPress={() => router.replace('/login')} />
      </Card>

      <Card style={{ gap: 4 }}>
        <Text style={styles.h}>Sync status</Text>
        <Text style={[styles.status, { color: offline ? colors.warn : colors.primary }]}>
          {offline ? 'Offline · 1 check-in waiting to sync' : 'Online · No records waiting to sync'}
        </Text>
        <Text style={styles.meta}>Saved on this device. Syncs automatically when online.</Text>
      </Card>
    </ScrollView>

      <BottomSheet visible={sheet === 'profile'} onClose={() => setSheet(null)} title="Manage Profile">
        <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.icon} style={styles.input} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.icon}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <Button label="Save changes" onPress={() => done('Profile updated (sample)')} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'password'} onClose={() => setSheet(null)} title="Password & Security">
        <TextInput placeholder="Current password" placeholderTextColor={colors.icon} secureTextEntry style={styles.input} />
        <TextInput placeholder="New password" placeholderTextColor={colors.icon} secureTextEntry style={styles.input} />
        <TextInput placeholder="Confirm new password" placeholderTextColor={colors.icon} secureTextEntry style={styles.input} />
        <Button label="Update password" onPress={() => done('Password updated (sample)')} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'notifications'} onClose={() => setSheet(null)} title="Notifications">
        {([
          ['reminders', 'Session reminders'],
          ['updates', 'Activity updates'],
          ['messages', 'Messages'],
        ] as const).map(([key, label]) => (
          <View key={key} style={styles.prefRow}>
            <Text style={styles.itemText}>{label}</Text>
            <Switch
              value={prefs[key]}
              onValueChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        ))}
        <Button label="Done" variant="soft" onPress={() => done('Notification settings saved')} />
      </BottomSheet>
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  pid: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  pidText: { fontSize: 10, fontWeight: '600', color: colors.text },
  section: { fontSize: 12, color: colors.muted, marginBottom: -6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  disabledItem: { opacity: 0.55 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: colors.text },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  itemText: { flex: 1, fontSize: 14, color: colors.text },
  h: { fontSize: 14, fontWeight: '600', color: colors.text },
  status: { fontSize: 12, fontWeight: '600' },
});
