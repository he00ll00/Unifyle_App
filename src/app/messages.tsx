import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Card, PressableScale } from '@/components/ui';
import { Agency } from '@/data/mock';
import { ChatMessage, useStore } from '@/store/AppStore';
import { colors, makeBrand } from '@/theme';

export default function Messages() {
  const { agencies, hydrated, messages } = useStore();
  const insets = useSafeAreaInsets();
  const latest = new Map<string, ChatMessage>();
  for (const message of messages) latest.set(message.agencyId, message);
  const groups = [...agencies].sort(
    (a, b) => (latest.get(b.id)?.sentAt ?? 0) - (latest.get(a.id)?.sentAt ?? 0),
  );

  function renderGroup(agency: Agency) {
    const brand = makeBrand(agency.brand);
    const last = latest.get(agency.id);
    return (
      <PressableScale
        key={agency.id}
        accessibilityRole="button"
        accessibilityLabel={`Open ${agency.short} group chat`}
        onPress={() => router.push({ pathname: '/messages/[agencyId]', params: { agencyId: agency.id } })}
        style={s.row}
      >
        <View style={[s.badge, { backgroundColor: brand.soft }]}>
          <Text style={[s.badgeText, { color: brand.dark }]} numberOfLines={1}>{agency.short}</Text>
        </View>
        <View style={s.copy}>
          <Text style={[s.title, { color: brand.dark }]}>{agency.name}</Text>
          <Text style={s.meta} numberOfLines={1}>{last ? `You: ${last.text}` : 'Organization group'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={colors.icon} />
      </PressableScale>
    );
  }

  if (!hydrated) return null;

  return (
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: 20 + insets.bottom }]}>
      {agencies.length === 0 ? (
        <Text style={s.meta}>Join an organization to see its group chat here.</Text>
      ) : (
        <>
          <Text accessibilityRole="header" style={s.heading}>Organization groups</Text>
          <Card style={s.group}>{groups.map(renderGroup)}</Card>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, gap: 12, width: '100%', maxWidth: 640, alignSelf: 'center' },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text },
  group: { paddingVertical: 4 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  badge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.muted },
});
