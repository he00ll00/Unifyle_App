import { Stack, useLocalSearchParams } from 'expo-router';
import { useBrand } from '@/components/Brand';
import { HeaderBack } from '@/components/HeaderBack';
import { colors } from '@/theme';

/** Back arrow of the activity screen. It always shows: with nothing to go back to, it goes to the organization page. */
function ActivityBack() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const brand = useBrand();
  return <HeaderBack color={brand.dark} fallback={{ pathname: '/org/[agencyId]/org-profile', params: { agencyId } }} />;
}

/**
 * Dashboard stack. The activity workspace lives here instead of
 * as hidden tabs, because hidden tabs redirect back to the first tab. The organization's
 * tab bar stays visible since this stack is inside the tabs.
 */
export default function HomeStack() {
  const brand = useBrand();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: brand.dark,
        headerTitleStyle: { color: brand.dark, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="activity/[id]" options={{ title: 'Activity workspace', headerLeft: () => <ActivityBack /> }} />
    </Stack>
  );
}
