import { useSyncExternalStore } from 'react';
import type { Activity } from '@/data/mock';
import { attendanceDone, attendanceTotal, certificateRules, OutputKind } from '@/data/sample';

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
  invitation: 'pending' | 'accepted' | 'declined';
};

let state: DemoState = { feedback: {}, reentry: {}, outputs: {}, joined: {}, invitation: 'pending' };
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
