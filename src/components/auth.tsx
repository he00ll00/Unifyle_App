import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInputProps, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from '@/components/keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/bits';
import { Text, TextInput } from '@/components/Text';
import { PressableScale } from '@/components/ui';
import { colors, radius } from '@/theme';

/**
 * Building blocks for sign-in and sign-up. They are sized for everyone, including older users:
 * labels sit above the field (never only as a placeholder), fields are 56 px tall, text is 17 px,
 * and an error is a full sentence with an icon, not just a red border.
 */

/* ------------------------------ Text field ------------------------------ */

type FieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  /** Uses an inline placeholder while keeping the accessible field label. */
  compact?: boolean;
  /** Password field: adds the Show / Hide button inside the field. */
  secure?: boolean;
};

export function AuthField({ label, optional, error, hint, secure, compact, ...input }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={s.field}>
      {!compact && (
        <Text style={s.label}>
          {label}
          {optional ? <Text style={s.optional}>  (optional)</Text> : null}
        </Text>
      )}
      <View style={[s.box, compact && s.compactBox, focused && s.boxFocus, !!error && s.boxError]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secure && !shown}
          placeholderTextColor={colors.icon}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[s.input, compact && s.compactInput]}
        />
        {secure ? (
          <Pressable accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'} onPress={() => setShown((v) => !v)} hitSlop={8} style={s.toggle}>
            <Text style={[s.toggleText, compact && s.compactToggle]}>{shown ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      <Message error={error} hint={hint} />
    </View>
  );
}

/** One line under a field: the error if there is one, otherwise the hint. */
function Message({ error, hint }: { error?: string; hint?: string }) {
  if (error)
    return (
      <View style={s.msgRow} accessibilityLiveRegion="polite">
        <Ionicons name="alert-circle" size={16} color={colors.danger} />
        <Text style={s.error}>{error}</Text>
      </View>
    );
  return hint ? <Text style={s.hint}>{hint}</Text> : null;
}

/* ------------------------------ Picker (opens a list) ------------------------------ */

export type PickOption = { value: string; label: string };

/** Looks like a field; tapping it opens a list in a bottom sheet, so nobody has to type. */
export function PickerField({
  label,
  title,
  value,
  placeholder,
  options,
  onSelect,
  error,
  hideLabel,
}: {
  label: string;
  title?: string;
  value: string;
  placeholder: string;
  options: PickOption[];
  onSelect: (v: string) => void;
  error?: string;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={[s.field, hideLabel && { gap: 0 }]}>
      {hideLabel ? null : <Text style={s.label}>{label}</Text>}
      <PressableScale scaleTo={0.99} accessibilityRole="button" accessibilityLabel={`${label}: ${current?.label ?? 'not chosen'}`} onPress={() => setOpen(true)} style={[s.box, !!error && s.boxError]}>
        <Text style={[s.input, s.pickText, !current && { color: colors.icon }]} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </PressableScale>
      {hideLabel ? null : <Message error={error} />}
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={title ?? label}>
        <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
          {options.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  onSelect(o.value);
                  setOpen(false);
                }}
                style={[s.option, on && s.optionOn]}
              >
                <Text style={[s.optionText, on && { color: colors.primary, fontWeight: '600' }]}>{o.label}</Text>
                {on ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

/* ------------------------------ Choice list (few options, all visible) ------------------------------ */

export function ChoiceList({ label, options, value, onChange, error }: { label: string; options: string[]; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={{ gap: 10 }}>
        {options.map((o) => {
          const on = o === value;
          return (
            <PressableScale key={o} scaleTo={0.98} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o)} style={[s.choice, on && s.choiceOn]}>
              <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
              <Text style={[s.choiceText, on && { color: colors.primary, fontWeight: '600' }]}>{o}</Text>
            </PressableScale>
          );
        })}
      </View>
      <Message error={error} />
    </View>
  );
}

/* ------------------------------ Page layout ------------------------------ */

/**
 * One step of a form: back button and progress at the top, a big title, the content, and the
 * main button pinned at the bottom (so it is always in the same place). The content slides in
 * from the side each time `stepKey` changes.
 */
export function StepScreen({
  stepKey,
  forward = true,
  progress,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: {
  stepKey: string | number;
  forward?: boolean;
  progress?: { step: number; total: number };
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [stepKey, t]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} scaleTo={0.9} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </PressableScale>
        {progress ? (
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={s.stepText}>
              Step {progress.step} of {progress.total}
            </Text>
            <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.step }}>
              <View style={[s.trackFill, { width: `${(progress.step / progress.total) * 100}%` }]} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={s.back} />
      </View>

      <KeyboardAwareScrollView bottomOffset={130} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: t, transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [forward ? 28 : -28, 0] }) }], gap: 22 }}>
          <View style={{ gap: 8 }}>
            <Text style={s.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
          {children}
        </Animated.View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View style={[s.footer, { paddingBottom: insets.bottom + 14 }]}>{footer}</View>
      </KeyboardStickyView>
    </View>
  );
}

const s = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  optional: { fontSize: 14, fontWeight: '400', color: colors.muted },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
  },
  compactBox: { height: 52, backgroundColor: '#F0F0F0', borderColor: 'transparent', paddingHorizontal: 15 },
  compactInput: { height: 48, fontSize: 15 },
  compactToggle: { fontSize: 13 },
  boxFocus: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  input: { flex: 1, height: 56, paddingVertical: 0, paddingHorizontal: 0, fontSize: 17, color: colors.text, outlineWidth: 0 },
  pickText: { textAlignVertical: 'center', lineHeight: 56 },
  toggle: { minHeight: 40, justifyContent: 'center' },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  error: { flex: 1, fontSize: 14, color: colors.danger },
  hint: { fontSize: 14, color: colors.muted },

  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, paddingHorizontal: 12, borderRadius: radius.md },
  optionOn: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: 17, color: colors.text },

  choice: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 16, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, backgroundColor: '#fff' },
  choiceOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceText: { fontSize: 17, color: colors.text },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.icon, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 8 },
  back: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 14, color: colors.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 17, lineHeight: 25, color: colors.muted },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#fff' },
});
