import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { useBrand } from '@/components/Brand';

/**
 * The coloured band at the top of the agency page and the activity page.
 *
 * It is the agency's colour with a quiet drawing on top, made only of shapes (rings, a soft wave and a field of
 * dots) in white at low opacity, so it stays formal and never competes with the text. `variant` changes the
 * composition so the two pages are related but not identical. The drawing is cropped, not stretched, so it
 * looks the same on every phone width.
 */
export function HeroArt({ height, variant = 'agency', children }: { height: number; variant?: 'agency' | 'activity'; children?: ReactNode }) {
  const brand = useBrand();
  const rings = variant === 'agency';
  return (
    <View style={{ height, overflow: 'hidden' }}>
      <LinearGradient colors={[brand.primary, brand.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 390 220" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1.6" fill="#FFFFFF" fillOpacity={0.28} />
          </Pattern>
        </Defs>

        {/* Rings from the top-right corner (agency) or the left edge (activity) */}
        <G fill="none" stroke="#FFFFFF" strokeWidth={1.4}>
          {rings ? (
            <>
              <Circle cx={340} cy={-6} r={170} strokeOpacity={0.14} />
              <Circle cx={340} cy={-6} r={122} strokeOpacity={0.16} />
              <Circle cx={340} cy={-6} r={76} strokeOpacity={0.2} />
            </>
          ) : (
            <>
              <Circle cx={-10} cy={40} r={150} strokeOpacity={0.12} />
              <Circle cx={-10} cy={40} r={104} strokeOpacity={0.15} />
              <Circle cx={-10} cy={40} r={60} strokeOpacity={0.18} />
            </>
          )}
        </G>

        {/* A field of dots, fading out by being clipped to a small block */}
        <Rect x={rings ? 22 : 250} y={rings ? 118 : 24} width={112} height={64} fill="url(#dots)" />

        {/* A soft wave along the bottom edge */}
        <Path d="M0 176 C 70 146, 150 206, 240 172 S 350 150, 390 166 L390 220 L0 220 Z" fill="#FFFFFF" fillOpacity={0.09} />
        <Path d="M0 196 C 90 172, 170 218, 260 192 S 360 176, 390 186 L390 220 L0 220 Z" fill="#FFFFFF" fillOpacity={0.07} />
      </Svg>
      {children}
    </View>
  );
}
