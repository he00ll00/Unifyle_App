import { ReactNode } from 'react';
import { KeyboardAvoidingView as RNKeyboardAvoidingView, KeyboardAvoidingViewProps, Platform, ScrollView, ScrollViewProps, StyleProp, View, ViewStyle } from 'react-native';

/**
 * Keyboard handling for every screen with text fields.
 *
 * React Native's own KeyboardAvoidingView resizes the screen after the keyboard has already started to
 * move, and again every time you jump to another field (the keyboard's size changes a little), which
 * is what made the fields twitch. `react-native-keyboard-controller` reads the keyboard's real position
 * on every frame, so everything moves together with it.
 *
 * It is loaded safely: if the native part is missing (for example an older Expo Go), these fall back
 * to plain React Native behaviour instead of crashing the app.
 */
type Lib = typeof import('react-native-keyboard-controller');
let lib: Lib | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  lib = require('react-native-keyboard-controller') as Lib;
} catch {
  lib = null;
}

/** Wrap the whole app once. */
export function KeyboardProvider({ children }: { children: ReactNode }) {
  if (!lib || Platform.OS === 'web') return <>{children}</>;
  return <lib.KeyboardProvider>{children}</lib.KeyboardProvider>;
}

/** Scrolling form: the focused field is kept above the keyboard, moving in step with it. */
export function KeyboardAwareScrollView({ bottomOffset = 24, ...props }: ScrollViewProps & { bottomOffset?: number }) {
  if (!lib || Platform.OS === 'web') return <ScrollView automaticallyAdjustKeyboardInsets {...props} />;
  return <lib.KeyboardAwareScrollView bottomOffset={bottomOffset} {...props} />;
}

/** A footer (like the main button) that rides up and down with the keyboard. */
export function KeyboardStickyView({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  if (!lib || Platform.OS === 'web') return <View style={style}>{children}</View>;
  return <lib.KeyboardStickyView style={style}>{children}</lib.KeyboardStickyView>;
}

/** For sheets and dialogs that hold a field: lifts the content above the keyboard. */
export function KeyboardAvoiding(props: KeyboardAvoidingViewProps) {
  if (!lib || Platform.OS === 'web') return <RNKeyboardAvoidingView {...props} behavior={Platform.OS === 'ios' ? 'padding' : undefined} />;
  return <lib.KeyboardAvoidingView {...props} behavior="padding" />;
}
