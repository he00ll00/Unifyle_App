import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AuthField } from '@/components/auth';
import { BottomSheet, Logo, useLogoFace } from '@/components/bits';
import { KeyboardAwareScrollView } from '@/components/keyboard';
import { Text } from '@/components/Text';
import { Button } from '@/components/ui';
import { colors } from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGO = 96;          // logo width on the sign-in screen
const BIG = 1.55;         // how much bigger it starts, in the middle of the screen

/**
 * Sign-in. Accounts sign in with an email, like the web console. Front end only for now, so a valid form
 * continues to the workspaces. Creating an account is its own step-by-step screen.
 *
 * With `intro`, this is also the launch screen: the logo appears alone in the middle of a soft gradient,
 * smiles and winks, then glides up into its place at the top while the gradient clears and the form
 * fades in. It is one screen, so the logo really is the same element the whole time. Anyone with
 * "Reduce motion" turned on just gets a gentle fade. Tap anywhere to skip it.
 */
export default function LoginView({ intro = false }: { intro?: boolean }) {
  const { height: windowH } = useWindowDimensions();
  const face = useLogoFace();

  /* ---------- form ---------- */
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

  /* ---------- intro animation ---------- */
  const [playing, setPlaying] = useState(intro);
  const logoWrap = useRef<React.ComponentRef<typeof View>>(null);
  const [dy, setDy] = useState<number | null>(null);   // how far above its place the logo starts (negative = below)

  // Logo
  const [logoOpacity] = useState(() => new Animated.Value(intro ? 0 : 1));
  const [logoScale] = useState(() => new Animated.Value(intro ? BIG * 0.8 : 1));
  const [logoY] = useState(() => new Animated.Value(0));
  const [word] = useState(() => new Animated.Value(0));
  const [gradient] = useState(() => new Animated.Value(intro ? 1 : 0));
  // The three groups that appear after the logo has landed
  const [head] = useState(() => new Animated.Value(intro ? 0 : 1));
  const [form] = useState(() => new Animated.Value(intro ? 0 : 1));
  const [foot] = useState(() => new Animated.Value(intro ? 0 : 1));
  const running = useRef<Animated.CompositeAnimation | null>(null);

  const settle = useCallback(() => {
    running.current?.stop();
    [logoOpacity, head, form, foot].forEach((v) => v.setValue(1));
    [logoScale].forEach((v) => v.setValue(1));
    [logoY, word, gradient].forEach((v) => v.setValue(0));
    setPlaying(false);
  }, [logoOpacity, logoScale, logoY, word, gradient, head, form, foot]);

  // Measure where the logo ends up, so the start position can be the middle of the screen
  const measure = useCallback(() => {
    logoWrap.current?.measureInWindow((_x, y, _w, h) => {
      if (h > 0) setDy(windowH / 2 - 24 - (y + h / 2));
    });
  }, [windowH]);

  useEffect(() => {
    if (!intro || !playing || dy === null) return undefined;
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    (async () => {
      const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;
      const fade = (v: Animated.Value, to: number, duration: number, delay = 0) =>
        Animated.timing(v, { toValue: to, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });

      if (reduce) {
        logoY.setValue(0);
        logoScale.setValue(1);
        gradient.setValue(0);
        running.current = Animated.parallel([fade(logoOpacity, 1, 250), fade(head, 1, 250), fade(form, 1, 250), fade(foot, 1, 250)]);
        running.current.start(() => !cancelled && setPlaying(false));
        return;
      }

      logoY.setValue(dy);
      const rise = (v: Animated.Value) => Animated.parallel([fade(v, 1, 380)]);
      running.current = Animated.sequence([
        // 1. The logo appears in the middle, growing a little, with its name under it
        Animated.parallel([
          fade(logoOpacity, 1, 380),
          Animated.spring(logoScale, { toValue: BIG, friction: 6, tension: 70, useNativeDriver: true }),
          fade(word, 1, 420, 200),
        ]),
        Animated.delay(1000),   // the wink happens during this pause
        // 2. It glides up into place; the gradient clears; the form fades in
        Animated.parallel([
          fade(word, 0, 220),
          Animated.timing(logoY, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(gradient, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.stagger(110, [Animated.sequence([Animated.delay(420), rise(head)]), Animated.sequence([Animated.delay(420), rise(form)]), Animated.sequence([Animated.delay(420), rise(foot)])]),
        ]),
      ]);
      running.current.start(({ finished }) => finished && !cancelled && setPlaying(false));
      timers = [setTimeout(() => face.wink(), 750)];
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      running.current?.stop();
    };
  }, [intro, playing, dy, face, logoOpacity, logoScale, logoY, word, gradient, head, form, foot]);

  // If measuring never answers (rare), start anyway from where the logo is
  useEffect(() => {
    if (!intro) return undefined;
    const t = setTimeout(() => setDy((d) => d ?? 0), 500);
    return () => clearTimeout(t);
  }, [intro]);

  // After the intro, an occasional friendly blink while the screen is open
  useEffect(() => {
    if (playing) return undefined;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        face.blink();
        next();
      }, 4500 + Math.random() * 3500);
    };
    next();
    return () => clearTimeout(t);
  }, [playing, face]);

  const rise = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {intro && playing ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: gradient }]}>
          <LinearGradient colors={['#FFFFFF', '#DCE7FB']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}

      <KeyboardAwareScrollView bottomOffset={32} contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} scrollEnabled={!playing}>
        {/* 1. Who we are and what this screen is */}
        <View style={s.head}>
          <Animated.View style={{ opacity: logoOpacity, transform: [{ translateY: logoY }, { scale: logoScale }] }}>
            <View ref={logoWrap} onLayout={measure}>
              <Pressable accessibilityRole="image" accessibilityLabel="UniFyle logo" onPress={face.wink} disabled={playing}>
                <Logo size={LOGO} face={face} />
              </Pressable>
            </View>
          </Animated.View>
          <Animated.View style={[s.titles, rise(head)]}>
            <Text style={s.title} accessibilityRole="header">
              Welcome back
            </Text>
            <Text style={s.sub}>Sign in to continue</Text>
          </Animated.View>
        </View>

        {/* 2. The one thing to do here */}
        <Animated.View style={[s.form, rise(form)]}>
          <AuthField
            label="Email address"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            placeholder="name@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <View style={{ gap: 4 }}>
            <AuthField
              label="Password"
              secure
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              error={errors.password}
              placeholder="Your password"
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
          <Button label="Sign in" size="lg" onPress={signIn} />
        </Animated.View>

        {/* 3. The way in for new people, clearly second */}
        <Animated.View style={[s.newHere, rise(foot)]}>
          <View style={s.divider}>
            <View style={s.line} />
            <Text style={s.dividerText}>New to UniFyle?</Text>
            <View style={s.line} />
          </View>
          <Button label="Create an account" variant="soft" size="lg" onPress={() => router.push('/signup')} />
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* The name under the logo, only while it sits in the middle */}
      {intro && playing ? (
        <Animated.View pointerEvents="none" style={[s.wordWrap, { top: windowH / 2 - 24 + LOGO * BIG * 0.5 + 18, opacity: word }]}>
          <Text style={s.word}>UNIFYLE</Text>
        </Animated.View>
      ) : null}

      {/* Tap anywhere to skip the intro */}
      {intro && playing ? <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={settle} style={StyleSheet.absoluteFill} /> : null}

      <BottomSheet visible={forgot} onClose={closeForgot} title="Reset your password" subtitle="We’ll send a reset link to your email.">
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
  screen: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 32 },
  head: { alignItems: 'center', gap: 6 },
  titles: { alignItems: 'center', gap: 6, marginTop: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sub: { fontSize: 17, color: colors.muted },
  form: { gap: 18 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  link: { fontSize: 15, fontWeight: '600', color: colors.primary },
  newHere: { gap: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 14, color: colors.muted },
  wordWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  word: { fontSize: 20, fontWeight: '700', letterSpacing: 3, color: colors.primary },
});
