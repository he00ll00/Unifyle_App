import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBrand } from '@/components/Brand';

/**
 * The coloured band at the top of the agency page and the activity page.
 *
 * It is the agency's colour, shifting only in tone from its main shade to its dark one. There is no drawing on
 * top, so the band stays quiet and the title and buttons carry the page. `variant` is kept so both pages can
 * still ask for their own band later.
 */
export function HeroArt({ height, children }: { height: number; variant?: 'agency' | 'activity'; children?: ReactNode }) {
  const brand = useBrand();
  return (
    <View style={{ height, overflow: 'hidden' }}>
      <LinearGradient colors={[brand.primary, brand.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
