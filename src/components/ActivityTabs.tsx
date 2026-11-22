import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { BottomSheet, StatusPill } from '@/components/bits';
import { ChecklistRows, FormOpener } from '@/components/forms';
import { MaterialViewer } from '@/components/MaterialViewer';
import { Button, Card, Chip, PressableScale } from '@/components/ui';
import type { Activity } from '@/data/mock';
import {
  allSessions,
  attendanceDays,
  attendanceDone,
  attendanceHistory,
  attendanceTotal,
  certificateRules,
  days,
  materialGroups,
  materialTypes,
  nextSession,
  overview,
  SampleMaterial,
} from '@/data/sample';
import { certificateStatus, useDemo } from '@/store/demo';
import { colors, radius, shadow } from '@/theme';

export type TabName = 'Overview' | 'Sessions' | 'Materials' | 'Attendance' | 'Submissions';
/** The session a participant is looking at: its details, or the schedule with that session highlighted. */
export type SessionFocus = { id: string; view: 'detail' | 'schedule' };
/** Switch to another tab, optionally landing on a session or on one session's materials. */
export type GoTo = (tab: TabName, opts?: { session?: SessionFocus; materials?: string }) => void;
type Notify = (message: string) => void;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card style={{ gap: 8 }}>
    <Text style={s.h}>{title}</Text>
    {children}
  </Card>
);

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

export function OverviewTab({ activity, goTo, open }: { activity: Activity; goTo: GoTo; open: FormOpener }) {
  const brand = useBrand();
  const p = overview.progress;

  return (
    <View style={{ gap: 12 }}>
      {/* Opens the session's details, where its materials and schedule are. */}
      <PressableScale
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Next session: ${nextSession.title}`}
        onPress={() => goTo('Sessions', { session: { id: nextSession.id, view: 'detail' } })}
      >
        <Card style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: brand.primary }}>
          <View style={s.between}>
            <Text style={s.kicker}>NEXT SESSION</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
          <Text style={s.h}>{nextSession.title}</Text>
          <Text style={s.meta}>
            {nextSession.date} · {nextSession.range}
          </Text>
          <Text style={s.meta}>{nextSession.venue}</Text>
          <Text style={[s.meta, { color: brand.primary, fontWeight: '600' }]}>{nextSession.speaker}</Text>
        </Card>
      </PressableScale>

      {/* One card: the progress bar and what has been completed so far. */}
      <Card style={{ gap: 8 }}>
        <View style={s.between}>
          <Text style={s.h}>Activity progress</Text>
          <Text style={[s.h, { color: brand.primary }]}>
            {p.day} {p.pct}%
          </Text>
        </View>
        <View style={[s.track, { backgroundColor: brand.soft }]}>
          <View style={[s.fill, { width: `${p.pct}%`, backgroundColor: brand.primary }]} />
        </View>
        <Text style={s.meta}>{p.note}</Text>
        <View style={s.divider} />
        <ChecklistRows activity={activity} open={open} locked={activity.status !== 'Completed'} />
      </Card>

      <Section title="About this activity">
        <Text style={s.body}>{overview.about}</Text>
      </Section>

      <Section title="Schedule and venue">
        <Text style={s.body}>{activity.dates}</Text>
        <Text style={s.body}>{overview.schedule.time}</Text>
        <Text style={s.body}>{activity.venue}</Text>
        <Text style={s.meta}>{overview.schedule.rooms}</Text>
      </Section>

      <Section title="Hosting agencies">
        {overview.hosts.map((h) => (
          <View key={h.name} style={s.between}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{h.name}</Text>
              <Text style={s.meta}>{h.note}</Text>
            </View>
            {h.host && <StatusPill label="Host agency" tone="ok" />}
          </View>
        ))}
      </Section>

      <Section title="Objectives">
        <Bullets items={overview.objectives} />
      </Section>

      <Section title="Expected outcomes">
        <Bullets items={overview.outcomes} />
      </Section>

      <Section title="Resource persons and facilitators">
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
    </View>
  );
}

/* ------------------------------ Sessions ------------------------------ */

const statusTone = { Completed: 'ok', 'In progress': 'warn', 'Up next': 'info', Scheduled: 'muted' } as const;

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
          <Text style={s.title}>{session.title}</Text>
          <Text style={s.meta}>
            {session.files} file{session.files === 1 ? '' : 's'}
          </Text>
          <View style={s.grid2}>
            <Field label="DATE" value={session.date} />
            <Field label="TIME" value={session.range} />
            <Field label="RESOURCE PERSON" value={session.speaker} />
            <Field label="VENUE / ROOM" value={session.venue} />
          </View>
          <Text style={s.body}>{session.about}</Text>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={s.h}>Session materials</Text>
          <Text style={s.meta}>
            {session.files > 0 ? `${session.files} file${session.files === 1 ? '' : 's'} uploaded for this session.` : 'No materials uploaded for this session yet.'}
          </Text>
          <Pill
            label="View Session Materials"
            onPress={() => (session.files > 0 ? goTo('Materials', { materials: session.title }) : notify('No materials uploaded for this session yet'))}
          />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={s.h}>Session schedule</Text>
          <Text style={s.meta}>See where this session fits in the activity schedule.</Text>
          <Pill label="View Session Schedule" onPress={() => onFocus({ id: session.id, view: 'schedule' })} />
        </Card>

      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {session && (
        <PressableScale scaleTo={0.96} onPress={() => onFocus({ id: session.id, view: 'detail' })} style={s.backRow}>
          <Ionicons name="chevron-back" size={16} color={brand.primary} />
          <Text style={[s.meta, { color: brand.primary, fontWeight: '700' }]}>Back to session details</Text>
        </PressableScale>
      )}
      {days.map((day) => (
        <View key={day.label} style={{ gap: 10 }}>
          <View style={s.dayHead}>
            <Text style={s.dayLabel}>{day.label}</Text>
            {day.today && <StatusPill label="Today" tone="warn" />}
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
                    {picked && <StatusPill label="Selected session" tone="info" />}
                  </View>
                  <View style={s.between}>
                    <Text style={[s.name, { flex: 1 }]}>{sess.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </View>
                  <Text style={s.meta}>{sess.speaker}</Text>
                  <View style={s.statusRow}>
                    <StatusPill label={sess.status} tone={statusTone[sess.status]} />
                    <Text style={s.meta}>
                      {sess.files} file{sess.files === 1 ? '' : 's'}
                    </Text>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '48%', gap: 2 }}>
      <Text style={s.kicker}>{label}</Text>
      <Text style={s.name}>{value}</Text>
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

const badgeColor: Record<string, [string, string]> = {
  PPT: ['#FFEDD5', '#C2410C'],
  PDF: ['#FEE2E2', '#B91C1C'],
  DOC: ['#DBEAFE', '#1D4ED8'],
  IMG: ['#EDE9FE', '#6D28D9'],
  HND: ['#CCFBF1', '#0F766E'],
  LINK: ['#E2E8F0', '#475569'],
};

export function MaterialsTab({ notify, session: initialSession = '' }: { notify: Notify; session?: string }) {
  const brand = useBrand();
  const [viewing, setViewing] = useState<SampleMaterial | null>(null);
  const [query, setQuery] = useState('');
  const [filtering, setFiltering] = useState(false);
  // Filters live in the sheet behind the filter button: a session name (empty = all sessions) and a file type.
  const [session, setSession] = useState(initialSession);
  const [type, setType] = useState<(typeof materialTypes)[number]>('All types');
  const [offline, setOffline] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(materialGroups.flatMap((g) => g.items).map((m) => [m.id, !!m.offline])),
  );
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

      {groups.length === 0 && <Text style={s.empty}>No materials match your search.</Text>}

      {groups.map((g) => (
        <View key={g.title} style={{ gap: 10 }}>
          <View style={s.between}>
            <Text style={[s.name, { flex: 1 }]}>{g.title}</Text>
            <View style={[s.count, { backgroundColor: brand.soft }]}>
              <Text style={[s.countText, { color: brand.dark }]}>{g.items.length}</Text>
            </View>
          </View>
          {g.items.map((m) => {
            const [bg, fg] = badgeColor[m.badge] ?? badgeColor.LINK;
            const saved = offline[m.id];
            return (
              <Card key={m.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[s.fileBadge, { backgroundColor: bg }]}>
                    <Text style={[s.fileBadgeText, { color: fg }]}>{m.badge}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.name}>{m.title}</Text>
                    <View style={s.statusRow}>
                      <Text style={s.meta}>{m.meta}</Text>
                      {saved && <StatusPill label="Offline" tone="ok" />}
                    </View>
                    <Text style={s.meta}>{m.by}</Text>
                    <Text style={s.meta}>{m.uploaded}</Text>
                  </View>
                </View>
                <View style={s.fileActions}>
                  <PressableScale style={[s.fileBtn, { backgroundColor: brand.soft }]} onPress={() => setViewing(m)}>
                    <Text style={[s.fileBtnText, { color: brand.dark }]}>{m.primary}</Text>
                  </PressableScale>
                  {m.type !== 'Link' && (
                    <PressableScale
                      style={[s.fileBtn, { backgroundColor: colors.bg }]}
                      onPress={() => {
                        setOffline((o) => ({ ...o, [m.id]: !o[m.id] }));
                        notify(saved ? 'Offline copy removed' : 'Saved for offline use (sample)');
                      }}
                    >
                      <Text style={[s.fileBtnText, { color: colors.text }]}>
                        {saved ? 'Remove offline copy' : 'Download for offline'}
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
        <Text style={s.kicker}>SESSION</Text>
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

        <Text style={[s.kicker, { marginTop: 4 }]}>FILE TYPE</Text>
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

const attTone = { 'Checked in': 'ok', 'Checked out': 'info', 'Pending sync': 'warn', 'Not checked in': 'muted', 'Not yet open': 'muted' } as const;

export function AttendanceTab({ title }: { title: string }) {
  const brand = useBrand();
  const pending = attendanceHistory.filter((h) => !h.synced).length;
  const pct = Math.round((attendanceDone / attendanceTotal) * 100);
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.meta}>Attendance for</Text>
            <Text style={s.h}>{title}</Text>
          </View>
          <Text style={[s.big, { color: brand.primary }]}>
            {attendanceDone}/{attendanceTotal}
          </Text>
        </View>
        <Text style={s.meta}>
          {pct}% so far. A certificate needs at least {certificateRules.minAttendance}%. Each day has four QR check points: morning in and out, afternoon in and out.
        </Text>
      </Card>

      {attendanceDays.map((d) => (
        <View key={d.label} style={{ gap: 8 }}>
          <View style={s.dayHead}>
            <Text style={s.dayLabel}>{d.label}</Text>
            {d.today && <StatusPill label="Today" tone="warn" />}
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

      <Text style={s.dayLabel}>My attendance history</Text>
      <Card style={{ paddingVertical: 4 }}>
        {attendanceHistory.map((h, i) => (
          <View key={h.title} style={[s.attRow, i > 0 && s.attBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{h.title}</Text>
              <Text style={s.meta}>{h.when}</Text>
            </View>
            <StatusPill label={h.synced ? 'Synced' : 'Pending sync'} tone={h.synced ? 'ok' : 'warn'} />
          </View>
        ))}
      </Card>
      <Text style={s.meta}>
        Each check point is stored once, so repeated syncs never create duplicate records. ({pending} {pending === 1 ? 'item' : 'items'} pending sync)
      </Text>
    </View>
  );
}

/* ------------------------------ Submissions ------------------------------ */

const stateTone = { 'Not eligible': 'muted', Eligible: 'info', Released: 'ok' } as const;

export function SubmissionsTab({ activity, open }: { activity: Activity; open: FormOpener }) {
  const brand = useBrand();
  const demo = useDemo();
  const completed = activity.status === 'Completed';
  const cert = certificateStatus(demo, activity);

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 4 }}>
        <View style={s.between}>
          <Text style={s.h}>Submissions</Text>
          <StatusPill label={completed ? 'Open' : 'Opens after the activity'} tone={completed ? 'ok' : 'muted'} />
        </View>
        <Text style={s.meta}>
          {completed
            ? 'The activity is complete. Finish your feedback, reentry plan and output below.'
            : 'Feedback, the reentry plan and output submissions open once this activity is completed.'}
        </Text>
        <ChecklistRows activity={activity} open={open} locked={!completed} />
      </Card>

      <Card style={{ gap: 8 }}>
        <View style={s.between}>
          <Text style={s.h}>Certificate</Text>
          <StatusPill label={cert.state} tone={stateTone[cert.state]} />
        </View>
        {cert.requirements.map((r) => (
          <View key={r.key} style={s.statusRow}>
            <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={r.ok ? brand.primary : colors.icon} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{r.label}</Text>
              <Text style={s.meta}>{r.note}</Text>
            </View>
          </View>
        ))}
        <Text style={s.meta}>
          {certificateRules.release === 'Automatic'
            ? 'The certificate is released automatically once every requirement is met.'
            : 'The organization releases the certificate after you meet every requirement.'}
        </Text>
      </Card>
    </View>
  );
}
const s = StyleSheet.create({
  h: { fontSize: 14, fontWeight: '700', color: colors.text },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, color: colors.muted, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.muted },
  kicker: { fontSize: 10, fontWeight: '700', color: colors.muted, letterSpacing: 0.4 },
  big: { fontSize: 24, fontWeight: '700' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 4 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  sessionRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  timeCol: { width: 38, alignItems: 'center', paddingTop: 12 },
  time: { fontSize: 14, fontWeight: '700', color: colors.text },
  timeAp: { fontSize: 10, color: colors.muted },
  backRow: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  pillBtn: { minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  pillBtnText: { fontSize: 14, fontWeight: '600' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: radius.pill,
    paddingLeft: 14, paddingRight: 6, backgroundColor: '#fff', ...shadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  sessionInput: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  count: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontSize: 12, fontWeight: '700' },
  fileBadge: { width: 44, height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fileBadgeText: { fontSize: 12, fontWeight: '700' },
  fileActions: { flexDirection: 'row', gap: 8 },
  fileBtn: { flex: 1, minHeight: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  fileBtnText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  attBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
