import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Back arrow for the header of screens opened from Workspaces (profile, notifications, settings...).
 * It goes back one screen. When there is nothing to go back to (the app was reloaded or opened on this
 * screen), it goes to the workspaces instead of leaving the person stuck.
 */
export function HeaderBack({ fallback = '/workspaces', color = colors.text }: { fallback?: Href; color?: string }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      style={s.btn}
    >
      <Ionicons name="chevron-back" size={24} color={color} />
    </PressableScale>
  );
}

const s = StyleSheet.create({
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
