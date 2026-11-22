import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { Group, SectionTitle } from '@/components/lists';
import { Text } from '@/components/Text';
import { colors, shadow } from '@/theme';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

/** Plain answers to the questions people ask most. Kept short and in everyday words. */
const FAQ: { q: string; a: string }[] = [
  { q: 'How do I join an agency?', a: 'On your workspaces page, tap the + button and type the invitation code your agency gave you. If an agency already invited your email, the invitation is waiting on that page. Tap Accept to join.' },
  { q: 'How do I check in to a session?', a: 'Open the activity, tap Scan QR code, and point the camera at the QR code shown by the facilitator. You can also be checked in by the facilitator. If you have no signal, your check-in is saved on your phone and sent later.' },
  { q: 'What does “Pending sync” mean?', a: 'Your phone saved your check-in or answers, but has not been able to send them yet because there is no internet. They are sent by themselves when you are back online. You do not need to do anything.' },
  { q: 'How do I get my certificate?', a: 'After the activity, finish the steps listed for it, such as attendance, session feedback and your reentry plan. When they are done, your certificate appears under My certificates in your Profile.' },
  { q: 'I forgot my password', a: 'On the sign-in page, tap Forgot password and type your email address. We will send you a link to choose a new one.' },
  { q: 'The words are too small or too big', a: 'Open Profile, then Settings, then Text size, and choose the size that is comfortable for you. It changes the whole app.' },
];

/** Help: common questions, and who to ask when the answer is not here. */
export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    setOpen((cur) => (cur === i ? null : i));
  };

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <Text style={s.intro}>Find a quick answer below.</Text>

      <SectionTitle>Common questions</SectionTitle>
      <View style={s.faq}>
        {FAQ.map((item, i) => {
          const on = open === i;
          return (
            <View key={item.q} style={s.item}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: on }} onPress={() => toggle(i)} style={s.q}>
                <Text style={s.qText}>{item.q}</Text>
                <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
              </Pressable>
              {on ? <Text style={s.a}>{item.a}</Text> : null}
            </View>
          );
        })}
      </View>

      <SectionTitle>Still need help?</SectionTitle>
      <Group>
        <View style={s.contact}>
          <View style={s.contactIcon}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.qText}>Ask your agency</Text>
            <Text style={s.a2}>The coordinator who invited you can help with your account, your invitation code and your activities.</Text>
          </View>
        </View>
      </Group>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 16, color: colors.muted, marginLeft: 4 },
  faq: { backgroundColor: colors.card, borderRadius: 16, ...shadow },
  item: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16 },
  q: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 10 },
  qText: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  a: { fontSize: 15, lineHeight: 23, color: colors.muted, paddingBottom: 16 },
  contact: { flexDirection: 'row', gap: 14, padding: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  a2: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
