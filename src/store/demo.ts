import { useSyncExternalStore } from 'react';
import { days, FeedbackState, SampleSession } from '@/data/sample';

/**
 * Front-end-only demo state, so buttons show believable results while you click around
 * (a submitted feedback stays submitted on every screen). Nothing is saved to a server or the device.
 */
type DemoState = {
  /** Keyed `${activityId}/${sessionId}`. */
  feedback: Record<string, { rating: number; comment: string }>;
  /** Keyed by activity id. */
  reentry: Record<string, { text: string; status: 'draft' | 'submitted' }>;
  /** Number of sample output photos, keyed by activity id. */
  photos: Record<string, number>;
  invitation: 'pending' | 'accepted' | 'declined';
};

let state: DemoState = { feedback: {}, reentry: {}, photos: {}, invitation: 'pending' };
const listeners = new Set<() => void>();

function update(next: DemoState) {
  state = next;
  listeners.forEach((l) => l());
}

export const demoActions = {
  submitFeedback(activityId: string, sessionId: string, rating: number, comment: string) {
    update({ ...state, feedback: { ...state.feedback, [`${activityId}/${sessionId}`]: { rating, comment } } });
  },
  saveReentry(activityId: string, text: string, submit: boolean) {
    update({ ...state, reentry: { ...state.reentry, [activityId]: { text, status: submit ? 'submitted' : 'draft' } } });
  },
  addPhoto(activityId: string) {
    update({ ...state, photos: { ...state.photos, [activityId]: (state.photos[activityId] ?? 0) + 1 } });
  },
  answerInvitation(answer: 'accepted' | 'declined') {
    update({ ...state, invitation: answer });
  },
};

const feedbackKey = (activityId: string, sessionId: string) => `${activityId}/${sessionId}`;

export const allSessions: SampleSession[] = days.flatMap((d) => d.sessions);
/** The first three sessions are the ones whose feedback can be given right now. */
const FEEDBACK_OPEN = 3;

export function feedbackStatus(demo: DemoState, activityId: string, sess: SampleSession): FeedbackState {
  if (sess.feedback === 'Submitted' || demo.feedback[feedbackKey(activityId, sess.id)]) return 'Submitted';
  return sess.feedback;
}

export const pendingFeedback = (demo: DemoState, activityId: string) =>
  allSessions.slice(0, FEEDBACK_OPEN).filter((x) => feedbackStatus(demo, activityId, x) !== 'Submitted');

export const submittedFeedbackCount = (demo: DemoState, activityId: string) =>
  FEEDBACK_OPEN - pendingFeedback(demo, activityId).length;

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
