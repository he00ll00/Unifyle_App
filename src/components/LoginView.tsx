import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@/components/auth';
import { BottomSheet } from '@/components/bits';
import { KeyboardAwareScrollView } from '@/components/keyboard';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Button, PressableScale } from '@/components/ui';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGN_IN_BACKGROUND = require('../../assets/unifyle-sign-in-bg.png');
const SIGN_IN_BUTTON = require('../../assets/unifyle-sign-in-button.png');
const LOADING_BACKGROUND = require('../../assets/unifyle-loading-bg.png');

export default function LoginView({ intro = false }: { intro?: boolean }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(intro);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setPlaying(false), 1500);
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (active && reduce) setPlaying(false);
    }).catch(() => {});
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [playing]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const signIn = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'That email doesn’t look right.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (!next.email && !next.password) router.replace('/workspaces');
  };
  const sendReset = () => {
    if (!EMAIL_PATTERN.test(resetEmail.trim())) {
      setResetError('Enter the email address you signed up with.');
      return;
    }
    setResetError(undefined);
    setSent(true);
  };
  const closeForgot = () => {
    setForgot(false);
    setSent(false);
    setResetError(undefined);
  };

  if (playing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="UniFyle loading. Skip intro"
        onPress={() => setPlaying(false)}
        style={s.loading}
      >
        <Image source={LOADING_BACKGROUND} resizeMode="stretch" style={s.artwork} accessible={false} />
        <View style={s.lockup}>
          <Logo size={116} />
          <Text style={s.loadingTitle}>UniFyle</Text>
        </View>
      </Pressable>
    );
  }

  const paddingTop = Math.max(24 + insets.top, Math.min(88, height * 0.117));
  return (
    <View style={s.root}>
      <Image source={SIGN_IN_BACKGROUND} resizeMode="stretch" style={s.artwork} accessible={false} />
      <KeyboardAwareScrollView
        bottomOffset={32}
        contentContainerStyle={[s.screen, { paddingTop, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.content}>
          <View style={s.head}>
            <Logo />
            <View style={s.titles}>
              <Text style={s.title} accessibilityRole="header">Welcome Back</Text>
              <Text style={s.sub}>Sign in to continue</Text>
            </View>
          </View>

          <View style={s.form}>
            <AuthField
              compact
              label="Email address"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              error={errors.email}
              placeholder="Email address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <View style={{ gap: 4 }}>
              <AuthField
                compact
                label="Password"
                secure
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                error={errors.password}
                placeholder="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={signIn}
              />
              <Pressable accessibilityRole="button" onPress={() => setForgot(true)} style={s.forgot}>
                <Text style={s.link}>Forgot password?</Text>
              </Pressable>
            </View>
            <PressableScale accessibilityRole="button" onPress={signIn} style={s.submit}>
              <Image source={SIGN_IN_BUTTON} resizeMode="stretch" style={s.artwork} accessible={false} />
              <Text style={s.submitText}>Sign in</Text>
            </PressableScale>
          </View>

          <View style={s.newHere}>
            <Text style={s.prompt}>New to UniFyle?</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/signup')} style={s.accountLink}>
              <Text style={s.link}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomSheet visible={forgot} onClose={closeForgot} title="Reset your password">
        {sent ? (
          <Text style={s.sub}>Check your inbox. A reset link was sent (sample).</Text>
        ) : (
          <View style={{ gap: 16 }}>
            <AuthField
              label="Email address"
              value={resetEmail}
              onChangeText={(v) => {
                setResetEmail(v);
                setResetError(undefined);
              }}
              error={resetError}
              placeholder="name@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="done"
              onSubmitEditing={sendReset}
            />
            <Button label="Send reset link" size="lg" onPress={sendReset} />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7FA' },
  artwork: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF3FE' },
  lockup: { alignItems: 'center', gap: 8, transform: [{ translateY: -18 }] },
  loadingTitle: { color: '#004EEA', fontSize: 23, fontWeight: '700', lineHeight: 28 },
  screen: { flexGrow: 1, paddingHorizontal: 36 },
  content: { width: '100%', maxWidth: 380, alignSelf: 'center' },
  head: { alignItems: 'center', gap: 24 },
  titles: { alignItems: 'center', gap: 5 },
  title: { fontSize: 23, fontWeight: '700', color: '#2965DD', textAlign: 'center' },
  sub: { fontSize: 16, color: '#2965DD', textAlign: 'center' },
  form: { marginTop: 37, gap: 16 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  link: { fontSize: 14, fontWeight: '600', color: '#235BCD' },
  submit: { minHeight: 52, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1764DD', alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  newHere: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 8 },
  prompt: { fontSize: 14, color: '#525E70' },
  accountLink: { justifyContent: 'center', minHeight: 44 },
});
