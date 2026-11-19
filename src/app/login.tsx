import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { BottomSheet, Logo } from '@/components/bits';
import { Button } from '@/components/ui';
import { colors, radius, shadow } from '@/theme';

/** Login screen: front end only, so Sign in simply continues to the workspaces. */
export default function Login() {
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState<'forgot' | 'signup' | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Logo size={104} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Sign in to continue</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Username"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <View style={styles.passRow}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!show}
              autoCapitalize="none"
              style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 0, ...{ shadowOpacity: 0, elevation: 0 } }]}
            />
            <Pressable accessibilityRole="button" onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Text style={styles.show}>{show ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" style={{ alignSelf: 'flex-end' }} onPress={() => setSheet('forgot')}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
          <Button label="Sign in" onPress={() => router.replace('/workspaces')} />
        </View>

        <Text style={styles.foot}>
          Don’t have an account?{' '}
          <Text style={styles.link} onPress={() => setSheet('signup')}>
            Sign up
          </Text>
        </Text>
      </ScrollView>

      <BottomSheet
        visible={sheet === 'forgot'}
        onClose={() => {
          setSheet(null);
          setSent(false);
        }}
        title="Reset your password"
        subtitle="We’ll send a reset link to your email."
      >
        {sent ? (
          <Text style={styles.sub}>Check your inbox. A reset link was sent (sample).</Text>
        ) : (
          <>
            <TextInput
              placeholder="Email address"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.sheetInput}
            />
            <Button label="Send reset link" onPress={() => setSent(true)} />
          </>
        )}
      </BottomSheet>

      <BottomSheet visible={sheet === 'signup'} onClose={() => setSheet(null)} title="Create an account" subtitle="One account works across every agency.">
        <TextInput placeholder="Full name" placeholderTextColor={colors.muted} style={styles.sheetInput} />
        <TextInput placeholder="Email address" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.sheetInput} />
        <TextInput placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.sheetInput} />
        <Button
          label="Create account"
          onPress={() => {
            setSheet(null);
            router.replace('/workspaces');
          }}
        />
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 14 },
  sub: { fontSize: 14, color: colors.muted },
  form: { alignSelf: 'stretch', gap: 14, marginTop: 22 },
  input: {
    minHeight: 48, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14,
    fontSize: 14, color: colors.text, ...shadow,
  },
  passRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, backgroundColor: '#fff',
    borderRadius: radius.md, paddingHorizontal: 14, ...shadow,
  },
  sheetInput: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, fontSize: 14, color: colors.text },
  show: { fontSize: 12, fontWeight: '600', color: colors.primary },
  link: { fontSize: 12, fontWeight: '600', color: colors.primary },
  foot: { fontSize: 12, color: colors.muted, marginTop: 22 },
});
