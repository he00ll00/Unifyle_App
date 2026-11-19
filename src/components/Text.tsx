import { StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps, TextStyle } from 'react-native';
import { fonts } from '@/theme';

/** Text field in Inter (same font as the rest of the app). */
export function TextInput({ style, ...rest }: TextInputProps) {
  return <RNTextInput {...rest} style={[{ fontFamily: fonts.regular }, style]} />;
}

/**
 * App text: always Inter. Custom fonts on Android ignore `fontWeight`, so the weight
 * in a style is mapped to the matching Inter file and `fontWeight` itself is cleared.
 */
export function Text({ style, ...rest }: TextProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const weight = String(flat.fontWeight ?? '400') as keyof typeof fonts.byWeight;
  const family = flat.fontFamily ?? fonts.byWeight[weight] ?? fonts.regular;
  return <RNText {...rest} style={[flat, { fontFamily: family, fontWeight: 'normal' }]} />;
}
