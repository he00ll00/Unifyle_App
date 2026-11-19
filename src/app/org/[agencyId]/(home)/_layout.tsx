import { Stack } from 'expo-router';
import { colors } from '@/theme';

/**
 * Dashboard stack. The activity workspace lives here instead of
 * as hidden tabs, because hidden tabs redirect back to the first tab. The organization's
 * tab bar stays visible since this stack is inside the tabs.
 */
export default function HomeStack() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="activity/[id]" options={{ title: 'Activity workspace' }} />
    </Stack>
  );
}
