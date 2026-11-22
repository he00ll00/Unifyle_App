// Front-end-only example content for the activity workspace (from the design).
// Replace with API data later; every screen reads from here.

type SessionStatus = 'Completed' | 'In progress' | 'Up next' | 'Scheduled';

export type SampleSession = {
  id: string;
  time: string;
  period: 'AM' | 'PM';
  kind: string;
  title: string;
  speaker: string;
  status: SessionStatus;
  files: number;
  // Expanded detail
  date: string;
  range: string;
  venue: string;
  about: string;
};

type SampleDay = { label: string; today?: boolean; sessions: SampleSession[] };

export const days: SampleDay[] = [
  {
    label: 'Day 1 · June 17',
    sessions: [
      {
        id: 's1', time: '8:30', period: 'AM', kind: 'SESSION 1', title: 'Introduction to Rubber Production',
        speaker: 'Dr. Leonilo B. Castor', status: 'Completed', files: 2,
        date: 'June 17, 2025', range: '8:30 AM – 11:30 AM', venue: 'PRRI Training Center, Hall A',
        about: 'Overview of rubber production, clone selection and site suitability.',
      },
      {
        id: 's2', time: '1:00', period: 'PM', kind: 'WORKSHOP', title: 'Latex Handling and Quality Control',
        speaker: 'Ms. Joy Fabian', status: 'Completed', files: 1,
        date: 'June 17, 2025', range: '1:00 PM – 4:30 PM', venue: 'PRRI Training Center, Lab 2',
        about: 'Hands-on latex collection, handling and quality checks.',
      },
    ],
  },
  {
    label: 'Day 2 · June 18',
    today: true,
    sessions: [
      {
        id: 's3', time: '8:30', period: 'AM', kind: 'SESSION 2', title: 'Rubber Tapping Techniques',
        speaker: 'Engr. Ana Lucero', status: 'In progress', files: 3,
        date: 'June 18, 2025', range: '8:30 AM – 11:30 AM', venue: 'PRRI Training Center, Hall A',
        about: 'Tapping systems, cut depth and panel management.',
      },
      {
        id: 's4', time: '1:00', period: 'PM', kind: 'PRACTICUM', title: 'Demo Farm: Tapping Practicum',
        speaker: 'Engr. Ana Lucero', status: 'Up next', files: 0,
        date: 'June 18, 2025', range: '1:00 PM – 4:30 PM', venue: 'PRRI Demo Farm, Block C',
        about: 'Hands-on tapping in three stations. Bring boots and a hat. Facilitators give feedback on each participant’s cuts.',
      },
    ],
  },
  {
    label: 'Day 3 · June 19',
    sessions: [
      {
        id: 's5', time: '8:30', period: 'AM', kind: 'SESSION 3', title: 'Plantation Management',
        speaker: 'Mr. Dennis Ramos', status: 'Scheduled', files: 1,
        date: 'June 19, 2025', range: '8:30 AM – 11:30 AM', venue: 'PRRI Training Center, Hall A',
        about: 'Maintenance calendars, fertilizer schedules and plantation records.',
      },
      {
        id: 's6', time: '1:00', period: 'PM', kind: 'CLOSING', title: 'Reentry Planning and Closing',
        speaker: 'Ms. Joy Fabian', status: 'Scheduled', files: 0,
        date: 'June 19, 2025', range: '1:00 PM – 3:00 PM', venue: 'PRRI Training Center, Hall A',
        about: 'Draft your reentry plan and close the activity.',
      },
    ],
  },
];

export const nextSession = days[1].sessions[1];
export const allSessions: SampleSession[] = days.flatMap((d) => d.sessions);

export const overview = {
  about:
    'Learn sustainable rubber production practices, proper tapping techniques, and practical farm management from PRRI specialists.',
  schedule: { dates: 'June 17–19, 2025', time: '8:00 AM – 5:00 PM · 3 days', venue: 'PRRI Training Center, Zamboanga Sibugay', rooms: 'Training Hall and Demo Farm' },
  hosts: [
    { name: 'PRRI', note: 'Philippine Rubber Research Institute', host: true },
    { name: 'DA Region IX', note: 'Implementing partner', host: false },
    { name: 'Zamboanga Sibugay LGU', note: 'Venue partner', host: false },
    { name: 'Rubber Growers Association', note: 'Participating organization', host: false },
  ],
  objectives: [
    'Explain how rubber is produced and which clones suit a given site',
    'Perform correct tapping on a mature rubber tree',
    'Prepare a maintenance calendar for a smallholder plantation',
  ],
  outcomes: [
    'Participants can tap trees using a recommended system',
    'Each participant leaves with a farm maintenance plan',
    'A reentry plan is filed with the host agency',
  ],
  people: [
    { initials: 'LB', name: 'Dr. Leonilo B. Castor', role: 'Lead resource person' },
    { initials: 'AL', name: 'Engr. Ana Lucero', role: 'Tapping specialist' },
  ],
  progress: { day: 'Day 2 of 3', pct: 33, note: '2 of 6 sessions completed · Registration confirmed' },
};

type MaterialType = 'PowerPoint' | 'PDF' | 'Handout' | 'Image' | 'Word' | 'Link';
export type SampleMaterial = {
  id: string;
  badge: string;
  type: MaterialType;
  title: string;
  meta: string;
  by: string;
  uploaded: string;
  offline?: boolean;
  primary: string;
};
type MaterialGroup = { title: string; items: SampleMaterial[] };

export const materialTypes: ('All types' | MaterialType)[] = ['All types', 'PowerPoint', 'PDF', 'Handout', 'Image', 'Word', 'Link'];

export const materialGroups: MaterialGroup[] = [
  {
    title: 'Session 1 · Introduction to Rubber Production',
    items: [
      { id: 'm1', badge: 'PPT', type: 'PowerPoint', title: 'Rubber Production Introduction', meta: 'PowerPoint · 4.8 MB', by: 'Session 1 · Dr. Leonilo B. Castor', uploaded: 'Uploaded Jun 12, 2025', primary: 'View slides' },
      { id: 'm2', badge: 'PDF', type: 'PDF', title: 'Participant Handbook', meta: 'PDF · 1.9 MB', by: 'Session 1 · Ms. Joy Fabian', uploaded: 'Uploaded Jun 10, 2025', offline: true, primary: 'View' },
    ],
  },
  {
    title: 'Workshop · Latex Handling and Quality Control',
    items: [
      { id: 'm3', badge: 'DOC', type: 'Word', title: 'Latex Quality Checklist', meta: 'Word · 120 KB', by: 'Workshop · Ms. Joy Fabian', uploaded: 'Uploaded Jun 11, 2025', primary: 'View' },
    ],
  },
  {
    title: 'Session 2 · Rubber Tapping Techniques',
    items: [
      { id: 'm4', badge: 'PDF', type: 'PDF', title: 'Tapping Techniques', meta: 'PDF · 2.6 MB', by: 'Session 2 · Engr. Ana Lucero', uploaded: 'Uploaded Jun 12, 2025', primary: 'View' },
      { id: 'm5', badge: 'PPT', type: 'PowerPoint', title: 'Demonstration Guide', meta: 'PowerPoint · 6.3 MB', by: 'Session 2 · Engr. Ana Lucero', uploaded: 'Uploaded Jun 13, 2025', primary: 'View slides' },
      { id: 'm6', badge: 'IMG', type: 'Image', title: 'Tapping Cut Reference Photo', meta: 'Image · 740 KB', by: 'Session 2 · Engr. Ana Lucero', uploaded: 'Uploaded Jun 13, 2025', primary: 'View' },
    ],
  },
  {
    title: 'Session 3 · Plantation Management',
    items: [
      { id: 'm7', badge: 'HND', type: 'Handout', title: 'Plantation Management Handout', meta: 'Handout · 980 KB', by: 'Session 3 · Mr. Dennis Ramos', uploaded: 'Uploaded Jun 14, 2025', primary: 'View' },
    ],
  },
  {
    title: 'General references',
    items: [
      { id: 'm8', badge: 'LINK', type: 'Link', title: 'PRRI Rubber Production Guide (online)', meta: 'Link · External link', by: 'General reference · Philippine Rubber Research Institute', uploaded: 'Uploaded Jun 09, 2025', primary: 'Open' },
    ],
  },
];

// Four check points a day, each with its own QR code (AM in/out, PM in/out), like the admin attendance tab.
type AttendanceStatus = 'Checked in' | 'Checked out' | 'Pending sync' | 'Not checked in' | 'Not yet open';
type CheckPoint = { name: string; status: AttendanceStatus; note: string };
export const attendanceDays: { label: string; today?: boolean; rows: CheckPoint[] }[] = [
  {
    label: 'Day 1 · June 17',
    rows: [
      { name: 'Morning check-in', status: 'Checked in', note: '8:21 AM · Synced' },
      { name: 'Morning check-out', status: 'Checked out', note: '11:34 AM · Synced' },
      { name: 'Afternoon check-in', status: 'Checked in', note: '1:06 PM · Synced' },
      { name: 'Afternoon check-out', status: 'Checked out', note: '4:35 PM · Synced' },
    ],
  },
  {
    label: 'Day 2 · June 18',
    today: true,
    rows: [
      { name: 'Morning check-in', status: 'Pending sync', note: '8:12 AM · Saved on device' },
      { name: 'Morning check-out', status: 'Not checked in', note: 'Window: 11:00 AM – 12:00 PM' },
      { name: 'Afternoon check-in', status: 'Not checked in', note: 'Window: 1:00 – 2:00 PM' },
      { name: 'Afternoon check-out', status: 'Not checked in', note: 'Window: 4:30 – 5:30 PM' },
    ],
  },
  {
    label: 'Day 3 · June 19',
    rows: [
      { name: 'Morning check-in', status: 'Not yet open', note: 'Opens June 19, 8:00 AM' },
      { name: 'Morning check-out', status: 'Not yet open', note: 'Window: 11:00 AM – 12:00 PM' },
      { name: 'Afternoon check-in', status: 'Not yet open', note: 'Window: 1:00 – 2:00 PM' },
      { name: 'Afternoon check-out', status: 'Not yet open', note: 'Window: 3:00 – 4:00 PM' },
    ],
  },
];

const allPoints = attendanceDays.flatMap((d) => d.rows);
/** Check points recorded so far (a Pending sync one still counts, it is saved on the device). */
export const attendanceDone = allPoints.filter((r) => r.status === 'Checked in' || r.status === 'Checked out' || r.status === 'Pending sync').length;
export const attendanceTotal = allPoints.length;

export const attendanceHistory = [
  { title: 'Day 2 · Morning check-in', when: 'June 18 · 8:12 AM', synced: false },
  { title: 'Day 1 · Afternoon check-out', when: 'June 17 · 4:35 PM', synced: true },
  { title: 'Day 1 · Afternoon check-in', when: 'June 17 · 1:06 PM', synced: true },
  { title: 'Day 1 · Morning check-out', when: 'June 17 · 11:34 AM', synced: true },
  { title: 'Day 1 · Morning check-in', when: 'June 17 · 8:21 AM', synced: true },
];

export const orgAbout = {
  handle: '@prri',
  type: 'Government agency',
  subscribers: '13.4K subscribers',
  description:
    'An institute under the Department of Agriculture that runs research, development and extension programs to improve the quality and productivity of rubber, especially for smallholder producers and processors.',
  facts: [
    ['Region', 'Zamboanga Sibugay'],
    ['Created by', 'Republic Act 10089'],
    ['Supervising agency', 'Department of Agriculture'],
  ],
};

export const notifications = {
  pending: {
    name: 'DA Bureau of Agricultural Research',
    short: 'DA BAR',
    by: 'Invited by Dir. Marites Ocampo',
    expires: 'Expires Jun 30, 2025',
  },
  revoked: {
    name: 'Lanao Highlands Coconut Board',
    short: 'LHCB',
    when: 'Revoked May 28, 2025',
  },
};

// The three question types the admin console offers (feedback_question.qtype): rating, choice, open text.
type FeedbackQuestion =
  | { id: string; type: 'rating'; label: string; required?: boolean; low: string; high: string }
  | { id: string; type: 'choice'; label: string; required?: boolean; options: string[] }
  | { id: string; type: 'comment'; label: string; required?: boolean };

/** Feedback form. The organization sets these questions, so the app renders whatever list it receives. */
export const feedbackForm: { title: string; intro: string; anonymousAllowed: boolean; questions: FeedbackQuestion[] } = {
  title: 'Activity feedback',
  intro: 'Your answers help the organization improve its trainings.',
  anonymousAllowed: true,
  questions: [
    { id: 'q1', type: 'rating', label: 'The activity objectives were clear.', required: true, low: 'Strongly disagree', high: 'Strongly agree' },
    { id: 'q2', type: 'rating', label: 'The resource persons explained the topics well.', required: true, low: 'Poor', high: 'Excellent' },
    { id: 'q3', type: 'rating', label: 'The materials and activities were useful.', required: true, low: 'Not useful', high: 'Very useful' },
    { id: 'q4', type: 'rating', label: 'Overall, how satisfied are you with this activity?', required: true, low: 'Not satisfied', high: 'Very satisfied' },
    { id: 'q5', type: 'choice', label: 'Would you recommend this activity to others?', required: true, options: ['Yes', 'Maybe', 'No'] },
    { id: 'q6', type: 'comment', label: 'What did you like most about this activity?' },
    { id: 'q7', type: 'comment', label: 'What can we improve?' },
  ],
};

/** Reentry plan fields, as stored by the admin system (reentry_plan). */
export const reentryFields: { id: string; label: string; hint: string; required?: boolean; lines: number }[] = [
  { id: 'summary', label: 'Summary', hint: 'One line about your plan', required: true, lines: 1 },
  { id: 'timeline', label: 'Timeline', hint: 'e.g. August to December 2025', lines: 1 },
  { id: 'details', label: 'Details', hint: 'Describe what you will do back on your farm or in your community.', required: true, lines: 4 },
  { id: 'expected', label: 'Expected result', hint: 'What will change once the plan is done?', lines: 3 },
  { id: 'support', label: 'Support needed', hint: 'Optional. Tools, funding or follow-up from the organization.', lines: 2 },
];

/** Output kinds the admin system accepts (output_submission.kind). */
export const outputKinds = ['Photo', 'File', 'Video'] as const;
export type OutputKind = (typeof outputKinds)[number];

/** Certificate rules for an activity (certificate_rule). The organization sets these. */
export const certificateRules = {
  minAttendance: 80,
  requireFeedback: true,
  requireReentry: true,
  requireOutput: true,
  release: 'Automatic' as 'Automatic' | 'Manual',
};

/** Categories an organization offers participants (participant_category). */
export const participantCategories = ['Farmer', 'Extension worker', 'Student', 'Cooperative member', 'Other'];

/** Participant profile fields kept by the admin system (participant_profile). */
export const profileExtras = { sex: 'Male', birthDate: 'March 14, 1990', province: 'Zamboanga Sibugay', municipality: 'Ipil' };