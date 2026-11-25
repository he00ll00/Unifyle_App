import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { BottomSheet, StatusPill } from '@/components/bits';
import { ChecklistRows, FormOpener } from '@/components/forms';
import { MaterialViewer } from '@/components/MaterialViewer';
import { Button, Card, Chip, PressableScale } from '@/components/ui';
import type { Activity } from '@/data/mock';
import { activityExtras } from '@/data/extras';
import {
  allSessions,
  attendanceDays,
  attendanceDone,
  attendanceTotal,
  certificateRules,
  days,
  materialGroups,
  materialTypes,
  nextSession,
  overviewOf,
  progressOf,
  SampleMaterial,
} from '@/data/sample';
import { certificateStatus, demoActions, useDemo } from '@/store/demo';
import { colors, radius, shadow } from '@/theme';

export type TabName = 'Overview' | 'Sessions' | 'Materials' | 'Attendance' | 'Submissions' | 'Updates';
/** The session a participant is looking at: its details, or the schedule with that session highlighted. */
export type SessionFocus = { id: string; view: 'detail' | 'schedule' };
/** Switch to another tab, optionally landing on a session or on one session's materials. */
export type GoTo = (tab: TabName, opts?: { session?: SessionFocus; materials?: string }) => void;
type Notify = (message: string) => void;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const Section = ({ title, icon, children }: { title: string; icon?: IconName; children: React.ReactNode }) => {
  const brand = useBrand();
  return (
    <Card style={{ gap: 12 }}>
      <View style={s.sectionHead}>
        {icon ? (
          <View style={[s.sectionIcon, { backgroundColor: brand.soft }]}>
            <Ionicons name={icon} size={18} color={brand.primary} />
          </View>
        ) : null}
        <Text style={[s.h, { color: brand.dark }]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
};

const Bullets = ({ items }: { items: string[] }) => {
  const brand = useBrand();
  return (
    <View style={{ gap: 6 }}>
      {items.map((t) => (
        <View key={t} style={s.bulletRow}>
          <View style={[s.dot, { backgroundColor: brand.primary }]} />
          <Text style={[s.body, { flex: 1 }]}>{t}</Text>
        </View>
      ))}
    </View>
  );
};

/* ------------------------------ Overview ------------------------------ */

export function OverviewTab({ activity, goTo }: { activity: Activity; goTo: GoTo }) {
  const brand = useBrand();
  const p = progressOf(activity);
  const overview = overviewOf(activity);
  const extras = activityExtras(activity);
  const [flow, setFlow] = useState(false);
  const programFlow: SampleMaterial = {
    id: 'program-flow',
    badge: 'PDF',
    type: 'PDF',
    title: overview.programFlow.file.replace(/\.pdf$/i, '').replace(/_/g, ' '),
    meta: `PDF · ${overview.programFlow.size}`,
    by: 'Program flow',
    uploaded: 'Uploaded Jun 05, 2025',
    primary: 'View',
  };

  return (
    <View style={{ gap: 12 }}>
      <MaterialViewer material={flow ? programFlow : null} onClose={() => setFlow(false)} onOpenLink={() => {}} />
      {/* Opens the session's details, where its materials and schedule are. */}
      <PressableScale
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Next session: ${nextSession.title}`}
        onPress={() => goTo('Sessions', { session: { id: nextSession.id, view: 'detail' } })}
      >
        {/* A solid brand-colour card with white text, so it stands apart from the white cards below. */}
        <Card style={{ gap: 4, backgroundColor: brand.primary }}>
          <View style={s.between}>
            <Text style={[s.kicker, { color: 'rgba(255,255,255,0.85)' }]}>{nextSession.status === 'In progress' ? 'Happening now' : 'Up next'}</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
          <Text style={[s.h, { color: '#fff' }]}>{nextSession.title}</Text>
          <Text style={[s.meta, { color: '#fff' }]}>
            {nextSession.date} · {nextSession.range}
          </Text>
          <Text style={[s.meta, { color: '#fff' }]}>{nextSession.venue}</Text>
          <Text style={[s.meta, { color: '#fff', fontWeight: '700' }]}>{nextSession.speaker}</Text>
        </Card>
      </PressableScale>

      {/* One card: the progress bar and what has been completed so far. */}
      <Card style={{ gap: 8 }}>
        <View style={s.between}>
          <Text style={[s.h, { color: brand.dark }]}>Activity progress</Text>
          <Text style={[s.h, { color: brand.primary }]}>
            {p.day} {p.pct}%
          </Text>
        </View>
        <View style={[s.track, { backgroundColor: brand.soft }]}>
          <View style={[s.fill, { width: `${p.pct}%`, backgroundColor: brand.primary }]} />
        </View>
        <Text style={s.meta}>{p.note}</Text>
      </Card>

      <Section title="About this activity" icon="information-circle-outline">
        <Text style={s.body}>{overview.about}</Text>
        <View>
          <Field small label="Funding source" value={overview.funding} />
          <Field small label="Activity lead" value={overview.lead} />
          <Field small label="Target participants" value={`${activity.capacity?.max ?? 50} ${overview.audience}`} />
          <Field small label="Topics" value={overview.topics} />
          <Field small label="Documentation" value={overview.documentation} />
        </View>
        <View style={s.divider} />
        <View style={s.between}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>Program flow</Text>
            <Text style={s.meta}>
              {overview.programFlow.file} · {overview.programFlow.size}
            </Text>
          </View>
          <Pill label="View" onPress={() => setFlow(true)} />
        </View>
      </Section>

      {/* The date, time and venue are in the header above, so this card only adds the rooms and the way there. */}
      <Section title="Rooms and directions" icon="navigate-outline">
        <Text style={s.body}>{overview.schedule.rooms}</Text>
        <Text style={s.body}>{extras.directions.tip}</Text>
        <Pill label="Open in Maps" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(extras.directions.address)}`).catch(() => {})} />
      </Section>

      <Section title="What to bring" icon="bag-handle-outline">
        <Bullets items={extras.bring} />
      </Section>

      <Section title="Participating agencies" icon="business-outline">
        {overview.hosts.map((h) => (
          <View key={h.name} style={s.between}>
            <Text style={[s.name, { flex: 1 }]}>{h.name}</Text>
            <StatusPill label={h.role} tone="muted" />
          </View>
        ))}
      </Section>

      <Section title="Objectives" icon="flag-outline">
        <Bullets items={overview.objectives} />
      </Section>

      <Section title="Expected outcomes" icon="trophy-outline">
        <Bullets items={overview.outcomes} />
      </Section>

      <Section title="Resource persons and facilitators" icon="people-outline">
        {overview.people.map((p2) => (
          <View key={p2.name} style={s.person}>
            <View style={[s.avatar, { backgroundColor: brand.soft }]}>
              <Text style={[s.avatarText, { color: brand.dark }]}>{p2.initials}</Text>
            </View>
            <View>
              <Text style={s.name}>{p2.name}</Text>
              <Text style={s.meta}>{p2.role}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section title="Questions? Contact the coordinator" icon="chatbubble-ellipses-outline">
        <Pill label={`Email ${extras.contact.role.toLowerCase()}`} primary onPress={() => Linking.openURL(`mailto:${extras.contact.email}`).catch(() => {})} />
      </Section>
    </View>
  );
}

/* ------------------------------ Updates ------------------------------ */

/** Announcements from the agency about this activity (the web console's Messaging, one activity at a time). */
export function UpdatesTab({ activity }: { activity: Activity }) {
  const brand = useBrand();
  const { updates } = activityExtras(activity);
  if (updates.length === 0)
    return (
      <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 28 }}>
        <Ionicons name="megaphone-outline" size={28} color={brand.primary} />
        <Text style={[s.h, { color: brand.dark }]}>No updates yet</Text>
      </Card>
    );
  return (
    <View style={{ gap: 12 }}>
      {updates.map((u) => (
        <Card key={u.id} style={{ gap: 8 }}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: brand.soft }]}>
              <Ionicons name="megaphone-outline" size={18} color={brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.h, { color: brand.dark }]}>{u.title}</Text>
              <Text style={s.meta}>
                {u.from} · {u.when}
              </Text>
            </View>
          </View>
          <Text style={s.body}>{u.body}</Text>
        </Card>
      ))}
    </View>
  );
}

/* ------------------------------ Sessions ------------------------------ */

// Only the session happening now gets color; everything else is quiet grey.
const statusTone = { Completed: 'muted', 'In progress': 'ok', 'Up next': 'muted', Scheduled: 'muted' } as const;

export function SessionsTab({ focus, onFocus, goTo, notify }: {
  focus: SessionFocus | null;
  onFocus: (focus: SessionFocus | null) => void;
  goTo: GoTo;
  notify: Notify;
}) {
  const brand = useBrand();
  const session = focus ? allSessions.find((x) => x.id === focus.id) : undefined;

  if (session && focus?.view === 'detail') {
    return (
      <View style={{ gap: 12 }}>
        <PressableScale scaleTo={0.96} onPress={() => onFocus(null)} style={s.backRow}>
          <Ionicons name="chevron-back" size={16} color={brand.primary} />
          <Text style={[s.meta, { color: brand.primary, fontWeight: '700' }]}>All sessions</Text>
        </PressableScale>
        <Card style={{ gap: 10 }}>
          <View style={s.between}>
            <Text style={[s.kicker, { color: brand.primary }]}>
              {session.kind.charAt(0) + session.kind.slice(1).toLowerCase()} · Day {session.date.includes('17') ? 1 : session.date.includes('18') ? 2 : 3}
            </Text>
            <StatusPill label={session.status} tone={statusTone[session.status]} />
          </View>
          <Text style={[s.title, { color: brand.dark }]}>{session.title}</Text>
          <View style={s.grid2}>
            <Field label="Date" value={session.date} />
            <Field label="Time" value={session.range} />
            <Field label="Resource person" value={session.speaker} />
            <Field label="Venue / room" value={session.venue} />
          </View>
          <Text style={s.body}>{session.about}</Text>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={[s.h, { color: brand.dark }]}>Check-in</Text>
          <View style={s.grid2}>
            <Field label="Check-in window" value={`${session.opens} – ${session.closes}`} />
          </View>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={[s.h, { color: brand.dark }]}>Session materials</Text>
          <Pill
            label="View Session Materials"
            onPress={() => (session.files > 0 ? goTo('Materials', { materials: session.title }) : notify('No materials uploaded for this session yet'))}
          />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={[s.h, { color: brand.dark }]}>Session schedule</Text>
          <Pill label="View Session Schedule" onPress={() => onFocus({ id: session.id, view: 'schedule' })} />
        </Card>

      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {session && (
        <PressableScale scaleTo={0.96} onPress={() => onFocus({ id: session.id, view: 'detail' })} style={s.backRow}>
          <Ionicons name="chevron-back" size={16} color={brand.primary} />
          <Text style={[s.meta, { color: brand.primary, fontWeight: '700' }]}>Back to session details</Text>
        </PressableScale>
      )}
      {days.map((day) => (
        <View key={day.label} style={{ gap: 8 }}>
          <View style={s.dayHead}>
            <Text style={s.dayLabel}>{day.label}</Text>
            {day.today && <StatusPill label="Today" tone="ok" />}
          </View>
          {day.sessions.map((sess) => {
            const picked = sess.id === session?.id;
            return (
              <PressableScale key={sess.id} scaleTo={0.98} onPress={() => onFocus({ id: sess.id, view: 'detail' })} style={s.sessionRow}>
                <View style={s.timeCol}>
                  <Text style={[s.time, picked && { color: brand.primary }]}>{sess.time}</Text>
                  <Text style={s.timeAp}>{sess.period}</Text>
                </View>
                <Card style={[{ flex: 1, gap: 4 }, picked && { backgroundColor: brand.soft, borderWidth: 2, borderColor: brand.primary }]}>
                  <View style={s.between}>
                    <Text style={[s.kicker, { color: brand.primary }]}>{sess.kind}</Text>
                    {picked && <StatusPill label="Selected" tone="ok" />}
                  </View>
                  <View style={s.between}>
                    <Text style={[s.name, { flex: 1 }]}>{sess.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </View>
                  <Text style={s.meta}>{sess.speaker}</Text>
                  <View style={[s.statusRow, { marginTop: 4 }]}>
                    <StatusPill label={sess.status} tone={statusTone[sess.status]} />
                  </View>
                </Card>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Field({ label, value, small }: { label: string; value: string; small?: boolean }) {
  // Small facts are one full-width row: the label on the left, the value filling the rest and aligned right.
  if (small)
    return (
      <View style={s.factRow}>
        <Text style={s.smallLabel}>{label}</Text>
        <Text style={s.smallValue}>{value}</Text>
      </View>
    );
  return (
    <View style={{ width: '48%', gap: 2 }}>
      <Text style={small ? s.smallLabel : s.kicker}>{label}</Text>
      <Text style={small ? s.smallValue : s.name}>{value}</Text>
    </View>
  );
}

function Pill({ label, primary, onPress }: { label: string; primary?: boolean; onPress?: () => void }) {
  const brand = useBrand();
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={[s.pillBtn, { backgroundColor: primary ? brand.primary : brand.soft }]}
    >
      <Text style={[s.pillBtnText, { color: primary ? '#fff' : brand.dark }]}>{label}</Text>
    </PressableScale>
  );
}

/* ------------------------------ Materials ------------------------------ */

/** Size in MB from a label like "PowerPoint · 4.8 MB" or "Word · 120 KB". */
const sizeMb = (meta: string) => {
  const m = /([\d.]+)\s*(KB|MB)/.exec(meta);
  return m ? (m[2] === 'KB' ? Number(m[1]) / 1024 : Number(m[1])) : 0;
};

export function MaterialsTab({ notify, session: initialSession = '' }: { notify: Notify; session?: string }) {
  const brand = useBrand();
  const [viewing, setViewing] = useState<SampleMaterial | null>(null);
  const [query, setQuery] = useState('');
  const [filtering, setFiltering] = useState(false);
  // Filters live in the sheet behind the filter button: a session name (empty = all sessions) and a file type.
  const [session, setSession] = useState(initialSession);
  const [type, setType] = useState<(typeof materialTypes)[number]>('All types');
  const { offline } = useDemo();
  const savedIds = Object.keys(offline).filter((id) => offline[id] === 'saved');
  const savedMb = materialGroups.flatMap((g) => g.items).filter((m) => offline[m.id] === 'saved').reduce((sum, m) => sum + sizeMb(m.meta), 0);
  const active = (session.trim() ? 1 : 0) + (type !== 'All types' ? 1 : 0);

  const groups = useMemo(
    () =>
      materialGroups
        .filter((g) => g.title.toLowerCase().includes(session.trim().toLowerCase()))
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (m) => (type === 'All types' || m.type === type) && m.title.toLowerCase().includes(query.trim().toLowerCase()),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [query, session, type],
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={s.search}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search materials"
          placeholderTextColor={colors.muted}
          style={s.searchInput}
        />
        <PressableScale scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Filter materials" onPress={() => setFiltering(true)} style={s.filterBtn}>
          <Ionicons name="options-outline" size={20} color={active ? brand.primary : colors.muted} />
          {active > 0 && <View style={[s.filterDot, { backgroundColor: brand.primary }]} />}
        </PressableScale>
      </View>

      <View style={[s.offlineBar, { backgroundColor: brand.soft }]}>
        <Ionicons name="cloud-done-outline" size={18} color={brand.primary} />
        <Text style={[s.meta, { flex: 1, color: brand.dark }]}>
          {savedIds.length === 0 ? 'No files saved for offline use yet.' : `${savedIds.length} file${savedIds.length === 1 ? '' : 's'} saved offline · ${savedMb.toFixed(1)} MB`}
        </Text>
        {savedIds.length > 0 && (
          <PressableScale accessibilityRole="button" scaleTo={0.94} hitSlop={8} onPress={() => { savedIds.forEach(demoActions.removeOffline); notify('Offline copies removed'); }}>
            <Text style={[s.meta, { color: brand.primary, fontWeight: '700' }]}>Remove all</Text>
          </PressableScale>
        )}
      </View>

      {groups.length === 0 && <Text style={s.empty}>No materials match your search.</Text>}

      {groups.map((g) => (
        <View key={g.title} style={{ gap: 10 }}>
          <Text style={[s.name, { color: brand.dark }]}>{g.title}</Text>
          {g.items.map((m) => {
            const state = offline[m.id];
            const saved = state === 'saved';
            const saving = state === 'saving';
            return (
              <Card key={m.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[s.fileBadge, { backgroundColor: brand.soft }]}>
                    <Text style={[s.fileBadgeText, { color: brand.dark }]}>{m.badge}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
                    <Text style={s.name}>{m.title}</Text>
                    <View style={s.statusRow}>
                      <Text style={s.meta}>{m.meta}</Text>
                      {saved && <StatusPill label="Offline" tone="ok" />}
                      {saving && <StatusPill label="Saving…" tone="ok" />}
                    </View>
                  </View>
                </View>
                <View style={s.fileActions}>
                  <PressableScale style={[s.fileBtn, { backgroundColor: brand.soft }]} onPress={() => setViewing(m)}>
                    <Text style={[s.fileBtnText, { color: brand.dark }]}>{m.primary}</Text>
                  </PressableScale>
                  {m.type !== 'Link' && (
                    <PressableScale
                      style={[s.fileBtn, { backgroundColor: colors.bg }]}
                      disabled={saving}
                      onPress={() => {
                        if (saved) {
                          demoActions.removeOffline(m.id);
                          notify('Offline copy removed');
                        } else {
                          demoActions.saveOffline(m.id);
                          notify('Saving for offline use (sample)');
                        }
                      }}
                    >
                      <Text style={[s.fileBtnText, { color: colors.text }]}>
                        {saving ? 'Saving…' : saved ? 'Remove offline copy' : 'Download for offline'}
                      </Text>
                    </PressableScale>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      ))}

      <BottomSheet visible={filtering} onClose={() => setFiltering(false)} title="Filter materials">
        <Text style={s.kicker}>Session</Text>
        <View style={s.sessionInput}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            value={session}
            onChangeText={setSession}
            placeholder="Type a session name"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>
        <View style={s.chips}>
          <Chip label="All sessions" active={!session.trim()} onPress={() => setSession('')} />
        </View>

        <Text style={[s.kicker, { marginTop: 4 }]}>File type</Text>
        <View style={s.chips}>
          {materialTypes.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Button
            label="Reset"
            variant="soft"
            style={{ flex: 1 }}
            onPress={() => {
              setSession('');
              setType('All types');
            }}
          />
          <Button label="Show results" style={{ flex: 1 }} onPress={() => setFiltering(false)} />
        </View>
      </BottomSheet>

      <MaterialViewer
        material={viewing}
        onClose={() => setViewing(null)}
        onOpenLink={() => notify('Opening the link in your browser (sample)')}
      />
    </View>
  );
}

/* ------------------------------ Attendance ------------------------------ */

const attTone = { 'Checked in': 'ok', 'Checked out': 'ok', 'Pending sync': 'warn', 'Not checked in': 'muted', 'Not yet open': 'muted' } as const;

export function AttendanceTab() {
  const brand = useBrand();
  const pending = attendanceDays.flatMap((d) => d.rows).filter((r) => r.status === 'Pending sync').length;
  const pct = Math.round((attendanceDone / attendanceTotal) * 100);
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 8 }}>
        <View style={s.between}>
          <Text style={[s.h, { color: brand.dark }]}>Check points</Text>
          <Text style={[s.big, { color: brand.primary }]}>
            {attendanceDone}/{attendanceTotal}
          </Text>
        </View>
        <Text style={s.meta}>
          {pct}% so far · {certificateRules.minAttendance}% needed
        </Text>
      </Card>

      {attendanceDays.map((d) => (
        <View key={d.label} style={{ gap: 8 }}>
          <View style={s.dayHead}>
            <Text style={s.dayLabel}>{d.label}</Text>
            {d.today && <StatusPill label="Today" tone="ok" />}
          </View>
          <Card style={{ paddingVertical: 4 }}>
            {d.rows.map((r, i) => (
              <View key={r.name} style={[s.attRow, i > 0 && s.attBorder]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.name}>{r.name}</Text>
                  <Text style={s.meta}>{r.note}</Text>
                </View>
                <StatusPill label={r.status} tone={attTone[r.status]} />
              </View>
            ))}
          </Card>
        </View>
      ))}

      {pending > 0 && <Text style={s.meta}>{pending} pending sync</Text>}
    </View>
  );
}

/* ------------------------------ Submissions ------------------------------ */

const stateTone = { 'Not eligible': 'muted', Eligible: 'ok', Released: 'ok' } as const;

export function SubmissionsTab({ activity, open, onCertificate }: { activity: Activity; open: FormOpener; onCertificate: () => void }) {
  const brand = useBrand();
  const demo = useDemo();
  const completed = activity.status === 'Completed';
  const cert = certificateStatus(demo, activity);

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 8 }}>
        <View style={s.between}>
          <Text style={[s.h, { color: brand.dark }]}>Submissions</Text>
          <StatusPill label={completed ? 'Open' : 'Locked'} tone={completed ? 'ok' : 'muted'} />
        </View>
        <ChecklistRows activity={activity} open={open} locked={!completed} />
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={s.between}>
          <Text style={[s.h, { color: brand.dark }]}>Certificate</Text>
          <StatusPill label={cert.state} tone={stateTone[cert.state]} />
        </View>
        {cert.requirements.map((r) => (
          <View key={r.key} style={s.statusRow}>
            <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={r.ok ? brand.primary : colors.icon} />
            <Text style={[s.name, { flex: 1 }]}>{r.label}</Text>
            {r.note ? <Text style={s.meta}>{r.note}</Text> : null}
          </View>
        ))}
        {cert.state === 'Released' && <Button label="View certificate" onPress={onCertificate} />}
      </Card>
    </View>
  );
}
const s = StyleSheet.create({
  // One type scale for every activity tab: 15 card heading, 14 item name, 13 body, 12 detail.
  h: { fontSize: 15, fontWeight: '600', color: colors.text },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  body: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.muted },
  kicker: { fontSize: 12, fontWeight: '600', color: colors.muted },
  big: { fontSize: 20, fontWeight: '600' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 4 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '600' },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  sessionRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  timeCol: { width: 40, alignItems: 'center', paddingTop: 16 },
  time: { fontSize: 13, fontWeight: '600', color: colors.text },
  timeAp: { fontSize: 11, color: colors.muted },
  backRow: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  // The small facts under "About this activity": quiet detail, not headings.
  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  smallLabel: { width: 124, fontSize: 12, lineHeight: 18, color: colors.muted },
  smallValue: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500', color: colors.text },
  pillBtn: { minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  pillBtnText: { fontSize: 13, fontWeight: '600' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: radius.pill,
    paddingLeft: 14, paddingRight: 6, backgroundColor: '#fff', ...shadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  sessionInput: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  fileBadge: { width: 40, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fileBadgeText: { fontSize: 11, fontWeight: '600' },
  fileActions: { flexDirection: 'row', gap: 8 },
  fileBtn: { flex: 1, minHeight: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  fileBtnText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  attBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.sm, paddingHorizontal: 12, minHeight: 40 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
