import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/components/bits';
import { Text, TextInput } from '@/components/Text';
import { Button } from '@/components/ui';
import { colors, radius, shadow } from '@/theme';

/** A short message at the bottom of the screen, for actions that finish instantly (front end only). */
export function useToast(): { notify: (message: string) => void; toast: ReactNode } {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toast = message ? (
    <View style={styles.toastWrap} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </View>
  ) : null;

  return { notify, toast };
}

/** Session feedback: star rating plus an optional comment. Read-only once submitted. */
export function FeedbackSheet({
  visible,
  onClose,
  sessionTitle,
  existing,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  sessionTitle: string;
  existing?: { rating: number; comment: string };
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const done = !!existing;
  const shownRating = existing?.rating ?? rating;

  const close = () => {
    onClose();
    setRating(0);
    setComment('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={done ? 'Your feedback' : 'Session feedback'}
      subtitle={sessionTitle}
    >
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
            disabled={done}
            onPress={() => setRating(n)}
            hitSlop={6}
          >
            <Ionicons name={n <= shownRating ? 'star' : 'star-outline'} size={36} color={n <= shownRating ? '#F59E0B' : colors.icon} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={existing?.comment ?? comment}
        onChangeText={setComment}
        editable={!done}
        placeholder="Comments (optional)"
        placeholderTextColor={colors.icon}
        multiline
        style={styles.input}
      />
      {done ? (
        <Button label="Close" variant="soft" onPress={close} />
      ) : (
        <Button
          label="Submit feedback"
          disabled={rating === 0}
          onPress={() => {
            onSubmit(rating, comment.trim());
            close();
          }}
        />
      )}
    </BottomSheet>
  );
}

/** Reentry plan: how the participant will apply what they learned. */
export function ReentrySheet({
  visible,
  onClose,
  activityTitle,
  existing,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  activityTitle: string;
  existing?: { text: string; status: 'draft' | 'submitted' };
  onSave: (text: string, submit: boolean) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const value = text ?? existing?.text ?? '';
  const submitted = existing?.status === 'submitted';

  const close = () => {
    onClose();
    setText(null);
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Reentry plan" subtitle={activityTitle}>
      <Text style={styles.hint}>Describe how you’ll apply your learning back on your farm or in your community.</Text>
      <TextInput
        value={value}
        onChangeText={setText}
        editable={!submitted}
        placeholder="What will you do differently after this training?"
        placeholderTextColor={colors.icon}
        multiline
        style={[styles.input, { minHeight: 130 }]}
      />
      {submitted ? (
        <Button label="Close" variant="soft" onPress={close} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label="Save draft"
            variant="soft"
            disabled={!value.trim()}
            style={{ flex: 1 }}
            onPress={() => {
              onSave(value.trim(), false);
              close();
            }}
          />
          <Button
            label="Submit plan"
            disabled={!value.trim()}
            style={{ flex: 1 }}
            onPress={() => {
              onSave(value.trim(), true);
              close();
            }}
          />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  toast: { backgroundColor: '#1F2937', borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11, ...shadow },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  input: {
    minHeight: 90, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12,
    textAlignVertical: 'top', fontSize: 14, color: colors.text,
  },
  hint: { fontSize: 12, color: colors.muted },
});
