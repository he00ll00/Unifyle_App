import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAvoiding } from '@/components/keyboard';
import { Text, TextInput } from '@/components/Text';
import { Button, Chip } from '@/components/ui';
import { participantCategories } from '@/data/sample';
import { useStore } from '@/store/AppStore';
import { colors, radius, shadow } from '@/theme';

/** Floating card opened by the + button: add a new organization with a code. */
export function JoinOrgModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { joinAgency } = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  // Codes without a preset category ask the participant to pick one.
  const [askCategory, setAskCategory] = useState(false);
  const [category, setCategory] = useState('');

  const close = () => {
    onClose();
    // Reset after the fade-out so the next open starts clean.
    setTimeout(() => {
      setCode('');
      setError(null);
      setAdded(null);
      setAskCategory(false);
      setCategory('');
    }, 200);
  };

  const submit = () => {
    const res = joinAgency(code, category || undefined);
    if (res.ok) {
      setError(null);
      setAdded(res.agency.name);
    } else if (res.needsCategory) {
      setAskCategory(true);
      setError(category ? res.error : null);
    } else {
      setAskCategory(false);
      setError(res.error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      <KeyboardAvoiding
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.layer}
      >
        <View style={styles.card}>
          {added ? (
            <>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} style={{ alignSelf: 'center' }} />
              <Text style={[styles.title, { textAlign: 'center' }]}>Organization added</Text>
              <Text style={[styles.body, { textAlign: 'center' }]}>{added}</Text>
              <Button label="Done" onPress={close} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Add organization</Text>
              <Text style={styles.body}>Ask for the organization code (like PRRI-AB12), then enter it here</Text>
              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  setError(null);
                  setAskCategory(false);
                  setCategory('');
                }}
                placeholder="Input code"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submit}
                style={[styles.input, error ? { borderColor: colors.danger } : null]}
              />
              {askCategory && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.body}>Which best describes you?</Text>
                  <View style={styles.cats}>
                    {participantCategories.map((c) => (
                      <Chip key={c} label={c} active={category === c} onPress={() => { setCategory(c); setError(null); }} />
                    ))}
                  </View>
                </View>
              )}
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.actions}>
                <Button label="Cancel" variant="soft" onPress={close} style={{ flex: 1 }} />
                <Button label="Add" onPress={submit} disabled={!code.trim()} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoiding>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.45)' },
  layer: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, gap: 12, ...shadow, shadowOpacity: 0.25, elevation: 10 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.muted, lineHeight: 19 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, minHeight: 48,
    paddingHorizontal: 14, fontSize: 16, letterSpacing: 1, color: colors.text,
  },
  error: { fontSize: 12, color: colors.danger },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
