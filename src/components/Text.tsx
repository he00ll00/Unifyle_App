import { StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps, TextStyle } from 'react-native';
import { useSettings } from '@/store/Settings';
import { fonts } from '@/theme';

/** Sizes in a style, multiplied by the person's text size setting. */
function scaled(flat: TextStyle, scale: number): TextStyle {
  if (scale === 1) return flat;
  return {
    ...flat,
    fontSize: flat.fontSize ? Math.round(flat.fontSize * scale * 10) / 10 : flat.fontSize,
    lineHeight: flat.lineHeight ? Math.round(flat.lineHeight * scale * 10) / 10 : flat.lineHeight,
  };
}

/** Text field in Inter (same font as the rest of the app). */
export function TextInput({ style, ...rest }: TextInputProps) {
  const { scale } = useSettings();
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  return <RNTextInput {...rest} style={[{ fontFamily: fonts.regular }, scaled(flat, scale)]} />;
}

/**
 * App text: always Inter. Custom fonts on Android ignore `fontWeight`, so the weight
 * in a style is mapped to the matching Inter file and `fontWeight` itself is cleared.
 */
export function Text({ style, ...rest }: TextProps) {
  const { scale } = useSettings();
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const weight = String(flat.fontWeight ?? '400') as keyof typeof fonts.byWeight;
  const family = flat.fontFamily ?? fonts.byWeight[weight] ?? fonts.regular;
  return <RNText {...rest} style={[scaled(flat, scale), { fontFamily: family, fontWeight: 'normal' }]} />;
}
