import { useSyncExternalStore } from 'react';
import { activities, Activity, findAgency, user } from '@/data/mock';
import { attendanceDone, attendanceTotal, certificateRules, materialGroups, NotificationItem, notificationItems, notifications as membershipNotices, OutputKind } from '@/data/sample';

/**
 * Front-end-only demo state, so buttons show believable results while you click around
 * (a submitted form stays submitted on every screen). Nothing is saved to a server or the device.
 * The shapes mirror the admin system's tables: feedback, reentry_plan, output_submission, registration.
 */
export type FeedbackAnswers = Record<string, number | string>;
export type FeedbackEntry = { answers: FeedbackAnswers; anonymous: boolean };
export type Reentry = { values: Record<string, string>; document?: string; status: 'draft' | 'submitted' };
export type Output = { title: string; kind: OutputKind; session?: string };

type DemoState = {
  /** One feedback form per activity, keyed by activity id. Only asked once the activity is completed. */
  feedback: Record<string, FeedbackEntry>;
  /** Keyed by activity id. */
  reentry: Record<string, Reentry>;
  /** Output submissions, keyed by activity id. */
  outputs: Record<string, Output[]>;
  /** Activities joined with an activity code, keyed by activity id. */
  joined: Record<string, true>;
  /** Notifications the participant has opened, keyed by notification id. */
  read: Record<string, true>;
  /** Materials kept for offline use: "saving" while the sample download runs. */
  offline: Record<string, 'saved' | 'saving'>;
  invitation: 'pending' | 'accepted' | 'declined';
};

const seedOffline: DemoState['offline'] = Object.fromEntries(materialGroups.flatMap((g) => g.items).filter((m) => m.offline).map((m) => [m.id, 'saved' as const]));

let state: DemoState = { feedback: {}, reentry: {}, outputs: {}, joined: {}, read: {}, offline: seedOffline, invitation: 'pending' };
const listeners = new Set<() => void>();

function update(next: DemoState) {
  state = next;
  listeners.forEach((l) => l());
}

export const demoActions = {
  submitFeedback(activityId: string, answers: FeedbackAnswers, anonymous: boolean) {
    update({ ...state, feedback: { ...state.feedback, [activityId]: { answers, anonymous } } });
  },
  saveReentry(activityId: string, values: Record<string, string>, document: string | undefined, submit: boolean) {
    update({ ...state, reentry: { ...state.reentry, [activityId]: { values, document, status: submit ? 'submitted' : 'draft' } } });
  },
  addOutput(activityId: string, output: Output) {
    update({ ...state, outputs: { ...state.outputs, [activityId]: [...(state.outputs[activityId] ?? []), output] } });
  },
  removeOutput(activityId: string, index: number) {
    update({ ...state, outputs: { ...state.outputs, [activityId]: (state.outputs[activityId] ?? []).filter((_, i) => i !== index) } });
  },
  joinActivity(activityId: string) {
    update({ ...state, joined: { ...state.joined, [activityId]: true } });
  },
  markRead(ids: string[]) {
    update({ ...state, read: { ...state.read, ...Object.fromEntries(ids.map((id) => [id, true as const])) } });
  },
  /** Saves a material for offline use. The sample download takes a moment, then it shows as saved. */
  saveOffline(id: string) {
    update({ ...state, offline: { ...state.offline, [id]: 'saving' } });
    setTimeout(() => {
      if (state.offline[id] === 'saving') update({ ...state, offline: { ...state.offline, [id]: 'saved' } });
    }, 900);
  },
  removeOffline(id: string) {
    const { [id]: _removed, ...rest } = state.offline;
    update({ ...state, offline: rest });
  },
  answerInvitation(answer: 'accepted' | 'declined') {
    update({ ...state, invitation: answer });
  },
};

export type Requirement = { key: string; label: string; ok: boolean; note: string };
export type CertificateState = 'Not eligible' | 'Eligible' | 'Released';

/**
 * Certificate progress for an activity, using the organization's rules (certificate_rule).
 * Completed activities count as fully attended in this sample.
 */
export function certificateStatus(demo: DemoState, activity: Activity) {
  const completed = activity.status === 'Completed';
  const pct = completed ? 100 : Math.round((attendanceDone / attendanceTotal) * 100);
  const output = demo.outputs[activity.id]?.length ?? 0;
  const plan = demo.reentry[activity.id];

  const requirements: Requirement[] = [
    { key: 'attendance', label: `Attendance of at least ${certificateRules.minAttendance}%`, ok: pct >= certificateRules.minAttendance, note: `${pct}% so far` },
  ];
  if (certificateRules.requireFeedback) {
    requirements.push({ key: 'feedback', label: 'Activity feedback', ok: !!demo.feedback[activity.id], note: demo.feedback[activity.id] ? 'Submitted' : 'Not submitted' });
  }
  if (certificateRules.requireReentry) {
    requirements.push({ key: 'reentry', label: 'Reentry plan', ok: plan?.status === 'submitted', note: plan ? (plan.status === 'submitted' ? 'Submitted' : 'Draft saved') : 'Not submitted' });
  }
  if (certificateRules.requireOutput) {
    requirements.push({ key: 'output', label: 'Output submission', ok: output > 0, note: output > 0 ? `${output} submitted` : 'Not submitted' });
  }

  const eligible = completed && requirements.every((r) => r.ok);
  const result: CertificateState = !eligible ? 'Not eligible' : certificateRules.release === 'Automatic' ? 'Released' : 'Eligible';
  return { requirements, state: result, pct };
}


/** Details printed on a released certificate (certificate table). */
export function certificateInfo(a: Activity) {
  const agency = findAgency(a.agencyId);
  let h = 0;
  for (const c of a.id) h = (h * 31 + c.charCodeAt(0)) % 9000;
  const released = new Date(`${a.start}T00:00:00`);
  released.setDate(released.getDate() + 3);
  return {
    number: `${agency?.short ?? 'TMIS'}-2025-${1000 + h}`,
    participant: user.name,
    agencyName: agency?.name ?? 'Host agency',
    agencyShort: agency?.short ?? 'TMIS',
    releasedOn: released.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

export type NotificationRow = NotificationItem & { unread: boolean; certificate?: Activity };

/** The updates list: sample updates plus a "certificate released" entry for every released certificate. */
export function notificationsFor(demo: DemoState, agencyIds: string[]): NotificationRow[] {
  const released: NotificationRow[] = activities
    .filter((a) => agencyIds.includes(a.agencyId) && certificateStatus(demo, a).state === 'Released')
    .map((a) => ({
      id: `cert-${a.id}`,
      agencyShort: findAgency(a.agencyId)?.short ?? '',
      title: 'Certificate released',
      body: `Your certificate for ${a.title} is ready to view.`,
      when: 'Just now',
      icon: 'ribbon-outline' as const,
      link: { agencyId: a.agencyId, activityId: a.id },
      certificate: a,
      unread: !demo.read[`cert-${a.id}`],
    }));
  const items = notificationItems
    .filter((n) => agencyIds.includes(n.link?.agencyId ?? ''))
    .map((n) => ({ ...n, unread: !demo.read[n.id] }));
  // Invitations and lost access are answered on the Workspaces page; these rows only point there.
  const membership: NotificationRow[] = [];
  if (demo.invitation === 'pending') {
    membership.push({
      id: 'invite-dabar',
      agencyShort: membershipNotices.pending.short,
      title: `Invitation from ${membershipNotices.pending.short}`,
      body: `${membershipNotices.pending.by}. Open Workspaces to accept or decline.`,
      when: 'Today',
      icon: 'mail-unread-outline',
      to: '/workspaces',
      unread: !demo.read['invite-dabar'],
    });
  }
  membership.push({
    id: 'revoked-lhcb',
    agencyShort: membershipNotices.revoked.short,
    title: 'Access removed',
    body: `${membershipNotices.revoked.name} removed your access. ${membershipNotices.revoked.when}.`,
    when: 'May 28',
    icon: 'lock-closed-outline',
    to: '/workspaces',
    unread: !demo.read['revoked-lhcb'],
  });
  return [...membership.filter((m) => m.id.startsWith('invite')), ...released, ...items, ...membership.filter((m) => !m.id.startsWith('invite'))];
}

/** Unread updates (a pending invitation is one of them), for the bell badge. */
export const unreadCount = (demo: DemoState, agencyIds: string[]) => notificationsFor(demo, agencyIds).filter((n) => n.unread).length;
export function useDemo() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => state,
    () => state,
  );
}
