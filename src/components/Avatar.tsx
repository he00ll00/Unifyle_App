import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Text';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** The participant's round profile picture, or their initials when they have not set a photo. */
export function Avatar({ name, size = 40, style }: { name: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const { avatarUri } = useStore();
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[s.base, round, style]} accessibilityLabel={`${name} profile picture`}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={round} />
      ) : (
        <Text style={[s.initials, { fontSize: Math.round(size * 0.36) }]}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  base: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: '#fff', fontWeight: '600' },
});
