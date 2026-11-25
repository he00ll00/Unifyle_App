import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { AuthField } from '@/components/auth';
import { BottomSheet } from '@/components/bits';
import { Group, Row, SectionTitle } from '@/components/lists';
import { useToast } from '@/components/sheets';
import { Text } from '@/components/Text';
import { Button, Chip } from '@/components/ui';
import { user } from '@/data/mock';
import { profileExtras } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { colors, shadow } from '@/theme';

/**
 * Profile: who you are at the top, then your account, your preferences and support, as grouped lists.
 * Settings and Help are their own screens; editing your details and password open as sheets.
 */
export function ProfileView() {
  const { online, avatarUri, setAvatar } = useStore();
  const [sheet, setSheet] = useState<'profile' | 'password' | 'photo' | null>(null);
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  // Participant profile fields kept by the admin system (participant_profile).
  const [sex, setSex] = useState(profileExtras.sex);
  const [birthDate, setBirthDate] = useState(profileExtras.birthDate);
  const [province, setProvince] = useState(profileExtras.province);
  const [municipality, setMunicipality] = useState(profileExtras.municipality);
  const { notify, toast } = useToast();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const done = (message: string) => {
    setSheet(null);
    notify(message);
  };

  // Picks a square photo from the library or the camera. Nothing is uploaded, it stays on this phone.
  const pick = async (from: 'library' | 'camera') => {
    try {
      if (from === 'camera') {
        const ok = await ImagePicker.requestCameraPermissionsAsync();
        if (!ok.granted) return done('Allow camera access to take a photo');
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
      const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return setSheet(null);
      setAvatar(result.assets[0].uri);
      done('Profile photo updated');
    } catch {
      done('Could not open your photos');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        {/* Who you are: the photo, centered, with a camera button to change it */}
        <View style={s.who}>
          <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={() => setSheet('photo')} style={s.photoWrap}>
            <Avatar name={name} size={104} />
            <View style={s.camera}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          <Text style={s.name}>{name}</Text>
          <Text style={s.email} numberOfLines={1}>
            {email}
          </Text>
          <View style={s.status}>
            <View style={[s.dot, { backgroundColor: online ? colors.success : colors.warn }]} />
            <Text style={s.statusText}>{online ? 'Online · all saved' : 'Offline · 1 waiting to sync'}</Text>
          </View>
        </View>

        <SectionTitle>Account</SectionTitle>
        <Group>
          <Row icon="person-outline" label="Manage Profile" onPress={() => setSheet('profile')} />
          <Row icon="lock-closed-outline" label="Password & Security" onPress={() => setSheet('password')} />
          <Row icon="ribbon-outline" label="My certificates" onPress={() => router.push('/certificates')} />
        </Group>

        <SectionTitle>Preferences</SectionTitle>
        <Group>
          <Row icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
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

      <BottomSheet visible={sheet === 'photo'} onClose={() => setSheet(null)} title="Profile photo">
        <View style={{ gap: 4 }}>
          <Row icon="images-outline" label="Choose from library" onPress={() => pick('library')} />
          {Platform.OS !== 'web' && <Row icon="camera-outline" label="Take a photo" onPress={() => pick('camera')} />}
          {avatarUri ? <Row icon="trash-outline" label="Remove photo" danger onPress={() => { setAvatar(undefined); done('Photo removed'); }} /> : null}
        </View>
      </BottomSheet>

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
          <AuthField label="Birth date" value={birthDate} onChangeText={setBirthDate} />
          <AuthField label="Province" value={province} onChangeText={setProvince} autoCapitalize="words" />
          <AuthField label="Municipality or city" value={municipality} onChangeText={setMunicipality} autoCapitalize="words" />
        </ScrollView>
        <Button label="Save changes" size="lg" onPress={() => done('Profile updated (sample)')} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'password'} onClose={() => setSheet(null)} title="Password & Security">
        <View style={{ gap: 16 }}>
          <AuthField label="Current password" secure autoCapitalize="none" />
          <AuthField label="New password" secure autoCapitalize="none" />
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
  who: { alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, ...shadow },
  photoWrap: { marginBottom: 12 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '600', color: colors.text },
  email: { fontSize: 14, color: colors.muted },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: colors.muted },
  groupLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  sexRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
