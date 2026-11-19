import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/Text';
import { Logo } from '@/components/bits';
import { colors } from '@/theme';

/** Splash screen: shows the UNIFYLE mark, then continues to login. */
export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/login'), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={['#FFFFFF', '#DCE7FB']} style={styles.screen}>
      <Logo size={150} />
      <Text style={styles.name}>UNIFYLE</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  name: { fontSize: 20, fontWeight: '700', letterSpacing: 3, color: colors.primary },
});
