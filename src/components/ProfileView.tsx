import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AuthField } from '@/components/auth';
import { BottomSheet } from '@/components/bits';
import { Group, Row, SectionTitle } from '@/components/lists';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Button, Chip } from '@/components/ui';
import { user } from '@/data/mock';
import { profileExtras } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { TEXT_SIZES, useSettings } from '@/store/Settings';
import { colors, shadow } from '@/theme';

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * Profile: who you are at the top, then your account, your preferences and support, as grouped lists.
 * Settings and Help are their own screens; editing your details and password open as sheets.
 */
export function ProfileView() {
  const { online } = useStore();
  const { textSize } = useSettings();
  const [sheet, setSheet] = useState<'profile' | 'password' | null>(null);
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  // Participant profile fields kept by the admin system (participant_profile).
  const [sex, setSex] = useState(profileExtras.sex);
  const [birthDate, setBirthDate] = useState(profileExtras.birthDate);
  const [province, setProvince] = useState(profileExtras.province);
  const [municipality, setMunicipality] = useState(profileExtras.municipality);
  const { notify, toast } = useToast();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const sizeLabel = TEXT_SIZES.find((t) => t.value === textSize)?.label ?? 'Default';

  const done = (message: string) => {
    setSheet(null);
    notify(message);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        {/* Who you are */}
        <Pressable accessibilityRole="button" accessibilityLabel={`${name}. Edit your profile`} onPress={() => setSheet('profile')} style={({ pressed }) => [s.who, pressed && { opacity: 0.92 }]}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(name)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email} numberOfLines={1}>
              {email}
            </Text>
            <View style={s.status}>
              <View style={[s.dot, { backgroundColor: online ? colors.success : colors.warn }]} />
              <Text style={s.statusText}>{online ? 'Online · all saved' : 'Offline · 1 waiting to sync'}</Text>
            </View>
          </View>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </Pressable>

        <SectionTitle>Account</SectionTitle>
        <Group>
          <Row icon="person-outline" label="Manage Profile" onPress={() => setSheet('profile')} />
          <Row icon="lock-closed-outline" label="Password & Security" onPress={() => setSheet('password')} />
          <Row icon="ribbon-outline" label="My certificates" onPress={() => router.push('/certificates')} />
        </Group>

        <SectionTitle>Preferences</SectionTitle>
        <Group>
          <Row icon="text-outline" label="Text size" value={sizeLabel} onPress={() => router.push('/settings')} />
          <Row icon="language-outline" label="Language" value="English" onPress={() => router.push('/settings')} />
          <Row icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings')} />
        </Group>

        <SectionTitle>Support</SectionTitle>
        <Group>
          <Row icon="help-circle-outline" label="Help center" onPress={() => router.push('/help')} />
          <Row icon="information-circle-outline" label="About UniFyle" value={`Version ${version}`} />
        </Group>

        <Group>
          <Row icon="log-out-outline" label="Sign out" danger onPress={() => router.replace('/login')} />
        </Group>
      </ScrollView>

      <BottomSheet visible={sheet === 'profile'} onClose={() => setSheet(null)} title="Manage Profile">
        <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ gap: 16, paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthField label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <AuthField label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
          <View style={{ gap: 8 }}>
            <Text style={s.groupLabel}>Sex</Text>
            <View style={s.sexRow}>
              {['Male', 'Female', 'Prefer not to say'].map((o) => (
                <Chip key={o} label={o} active={sex === o} onPress={() => setSex(o)} />
              ))}
            </View>
          </View>
          <AuthField label="Birth date" value={birthDate} onChangeText={setBirthDate} hint="For example: March 14, 1990" />
          <AuthField label="Province" value={province} onChangeText={setProvince} autoCapitalize="words" />
          <AuthField label="Municipality or city" value={municipality} onChangeText={setMunicipality} autoCapitalize="words" />
        </ScrollView>
        <Button label="Save changes" size="lg" onPress={() => done('Profile updated (sample)')} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'password'} onClose={() => setSheet(null)} title="Password & Security">
        <View style={{ gap: 16 }}>
          <AuthField label="Current password" secure autoCapitalize="none" />
          <AuthField label="New password" secure autoCapitalize="none" hint="At least 8 characters." />
          <AuthField label="Type the new password again" secure autoCapitalize="none" />
          <Button label="Update password" size="lg" onPress={() => done('Password updated (sample)')} />
        </View>
      </BottomSheet>
      {toast}
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 16, ...shadow },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  name: { fontSize: 19, fontWeight: '600', color: colors.text },
  email: { fontSize: 14, color: colors.muted },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: colors.muted },
  groupLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  sexRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
