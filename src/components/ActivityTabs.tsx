import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { useBrand } from '@/components/Brand';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusPill } from '@/components/bits';
import { MaterialViewer } from '@/components/MaterialViewer';
import { FeedbackSheet, ReentrySheet } from '@/components/sheets';
import { Card, Chip, PressableScale } from '@/components/ui';
import type { Activity } from '@/data/mock';
import {
  attendanceDays,
  attendanceHistory,
  days,
  materialGroups,
  materialTypes,
  nextSession,
  overview,
  SampleMaterial,
  SampleSession,
  submissionSessions,
} from '@/data/sample';
import { allSessions, demoActions, feedbackStatus, submittedFeedbackCount, useDemo } from '@/store/demo';
import { colors, radius, shadow } from '@/theme';

export type TabName = 'Overview' | 'Sessions' | 'Materials' | 'Attendance' | 'Submissions';
export type SubKey = 'feedback' | 'reentry' | 'photos';
/** Switch to another tab (and optionally a Submissions sub-tab). */
export type GoTo = (tab: TabName, sub?: SubKey) => void;
type Notify = (message: string) => void;

const PHOTO_COLORS: [string, string][] = [
  ['#A7F3D0', '#2965DD'],
  ['#FDE68A', '#F97316'],
  ['#BFDBFE', '#7C3AED'],
  ['#FBCFE8', '#0891B2'],
];

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

export function OverviewTab({ activity, goTo }: { activity: Activity; goTo: GoTo }) {
  const brand = useBrand();
  const demo = useDemo();
  const p = overview.progress;
  const plan = demo.reentry[activity.id];
  const photos = demo.photos[activity.id] ?? 0;
  const feedbackDone = submittedFeedbackCount(demo, activity.id);

  const action = (label: string, right: string, tone: 'warn' | 'muted' | 'info' | 'ok', onPress: () => void) => (
    <PressableScale key={label} scaleTo={0.98} style={s.action} onPress={onPress}>
      <Text style={s.actionText}>{label}</Text>
      <StatusPill label={right} tone={tone} />
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </PressableScale>
  );

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: brand.primary }}>
        <Text style={s.kicker}>Next session</Text>
        <Text style={s.h}>{nextSession.title}</Text>
        <Text style={s.meta}>
          {nextSession.date} · {nextSession.range}
        </Text>
        <Text style={s.meta}>{nextSession.venue}</Text>
        <Text style={[s.meta, { color: brand.primary, fontWeight: '600' }]}>{nextSession.speaker}</Text>
      </Card>

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
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        {action('Submit session feedback', `${feedbackDone} of 3`, feedbackDone === 3 ? 'ok' : 'warn', () => goTo('Submissions', 'feedback'))}
        {action(
          `${activity.agencyId === 'prri' ? 'PRRI ' : ''}Reentry plan`,
          plan ? (plan.status === 'submitted' ? 'Submitted' : 'Draft') : 'Pending',
          plan?.status === 'submitted' ? 'ok' : plan ? 'info' : 'warn',
          () => goTo('Submissions', 'reentry'),
        )}
        {action('Output photos', photos > 0 ? `${photos}` : 'Optional', photos > 0 ? 'info' : 'muted', () => goTo('Submissions', 'photos'))}
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
const feedbackText = { Submitted: 'Feedback submitted', Pending: 'Feedback pending', 'Not open': 'Feedback not open' } as const;

export function SessionsTab({ activityId, goTo, notify }: { activityId: string; goTo: GoTo; notify: Notify }) {
  const brand = useBrand();
  const demo = useDemo();
  const [open, setOpen] = useState<SampleSession | null>(null);
  const [rating, setRating] = useState(false);
  const status = (sess: SampleSession) => feedbackStatus(demo, activityId, sess);

  if (open) {
    const fb = status(open);
    const existing = demo.feedback[`${activityId}/${open.id}`] ?? (open.feedback === 'Submitted' ? { rating: 5, comment: '' } : undefined);
    return (
      <View style={{ gap: 12 }}>
        <PressableScale scaleTo={0.96} onPress={() => setOpen(null)} style={s.backRow}>
          <Ionicons name="chevron-back" size={16} color={brand.primary} />
          <Text style={[s.meta, { color: brand.primary, fontWeight: '700' }]}>All sessions</Text>
        </PressableScale>
        <Card style={{ gap: 10 }}>
          <View style={s.between}>
            <Text style={[s.kicker, { color: brand.primary }]}>
              {open.kind.charAt(0) + open.kind.slice(1).toLowerCase()} · Day {open.date.includes('17') ? 1 : open.date.includes('18') ? 2 : 3}
            </Text>
            <StatusPill label={open.status} tone={statusTone[open.status]} />
          </View>
          <Text style={s.title}>{open.title}</Text>
          <Text style={s.meta}>
            {open.files} files · {feedbackText[fb]}
          </Text>
          <View style={s.grid2}>
            <Field label="DATE" value={open.date} />
            <Field label="TIME" value={open.range} />
            <Field label="RESOURCE PERSON" value={open.speaker} />
            <Field label="VENUE / ROOM" value={open.venue} />
          </View>
          <Text style={s.body}>{open.about}</Text>
        </Card>
        <Card style={{ gap: 8 }}>
          <Text style={s.h}>Session materials</Text>
          <Text style={s.meta}>
            {open.files > 0 ? `${open.files} files uploaded for this session.` : 'No materials uploaded for this session yet.'}
          </Text>
          <Pill
            label="View Session Materials"
            onPress={() => (open.files > 0 ? goTo('Materials') : notify('No materials uploaded for this session yet'))}
          />
        </Card>
        <Card style={{ gap: 8 }}>
          <Pill
            label={fb === 'Submitted' ? 'View my feedback' : 'Submit Session Feedback'}
            primary={fb !== 'Submitted'}
            onPress={() => (fb === 'Not open' ? notify('Feedback opens once this session has started') : setRating(true))}
          />
          <Text style={[s.meta, { textAlign: 'center' }]}>
            {fb === 'Not open'
              ? 'Feedback opens once this session has started.'
              : fb === 'Submitted'
                ? 'Thanks! Your feedback for this session was submitted.'
                : 'You can submit feedback for this session.'}
          </Text>
        </Card>

        <FeedbackSheet
          visible={rating}
          onClose={() => setRating(false)}
          sessionTitle={open.title}
          existing={fb === 'Submitted' ? existing : undefined}
          onSubmit={(r, c) => {
            demoActions.submitFeedback(activityId, open.id, r, c);
            notify('Feedback submitted. Thank you!');
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {days.map((day) => (
        <View key={day.label} style={{ gap: 10 }}>
          <View style={s.dayHead}>
            <Text style={s.dayLabel}>{day.label}</Text>
            {day.today && <StatusPill label="Today" tone="warn" />}
          </View>
          {day.sessions.map((sess) => (
            <PressableScale key={sess.id} scaleTo={0.98} onPress={() => setOpen(sess)} style={s.sessionRow}>
              <View style={s.timeCol}>
                <Text style={s.time}>{sess.time}</Text>
                <Text style={s.timeAp}>{sess.period}</Text>
              </View>
              <Card style={{ flex: 1, gap: 4 }}>
                <Text style={[s.kicker, { color: brand.primary }]}>{sess.kind}</Text>
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
                <Text style={s.meta}>{feedbackText[status(sess)]}</Text>
              </Card>
            </PressableScale>
          ))}
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

export function MaterialsTab({ notify }: { notify: Notify }) {
  const brand = useBrand();
  const [viewing, setViewing] = useState<SampleMaterial | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof materialTypes)[number]>('All types');
  const [offline, setOffline] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(materialGroups.flatMap((g) => g.items).map((m) => [m.id, !!m.offline])),
  );

  const groups = useMemo(
    () =>
      materialGroups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (m) => (type === 'All types' || m.type === type) && m.title.toLowerCase().includes(query.trim().toLowerCase()),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [query, type],
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
      </View>

      {/* Padding gives the chips' shadow room inside the clipping scroll view. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: -10 }} contentContainerStyle={{ gap: 8, paddingBottom: 18, paddingHorizontal: 2 }}>
        {materialTypes.map((t) => (
          <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
        ))}
      </ScrollView>

      <View style={s.dropdown}>
        <Text style={s.name}>All sessions</Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
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

      <MaterialViewer
        material={viewing}
        onClose={() => setViewing(null)}
        onOpenLink={() => notify('Opening the link in your browser (sample)')}
      />
    </View>
  );
}

/* ------------------------------ Attendance ------------------------------ */

const attTone = { Present: 'ok', 'Not checked in': 'warn', 'Not yet open': 'muted' } as const;

export function AttendanceTab({ title }: { title: string }) {
  const brand = useBrand();
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.meta}>Attendance for</Text>
          <Text style={s.h}>{title}</Text>
        </View>
        <Text style={[s.big, { color: brand.primary }]}>2/6</Text>
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
            <StatusPill label="Synced" tone="ok" />
          </View>
        ))}
      </Card>
      <Text style={s.meta}>
        Each day and session is stored once, so repeated syncs never create duplicate records. (0 items pending across all
        submissions)
      </Text>
    </View>
  );
}

/* ------------------------------ Submissions ------------------------------ */

const subTone = { Submitted: 'ok', Pending: 'warn', 'Not open yet': 'muted' } as const;

export function SubmissionsTab({
  activityId,
  activityTitle,
  sub,
  onSub,
  notify,
}: {
  activityId: string;
  activityTitle: string;
  sub: SubKey;
  onSub: (k: SubKey) => void;
  notify: Notify;
}) {
  const brand = useBrand();
  const demo = useDemo();
  const [rating, setRating] = useState<SampleSession | null>(null);
  const [writing, setWriting] = useState(false);

  const feedbackDone = submittedFeedbackCount(demo, activityId);
  const plan = demo.reentry[activityId];
  const photos = demo.photos[activityId] ?? 0;

  const tiles = [
    { key: 'feedback', label: 'Session feedback', value: `${feedbackDone}/3` },
    { key: 'reentry', label: 'Reentry plan', value: plan ? (plan.status === 'submitted' ? 'Submitted' : 'Draft') : 'Pending' },
    { key: 'photos', label: 'Output photos', value: `${photos}` },
  ] as const;

  const ratingExisting = rating
    ? (demo.feedback[`${activityId}/${rating.id}`] ?? (rating.feedback === 'Submitted' ? { rating: 5, comment: '' } : undefined))
    : undefined;

  return (
    <View style={{ gap: 12 }}>
      <View style={s.subTiles}>
        {tiles.map((t) => {
          const on = sub === t.key;
          return (
            <PressableScale
              key={t.key}
              scaleTo={0.96}
              onPress={() => onSub(t.key)}
              style={[s.subTile, on && { backgroundColor: brand.primary }]}
            >
              <Text style={[s.subLabel, on && { color: '#fff' }]}>{t.label}</Text>
              <Text style={[s.subValue, { color: on ? '#fff' : brand.primary }]}>{t.value}</Text>
            </PressableScale>
          );
        })}
      </View>

      {sub === 'feedback' && (
        <>
          <Text style={s.body}>Choose a session to evaluate. Each session has its own feedback.</Text>
          {submissionSessions.map((x, i) => {
            const sess = allSessions[i];
            const state = x.state === 'Not open yet' ? 'Not open yet' : feedbackStatus(demo, activityId, sess) === 'Submitted' ? 'Submitted' : 'Pending';
            return (
              <PressableScale
                key={x.title}
                scaleTo={0.98}
                onPress={() => (state === 'Not open yet' ? notify('Feedback opens once this session has started') : setRating(sess))}
              >
                <Card style={s.between}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.kicker, { color: brand.primary }]}>
                      {x.kind} · {x.day}
                    </Text>
                    <Text style={s.name}>{x.title}</Text>
                  </View>
                  <StatusPill label={state} tone={subTone[state]} />
                  {state !== 'Not open yet' && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
                </Card>
              </PressableScale>
            );
          })}
        </>
      )}

      {sub === 'reentry' && (
        <Card style={{ gap: 8 }}>
          <View style={s.between}>
            <Text style={s.h}>Reentry plan</Text>
            <StatusPill
              label={plan ? (plan.status === 'submitted' ? 'Submitted' : 'Draft') : 'Pending'}
              tone={plan?.status === 'submitted' ? 'ok' : plan ? 'info' : 'warn'}
            />
          </View>
          <Text style={s.body}>
            {plan
              ? plan.text
              : 'Describe how you’ll apply your learning. Prepare now; submit after the activity ends.'}
          </Text>
          <Pill
            label={plan ? (plan.status === 'submitted' ? 'View plan' : 'Continue draft') : 'Write plan'}
            onPress={() => setWriting(true)}
          />
        </Card>
      )}

      {sub === 'photos' && (
        <>
          {photos === 0 ? (
            <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
              <Ionicons name="images-outline" size={32} color={colors.muted} />
              <Text style={s.name}>No output photos yet</Text>
              <Text style={[s.meta, { textAlign: 'center' }]}>Optional. Share photos of what you made or practised.</Text>
            </Card>
          ) : (
            <View style={s.photoGrid}>
              {Array.from({ length: photos }, (_, i) => (
                <LinearGradient
                  key={i}
                  colors={PHOTO_COLORS[i % PHOTO_COLORS.length]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.photo}
                >
                  <Ionicons name="image-outline" size={26} color="rgba(255,255,255,0.9)" />
                  <Text style={s.photoText}>Sample photo {i + 1}</Text>
                </LinearGradient>
              ))}
            </View>
          )}
          <Pill
            label="Add photo"
            primary={photos === 0}
            onPress={() => {
              demoActions.addPhoto(activityId);
              notify('Sample photo added');
            }}
          />
        </>
      )}

      <FeedbackSheet
        visible={rating !== null}
        onClose={() => setRating(null)}
        sessionTitle={rating?.title ?? ''}
        existing={rating && feedbackStatus(demo, activityId, rating) === 'Submitted' ? ratingExisting : undefined}
        onSubmit={(r, c) => {
          if (rating) demoActions.submitFeedback(activityId, rating.id, r, c);
          notify('Feedback submitted. Thank you!');
        }}
      />
      <ReentrySheet
        visible={writing}
        onClose={() => setWriting(false)}
        activityTitle={activityTitle}
        existing={plan}
        onSave={(text, submit) => {
          demoActions.saveReentry(activityId, text, submit);
          notify(submit ? 'Reentry plan submitted' : 'Draft saved');
        }}
      />
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
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
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
    paddingHorizontal: 14, backgroundColor: '#fff', ...shadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44,
    borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: '#fff', ...shadow,
  },
  count: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontSize: 12, fontWeight: '700' },
  fileBadge: { width: 44, height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fileBadgeText: { fontSize: 12, fontWeight: '700' },
  fileActions: { flexDirection: 'row', gap: 8 },
  fileBtn: { flex: 1, minHeight: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  fileBtnText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  attBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  subTiles: { flexDirection: 'row', gap: 8 },
  subTile: { flex: 1, minHeight: 64, borderRadius: radius.md, backgroundColor: '#fff', padding: 10, gap: 4, justifyContent: 'center', ...shadow },
  subLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  subValue: { fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: '48%', aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
