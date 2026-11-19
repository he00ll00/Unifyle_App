import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStoreProvider } from '@/store/AppStore';
import { colors } from '@/theme';

export default function RootLayout() {
  // Every screen uses Inter, so wait for it before drawing anything.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          {/* Splash and login, then the workspace picker: standalone pages, no navigation bar. */}
          <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="workspaces" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          {/* Organization dashboard: has its own themed tab navigation. */}
          <Stack.Screen name="org/[agencyId]" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="certificates" options={{ title: 'My certificates' }} />
          <Stack.Screen name="scanner" options={{ title: 'Scan session QR', animation: 'fade' }} />
        </Stack>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
