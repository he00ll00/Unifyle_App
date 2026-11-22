import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { AuthField, ChoiceList, PickerField, PickOption, StepScreen } from '@/components/auth';
import { Logo } from '@/components/bits';
import { Text } from '@/components/Text';
import { Button } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Create an account, one small step at a time. The fields are the ones our data model keeps for a
 * participant: user (name, email, password, contact) and participant_profile (sex, birth date,
 * province, municipality). Category and affiliation are not asked here: they come from the
 * invitation code when the participant joins an agency.
 *
 * Front end only for now. Answers (never the password) are saved on the phone, so someone who is
 * interrupted can come back and carry on.
 */

type Form = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
  sex: string;
  day: string;
  month: string;
  year: string;
  province: string;
  municipality: string;
  contact: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { firstName: '', middleName: '', lastName: '', email: '', password: '', confirm: '', sex: '', day: '', month: '', year: '', province: '', municipality: '', contact: '' };
const DRAFT_KEY = 'unifyle.signup.draft.v1';
const TOTAL = 6;          // numbered steps; the welcome and the final screen are not counted
const DONE = TOTAL + 1;
const SEX = ['Male', 'Female', 'Prefer not to say'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE = /^(\+?63|0)9\d{9}$/;

const DAYS: PickOption[] = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const MONTH_OPTIONS: PickOption[] = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
const THIS_YEAR = new Date().getFullYear();
const YEARS: PickOption[] = Array.from({ length: THIS_YEAR - 5 - 1920 + 1 }, (_, i) => String(THIS_YEAR - 5 - i)).map((y) => ({ value: y, label: y }));

/** The date, or null when the day does not exist (31 February) or is in the future. */
function toDate(f: Pick<Form, 'day' | 'month' | 'year'>) {
  const [d, m, y] = [Number(f.day), Number(f.month), Number(f.year)];
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d || date > new Date()) return null;
  return date;
}
const niceDate = (f: Pick<Form, 'day' | 'month' | 'year'>) => (toDate(f) ? `${MONTHS[Number(f.month) - 1]} ${f.day}, ${f.year}` : '');

/** What is wrong on a step, in plain sentences. An empty object means it is fine to continue. */
function check(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!f.firstName.trim()) e.firstName = 'Enter your first name.';
    if (!f.lastName.trim()) e.lastName = 'Enter your last name.';
  } else if (step === 2) {
    if (!f.email.trim()) e.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(f.email.trim())) e.email = 'That email doesn’t look right. It should look like name@email.com.';
  } else if (step === 3) {
    if (f.password.length < 8) e.password = 'Use at least 8 characters.';
    if (!f.confirm) e.confirm = 'Type your password again.';
    else if (f.confirm !== f.password) e.confirm = 'The two passwords don’t match.';
  } else if (step === 4) {
    if (!f.sex) e.sex = 'Choose one.';
    if (!f.day || !f.month || !f.year) e.day = 'Choose your day, month and year of birth.';
    else if (!toDate(f)) e.day = 'That date doesn’t exist. Check the day and month.';
  } else if (step === 5) {
    if (!f.province.trim()) e.province = 'Enter your province.';
    if (!f.municipality.trim()) e.municipality = 'Enter your municipality or city.';
    const digits = f.contact.replace(/[\s-]/g, '');
    if (digits && !PH_MOBILE.test(digits)) e.contact = 'Enter a mobile number like 0917 123 4567, or leave it empty.';
  }
  return e;
}

export default function Signup() {
  const [step, setStep] = useState(0);
  const [forward, setForward] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);
  const [needPassword, setNeedPassword] = useState(false);   // resumed after the password step: it was never saved
  const stepRef = useRef(0);   // the current step, for the Android back button handler
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    const keys = Object.keys(patch) as (keyof Form)[];
    setErrors((e) => {
      const next = { ...e };
      keys.forEach((k) => delete next[k]);
      if (keys.some((k) => k === 'day' || k === 'month' || k === 'year')) delete next.day;
      if (keys.includes('password')) delete next.confirm;
      return next;
    });
  };

  // Resume an unfinished sign-up (the password is never saved)
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (live && raw) {
          const d = JSON.parse(raw) as { form?: Partial<Form>; step?: number };
          setForm({ ...EMPTY, ...d.form });
          if (d.step && d.step >= 1 && d.step <= TOTAL) {
            // The password is never saved, so anyone who got past that step types it again
            if (d.step > 3) {
              setStep(3);
              setNeedPassword(true);
            } else setStep(d.step);
          }
        }
      } catch {}
      if (live) setReady(true);
    })();
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || step === 0 || step === DONE) return;
    const { password, confirm, ...safe } = form;
    void password;
    void confirm;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ form: safe, step })).catch(() => {});
  }, [form, step, ready]);

  const go = useCallback((to: number) => {
    setForward(to >= stepRef.current);
    setStep(to);
  }, []);

  const back = useCallback(() => {
    if (stepRef.current <= 0) router.replace('/login');
    else go(stepRef.current - 1);
  }, [go]);

  // Android back button goes to the previous step instead of leaving the whole form
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stepRef.current === DONE) return true;
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  const next = () => {
    const e = check(step, form);
    setErrors(e);
    if (Object.keys(e).length === 0) go(step + 1);
  };

  const create = async () => {
    setCreating(true);
    await new Promise((r) => setTimeout(r, 900));   // stands in for the server
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    setCreating(false);
    go(DONE);
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  /* ---------- welcome ---------- */
  if (step === 0)
    return (
      <StepScreen
        stepKey={0}
        title="Create your account"
        subtitle="It takes about 3 minutes. You only do this once, and one account works for every agency."
        onBack={back}
        footer={
          <>
            <Button label="Let’s start" size="lg" onPress={() => go(1)} />
            <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={s.footLink}>
              <Text style={s.footText}>
                Already have an account? <Text style={s.link}>Sign in</Text>
              </Text>
            </Pressable>
          </>
        }
      >
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Logo size={96} />
        </View>
        <View style={s.panel}>
          <Text style={s.panelTitle}>Have these ready</Text>
          {['Your full name', 'Your email address', 'Your date of birth', 'Where you live (province and municipality)'].map((t) => (
            <View key={t} style={s.bullet}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <Text style={s.bulletText}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={s.note}>You can stop at any time. We keep your answers on this phone so you can continue later.</Text>
      </StepScreen>
    );

  /* ---------- finished ---------- */
  if (step === DONE)
    return (
      <StepScreen
        stepKey={DONE}
        title={`You’re all set, ${form.firstName.trim() || 'friend'}!`}
        subtitle="Your account is ready. Next, join your agency using the invitation code they gave you, or accept an invitation sent to your email."
        onBack={() => router.replace('/workspaces')}
        footer={<Button label="Go to my workspaces" size="lg" onPress={() => router.replace('/workspaces')} />}
      >
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={s.successCircle}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </View>
        </View>
        <View style={s.panel}>
          <Text style={s.panelTitle}>How to join an agency</Text>
          <Text style={s.bulletText}>In your workspaces, tap the + button and type the invitation code. If an agency already invited your email, it will be waiting there for you.</Text>
        </View>
        <Text style={s.note}>This is a preview. Nothing is sent to a server yet.</Text>
      </StepScreen>
    );

  /* ---------- steps 1 to 6 ---------- */
  const isReview = step === TOTAL;
  const footer = (
    <Button
      label={isReview ? (creating ? 'Creating your account…' : 'Create my account') : 'Continue'}
      size="lg"
      disabled={creating}
      onPress={isReview ? create : next}
    />
  );

  return (
    <StepScreen stepKey={step} forward={forward} progress={{ step, total: TOTAL }} onBack={back} footer={footer} {...copy(step)} {...(step === 3 && needPassword ? { subtitle: 'Welcome back! For your safety we don’t save your password, so please type it again.' } : {})}>
      {step === 1 && (
        <>
          <AuthField label="First name" value={form.firstName} onChangeText={(v) => set({ firstName: v })} error={errors.firstName} autoCapitalize="words" autoComplete="given-name" textContentType="givenName" returnKeyType="next" autoFocus />
          <AuthField label="Middle name" optional value={form.middleName} onChangeText={(v) => set({ middleName: v })} autoCapitalize="words" textContentType="middleName" returnKeyType="next" />
          <AuthField label="Last name" value={form.lastName} onChangeText={(v) => set({ lastName: v })} error={errors.lastName} autoCapitalize="words" autoComplete="family-name" textContentType="familyName" returnKeyType="done" onSubmitEditing={next} />
        </>
      )}

      {step === 2 && (
        <AuthField
          label="Email address"
          value={form.email}
          onChangeText={(v) => set({ email: v })}
          error={errors.email}
          hint="You will use this to sign in. It also lets agencies send you invitations."
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={next}
          autoFocus
        />
      )}

      {step === 3 && (
        <>
          <AuthField label="Password" secure value={form.password} onChangeText={(v) => set({ password: v })} error={errors.password} hint="At least 8 characters. A short sentence you can remember works well." autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" returnKeyType="next" autoFocus />
          <AuthField label="Type your password again" secure value={form.confirm} onChangeText={(v) => set({ confirm: v })} error={errors.confirm} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={next} />
        </>
      )}

      {step === 4 && (
        <>
          <ChoiceList label="Sex" options={SEX} value={form.sex} onChange={(v) => set({ sex: v })} error={errors.sex} />
          <View style={{ gap: 10 }}>
            <Text style={s.groupLabel}>Date of birth</Text>
            <PickerField hideLabel label="Month" title="Month of birth" value={form.month} placeholder="Month" options={MONTH_OPTIONS} onSelect={(v) => set({ month: v })} error={errors.day} />
            <View style={s.dateRow}>
              <View style={{ flex: 1 }}>
                <PickerField hideLabel label="Day" title="Day of birth" value={form.day} placeholder="Day" options={DAYS} onSelect={(v) => set({ day: v })} error={errors.day} />
              </View>
              <View style={{ flex: 1 }}>
                <PickerField hideLabel label="Year" title="Year of birth" value={form.year} placeholder="Year" options={YEARS} onSelect={(v) => set({ year: v })} error={errors.day} />
              </View>
            </View>
            {errors.day ? (
              <View style={s.msgRow} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={s.error}>{errors.day}</Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      {step === 5 && (
        <>
          <AuthField label="Province" value={form.province} onChangeText={(v) => set({ province: v })} error={errors.province} placeholder="e.g. Zamboanga Sibugay" autoCapitalize="words" returnKeyType="next" autoFocus />
          <AuthField label="Municipality or city" value={form.municipality} onChangeText={(v) => set({ municipality: v })} error={errors.municipality} placeholder="e.g. Ipil" autoCapitalize="words" returnKeyType="next" />
          <AuthField label="Mobile number" optional value={form.contact} onChangeText={(v) => set({ contact: v })} error={errors.contact} hint="So your agency can reach you about activities." placeholder="0917 123 4567" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" returnKeyType="done" onSubmitEditing={next} />
        </>
      )}

      {step === 6 && <Review form={form} onChange={(to) => go(to)} />}
    </StepScreen>
  );
}

function copy(step: number): { title: string; subtitle?: string } {
  return (
    [
      { title: '' },
      { title: 'What is your name?', subtitle: 'Write it the way it appears on your ID.' },
      { title: 'What is your email address?' },
      { title: 'Choose a password', subtitle: 'You will use it to sign in.' },
      { title: 'A little about you' },
      { title: 'Where do you live?' },
      { title: 'Check your details', subtitle: 'Make sure everything is right, then create your account. You can tap Change to fix anything.' },
    ][step] ?? { title: '' }
  );
}

function Review({ form, onChange }: { form: Form; onChange: (step: number) => void }) {
  const name = [form.firstName, form.middleName, form.lastName].map((x) => x.trim()).filter(Boolean).join(' ');
  const rows: { step: number; label: string; value: string }[] = [
    { step: 1, label: 'Name', value: name },
    { step: 2, label: 'Email', value: form.email.trim() },
    { step: 3, label: 'Password', value: '••••••••' },
    { step: 4, label: 'Sex', value: form.sex },
    { step: 4, label: 'Date of birth', value: niceDate(form) },
    { step: 5, label: 'Province', value: form.province.trim() },
    { step: 5, label: 'Municipality or city', value: form.municipality.trim() },
    { step: 5, label: 'Mobile number', value: form.contact.trim() || 'Not given' },
  ];
  return (
    <View style={s.panel}>
      {rows.map((r, i) => (
        <View key={r.label} style={[s.reviewRow, i > 0 && s.reviewDivider]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.reviewLabel}>{r.label}</Text>
            <Text style={s.reviewValue}>{r.value}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Change ${r.label}`} onPress={() => onChange(r.step)} hitSlop={8} style={s.change}>
            <Text style={s.link}>Change</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: colors.bg, borderRadius: 16, padding: 18, gap: 14 },
  panelTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { flex: 1, fontSize: 17, lineHeight: 24, color: colors.text },
  note: { fontSize: 15, lineHeight: 22, color: colors.muted },
  footLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  footText: { fontSize: 15, color: colors.muted },
  link: { fontSize: 15, fontWeight: '600', color: colors.primary },
  successCircle: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  dateRow: { flexDirection: 'row', gap: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  error: { flex: 1, fontSize: 14, color: colors.danger },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewDivider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  reviewLabel: { fontSize: 14, color: colors.muted },
  reviewValue: { fontSize: 17, color: colors.text },
  change: { minHeight: 44, minWidth: 64, alignItems: 'flex-end', justifyContent: 'center' },
});
