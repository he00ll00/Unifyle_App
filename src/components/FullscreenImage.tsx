import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrand } from '@/components/Brand';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/ui';
import type { Agency } from '@/data/mock';

/**
 * An organization's logo or cover shown full screen, like opening a profile or cover photo on Facebook:
 * just the picture and a close button.
 */
export function FullscreenImage({ kind, agency, onClose }: { kind: 'logo' | 'cover' | null; agency: Agency; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const brand = useBrand();

  return (
    <Modal visible={kind !== null} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.screen}>
        {kind === 'cover' ? (
          <LinearGradient colors={[brand.primary, brand.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} accessibilityLabel={`${agency.name} cover`} />
        ) : (
          <View style={s.center}>
            <View style={[s.logo, { backgroundColor: agency.logoColor ?? brand.dark }]} accessibilityLabel={`${agency.name} logo`}>
              <Text style={s.logoText} numberOfLines={1} adjustsFontSizeToFit>
                {agency.short}
              </Text>
            </View>
          </View>
        )}
        <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.close, { top: insets.top + 12 }]}>
          <Ionicons name="close" size={24} color="#fff" />
        </PressableScale>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // A square that is 80% of the screen width, up to 360, so it is centered on every phone.
  logo: { width: '80%', maxWidth: 360, aspectRatio: 1, borderRadius: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  logoText: { color: '#fff', fontSize: 80, fontWeight: '700' },
  close: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
