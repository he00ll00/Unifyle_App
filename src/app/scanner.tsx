import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { Button } from '@/components/ui';
import { sessionByCode } from '@/data/sample';
import { colors } from '@/theme';

/** Scanner screen, front end only: no camera. Tap the frame to try a sample scan. */
export default function Scanner() {
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  // Fallback when the camera is not working: type the session code shown by the facilitator.
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [matched, setMatched] = useState('PM session');

  const submitCode = () => {
    const found = sessionByCode(code);
    if (!found) return setCodeError(true);
    setMatched(found.title);
    setScanned(true);
  };

  // After a sample scan, show the result for a moment and return to check-in.
  useEffect(() => {
    if (!scanned) return;
    const t = setTimeout(() => router.back(), 1600);
    return () => clearTimeout(t);
  }, [scanned]);

  return (
    <View style={styles.screen}>
      <View style={styles.viewfinder}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try a sample scan"
          onPress={() => setScanned(true)}
          style={styles.frame}
        >
          <View style={[styles.corner, styles.tl, scanned && styles.ok]} />
          <View style={[styles.corner, styles.tr, scanned && styles.ok]} />
          <View style={[styles.corner, styles.bl, scanned && styles.ok]} />
          <View style={[styles.corner, styles.br, scanned && styles.ok]} />
          {scanned && (
            <View style={styles.result}>
              <Ionicons name="checkmark-circle" size={72} color="#4ADE80" />
            </View>
          )}
        </Pressable>
        <Text style={styles.hint}>
          {scanned ? `Checked in · ${matched} (sample). Saved on this device.` : 'Point the camera at the facilitator’s QR code'}
        </Text>
        {!scanned && <Text style={styles.tip}>No camera yet: tap the frame to try a sample scan</Text>}
        {!scanned && (
          <View style={styles.codeWrap}>
            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setCodeError(false);
              }}
              placeholder="Or type the session code, e.g. RUB-2032"
              placeholderTextColor={colors.icon}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={submitCode}
              style={[styles.codeInput, codeError && { borderColor: '#F87171' }]}
            />
            {codeError && <Text style={styles.codeError}>That session code is not valid.</Text>}
            <Button label="Check in with code" variant="soft" disabled={!code.trim()} onPress={submitCode} />
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
          onPress={() => setTorch((v) => !v)}
          style={[styles.round, torch && { backgroundColor: '#FDE68A' }]}
        >
          <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color={torch ? '#92400E' : '#fff'} />
        </Pressable>
        <Button label="Close" variant="soft" onPress={() => router.back()} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const C = 28;
const W = 4;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827', padding: 20, paddingBottom: 32 },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  frame: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: C, height: C, borderColor: '#fff' },
  ok: { borderColor: '#4ADE80' },
  tl: { top: 0, left: 0, borderTopWidth: W, borderLeftWidth: W, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: W, borderRightWidth: W, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: W, borderLeftWidth: W, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: W, borderRightWidth: W, borderBottomRightRadius: 12 },
  result: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#fff', fontSize: 14, textAlign: 'center', maxWidth: 280 },
  tip: { color: colors.icon, fontSize: 12, textAlign: 'center', maxWidth: 260 },
  codeWrap: { alignSelf: 'stretch', gap: 8 },
  codeInput: { minHeight: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: '#fff', letterSpacing: 1 },
  codeError: { color: '#F87171', fontSize: 12 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
