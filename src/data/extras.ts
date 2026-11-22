import type { Activity } from '@/data/mock';
import { findAgency } from '@/data/mock';

/**
 * Sample content for the parts of the participant app that mirror the web console's public agency page
 * and activity workspace. Front end only: the real values come from the server later.
 */

/** Public agency page: the three numbers under the name. */
export const orgStats = { subscribers: '13.4K', participantsReached: '164' };

/** Public agency page, Contact tab. */
export const orgContact = (agencyId: string) => {
  const short = (findAgency(agencyId)?.short ?? 'agency').toLowerCase();
  return {
    email: `info@${short}.gov.ph`,
    website: `${short}.gov.ph`,
    address: findAgency(agencyId)?.region ? `${findAgency(agencyId)?.short} main office, ${findAgency(agencyId)?.region}` : 'Main office',
    hours: 'Monday to Friday, 8:00 AM to 5:00 PM',
  };
};

export type ActivityUpdate = { id: string; title: string; body: string; when: string; from: string };

/** What a participant needs to know about one activity beyond its schedule. */
export function activityExtras(a: Activity) {
  const short = (findAgency(a.agencyId)?.short ?? 'agency').toLowerCase();
  return {
    bring: ['A valid ID', 'Boots and a hat for the field sessions', 'A water bottle and a notebook'],
    contact: {
      role: 'Activity coordinator',
      email: `training@${short}.gov.ph`,
      note: 'Write to the coordinator for questions about the schedule, the venue or your registration.',
    },
    directions: {
      address: a.venue,
      tip: 'The registration desk is at the main entrance. It opens 30 minutes before the first session.',
    },
    updates: [
      { id: 'u1', title: 'Bring boots and a hat', body: 'Tomorrow’s practicum is outdoors. Please wear closed shoes and bring a hat and drinking water.', when: 'Today, 8:15 AM', from: 'Activity coordinator' },
      { id: 'u2', title: 'Materials added for Day 2', body: 'The tapping demonstration guide is now under Materials. You can save it for offline reading.', when: 'Yesterday', from: 'Resource person' },
      { id: 'u3', title: 'Meals are provided', body: 'Lunch and snacks are served at the training hall during all three days.', when: '2 days ago', from: 'Activity coordinator' },
    ] as ActivityUpdate[],
  };
}
