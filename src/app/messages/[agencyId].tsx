import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/bits';
import { KeyboardStickyView } from '@/components/keyboard';
import { Text, TextInput } from '@/components/Text';
import { PressableScale } from '@/components/ui';
import { activitiesOf, Activity, isRegistered } from '@/data/mock';
import { ChatMessage, MESSAGE_LIMIT, useStore } from '@/store/AppStore';
import { useDemo } from '@/store/demo';
import { Brand, colors, makeBrand } from '@/theme';

export default function GroupChat() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const { agencies, hydrated, online, messages, saveMessage } = useStore();
  const { joined } = useDemo();
  const agency = agencies.find((a) => a.id === agencyId);

  if (!hydrated) return null;
  if (!agency) {
    return <Text style={s.unavailable}>This group chat is unavailable.</Text>;
  }

  const brand = makeBrand(agency.brand);
  const activities = activitiesOf(agency.id);
  return (
    <>
      <Stack.Screen options={{
        title: `${agency.short} group chat`,
        headerTitleStyle: { color: brand.dark, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
      }} />
      <Conversation
        key={agency.id}
        title={agency.name}
        brand={brand}
        online={online}
        messages={messages.filter((m) => m.agencyId === agency.id)}
        activities={activities.filter((activity) => isRegistered(activity, joined))}
        activityTitles={new Map(activities.map((activity) => [activity.id, activity.title]))}
        onSend={(text) => saveMessage(agency.id, text)}
      />
    </>
  );
}

function Conversation({ title, brand, online, messages, activities, activityTitles, onSend }: {
  title: string;
  brand: Brand;
  online: boolean;
  messages: ChatMessage[];
  activities: Activity[];
  activityTitles: ReadonlyMap<string, string>;
  onSend: (text: string) => boolean;
}) {
  const { bottom } = useSafeAreaInsets();
  const list = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const canSend = online && draft.trim().length > 0;

  function send() {
    if (!canSend) return;
    const saved = onSend(draft);
    setSaveError(!saved);
    if (saved) setDraft('');
  }

  return (
    <View style={s.screen}>
      <View style={s.identity}>
        <View style={[s.icon, { backgroundColor: brand.soft }]}>
          <Ionicons name="people-outline" size={22} color={brand.dark} />
        </View>
        <View style={s.identityCopy}>
          <Text accessibilityRole="header" style={[s.title, { color: brand.dark }]}>{title}</Text>
          <Text style={s.meta}>Organization group</Text>
        </View>
        {activities.length > 0 && (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="View group activities"
            onPress={() => setShowActivities(true)}
            style={s.activitiesButton}
          >
            <Ionicons name="calendar-outline" size={17} color={brand.dark} />
            <Text style={[s.activitiesLabel, { color: brand.dark }]}>Activities</Text>
          </PressableScale>
        )}
      </View>
      <Text style={s.notice} accessibilityLiveRegion="polite">
        {online ? 'Preview · Messages stay on this device.' : 'You’re offline. Reconnect to send a message.'}
      </Text>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(message, index) => `${message.sentAt}-${index}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.history}
        onContentSizeChange={() => {
          if (messages.length > 0) list.current?.scrollToEnd({ animated: false });
        }}
        ListEmptyComponent={<Text style={s.empty}>No messages yet.</Text>}
        renderItem={({ item }) => (
          <View style={[s.bubble, { backgroundColor: brand.soft }]}>
            {item.activityId && (
              <Text style={[s.activitiesLabel, { color: brand.dark }]}>
                {activityTitles.get(item.activityId) ?? 'Previous activity'}
              </Text>
            )}
            <Text style={s.body}>{item.text}</Text>
            <Text style={s.timestamp}>{new Date(item.sentAt).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}</Text>
          </View>
        )}
      />

      <KeyboardStickyView style={s.footer}>
        {saveError && <Text accessibilityLiveRegion="polite" style={s.error}>Couldn’t save your message. Try again.</Text>}
        <View style={[s.composer, { paddingBottom: Math.max(10, bottom) }]}>
          <TextInput
            accessibilityLabel="Message"
            placeholder="Type a message"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={MESSAGE_LIMIT}
            value={draft}
            onChangeText={setDraft}
            style={s.input}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={send}
            style={[s.send, { backgroundColor: canSend ? brand.dark : colors.border }]}
          >
            <Ionicons name="send" size={18} color={canSend ? '#fff' : colors.muted} />
          </PressableScale>
        </View>
      </KeyboardStickyView>

      <BottomSheet visible={showActivities} title="Group activities" onClose={() => setShowActivities(false)}>
        <ScrollView style={s.activityList}>
          {activities.map((activity) => (
            <PressableScale
              key={activity.id}
              accessibilityRole="button"
              onPress={() => {
                setShowActivities(false);
                router.push({ pathname: '/org/[agencyId]/activity/[id]', params: { agencyId: activity.agencyId, id: activity.id } });
              }}
              style={s.activityRow}
            >
              <Text style={[s.activityTitle, { color: brand.dark }]}>{activity.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.icon} />
            </PressableScale>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  unavailable: { padding: 20, textAlign: 'center', color: colors.muted },
  screen: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: colors.bg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, color: colors.muted },
  activitiesButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 3 },
  activitiesLabel: { fontSize: 12, fontWeight: '600' },
  activityList: { maxHeight: 300 },
  activityRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  activityTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  notice: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, color: colors.muted, textAlign: 'center' },
  history: { flexGrow: 1, padding: 16, gap: 10 },
  empty: { paddingVertical: 28, fontSize: 14, color: colors.muted, textAlign: 'center' },
  bubble: { alignSelf: 'flex-end', maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 5 },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  timestamp: { color: colors.muted, fontSize: 11, textAlign: 'right' },
  footer: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.bg, borderRadius: 14 },
  send: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  error: { color: colors.danger, fontSize: 13, paddingTop: 8, paddingHorizontal: 12 },
});
