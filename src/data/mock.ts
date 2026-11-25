// Sample data matching the TMIS data model (agency, activity, session, invitation).
// Replace with API calls once the backend exists.

export type Agency = {
  id: string;
  name: string;
  short: string;
  role: string;
  region: string;
  memberSince: string;
  /** Participant category set by the invitation or chosen when joining (participant_category). */
  category?: string;
  /** Agency brand colour (TMIS "Agency Branding"). Must keep white text readable. */
  brand: string;
  /** Background of the agency's round logo badge, if it differs from the brand colour. */
  logoColor?: string;
  /** End colour of the gradient on the workspace folder card (it starts at the main blue). */
  cardEnd?: string;
};

export type ActivityStatus = 'Ongoing' | 'Upcoming' | 'Completed';

export type Activity = {
  id: string;
  agencyId: string;
  category: 'Skills Training' | 'Extension Activity' | 'Seminar';
  title: string;
  dates: string;
  venue: string;
  status: ActivityStatus;
  progress: string;
  /** First day of the activity (ISO date). */
  start: string;
  /** Code that registers a participant for the activity (activity.join_code). Upcoming activities only. */
  joinCode?: string;
  /** Participant limit (activity.max_participants) and how many are registered. */
  capacity?: { max: number; taken: number };
};

export const user = {
  name: 'Ronald Richards',
  firstName: 'Ronald',
  email: 'ronaldrichards@gmail.com',
};

/** App main colour; screens outside an organization use it. */
export const DEFAULT_BRAND = '#2f5fcc';

export const agencies: Agency[] = [
  {
    id: 'prri',
    name: 'Philippine Rubber Research Institute',
    short: 'PRRI',
    role: 'Participant',
    region: 'Zamboanga Sibugay',
    memberSince: 'Feb 12, 2025',
    brand: '#1E9E00',
    cardEnd: '#2EFF00',
    logoColor: '#F59E0B',
  },
  {
    id: 'maes',
    name: 'Mindanao Agri-Extension Service',
    short: 'MAES',
    role: 'Participant',
    region: 'Zamboanga Sibugay',
    memberSince: 'Feb 12, 2025',
    brand: '#C2410C',
    cardEnd: '#FF0004',
  },
  {
    id: 'pca',
    name: 'Philippine Coconut Authority – Zamboanga',
    short: 'PCA',
    role: 'Participant',
    region: 'Zamboanga City',
    memberSince: 'Mar 3, 2025',
    brand: '#CA8A04', // yellow
    cardEnd: '#FFC400',
  },
  {
    id: 'bfar',
    name: 'BFAR Region IX Fisheries Office',
    short: 'BFAR',
    role: 'Participant',
    region: 'Zamboanga del Norte',
    memberSince: 'Apr 21, 2025',
    brand: '#0891B2', // cyan
    cardEnd: '#00DBFF',
  },
];

// Mirrors the `invitation` table (agency_id, code, category_id, expires_at, max_uses).
// Codes look like the admin ones: AGENCY-XXXX.
// Replace with a server call; the server must enforce expiry and max uses.
export type Invitation = {
  code: string;
  agency: Agency;
  /** Preset participant category. When missing, the participant picks one while joining. */
  category?: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
};

export const invitations: Invitation[] = [
  {
    code: 'DARFO9-4K7Q',
    agency: {
      id: 'da9',
      name: 'Department of Agriculture – Region IX',
      short: 'DA-RFO9',
      role: 'Participant',
      region: 'Zamboanga Peninsula',
      memberSince: '',
      brand: '#4D7C0F', // olive green
      cardEnd: '#9BFF2E',
    },
    category: 'Farmer',
    uses: 0,
  },
  {
    code: 'WMSU-3XT1',
    agency: {
      id: 'wmsu',
      name: 'WMSU Extension Office',
      short: 'WMSU',
      role: 'Participant',
      region: 'Zamboanga City',
      memberSince: '',
      brand: '#B91C1C',
      cardEnd: '#FF7A00',
    },
    uses: 0,
  },
  {
    code: 'DOST9-8M2P',
    agency: {
      id: 'dost9',
      name: 'DOST Region IX Science and Technology Office',
      short: 'DOST-IX',
      role: 'Participant',
      region: 'Zamboanga Peninsula',
      memberSince: '',
      brand: '#6D28D9',
      cardEnd: '#B84DFF',
    },
    uses: 0,
  },
  {
    code: 'ATI9-5R6D',
    agency: {
      id: 'ati9',
      name: 'ATI Regional Training Center IX',
      short: 'ATI-RTC9',
      role: 'Participant',
      region: 'Zamboanga Sibugay',
      memberSince: '',
      brand: '#BE185D',
      cardEnd: '#FF2D87',
    },
    uses: 0,
  },
  {
    code: 'DABAR-0001',
    agency: {
      id: 'dabar',
      name: 'DA Bureau of Agricultural Research',
      short: 'DA BAR',
      role: 'Participant',
      region: 'Quezon City',
      memberSince: '',
      brand: '#0F766E',
      cardEnd: '#2DD4BF',
    },
    uses: 0,
  },
  {
    code: 'OLD-0001',
    agency: {
      id: 'old',
      name: 'Expired Sample Agency',
      short: 'OLD',
      role: 'Participant',
      region: 'Sample',
      memberSince: '',
      brand: '#475569',
      cardEnd: '#94A3B8',
    },
    expiresAt: '2024-12-31',
    uses: 0,
  },
];

export const activities: Activity[] = [
  // ---- PRRI ----
  {
    id: 'rubber-tapping',
    start: '2025-06-17',
    agencyId: 'prri',
    category: 'Skills Training',
    title: 'Rubber Production and Tapping Technology',
    dates: 'June 17–19, 2025',
    venue: 'PRRI Training Center, Zamboanga Sibugay',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
    capacity: { max: 50, taken: 42 },
  },
  {
    id: 'rubber-nursery',
    start: '2025-06-17',
    agencyId: 'prri',
    category: 'Extension Activity',
    title: 'Community-Based Rubber Nursery Management',
    dates: 'June 17–19, 2025',
    venue: 'Ipil, Zamboanga Sibugay',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
    capacity: { max: 40, taken: 36 },
  },
  {
    id: 'budwood-assessment',
    start: '2025-07-01',
    agencyId: 'prri',
    category: 'Seminar',
    title: 'Rubber Clone Selection and Budwood Handling',
    dates: 'July 1, 2025',
    venue: 'PRRI Training Center, Zamboanga Sibugay',
    status: 'Upcoming',
    progress: 'Starts July 1',
    joinCode: 'PRRI-BW01',
    capacity: { max: 40, taken: 28 },
  },
  {
    id: 'latex-quality',
    start: '2025-05-22',
    agencyId: 'prri',
    category: 'Seminar',
    title: 'Pest and Disease Management for Rubber Farms',
    dates: 'May 22, 2025',
    venue: 'Ipil, Zamboanga Sibugay',
    status: 'Completed',
    progress: 'Completed · May 22',
    capacity: { max: 70, taken: 68 },
  },
  // ---- MAES ----
  {
    id: 'maes-orientation',
    start: '2025-06-17',
    agencyId: 'maes',
    category: 'Extension Activity',
    title: 'Farmer Livelihood Orientation',
    dates: 'June 17–19, 2025',
    venue: 'Municipal Hall, Ipil',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
  {
    id: 'maes-coop',
    start: '2025-08-12',
    agencyId: 'maes',
    category: 'Skills Training',
    title: 'Cooperative Bookkeeping Basics',
    dates: 'August 12–13, 2025',
    venue: 'MAES Office, Ipil',
    status: 'Upcoming',
    progress: 'Starts August 12',
    joinCode: 'MAES-CB02',
    capacity: { max: 30, taken: 12 },
  },
  // ---- DA Region IX (join code DARFO9-4K7Q) ----
  {
    id: 'da-ipm',
    start: '2025-06-17',
    agencyId: 'da9',
    category: 'Skills Training',
    title: 'Farmer Field School on Pest Management',
    dates: 'June 17–19, 2025',
    venue: 'DA-RFO9 Demo Farm, Zamboanga City',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
  // ---- PCA ----
  {
    id: 'pca-nursery',
    start: '2025-06-17',
    agencyId: 'pca',
    category: 'Skills Training',
    title: 'Coconut Seedling Nursery Management',
    dates: 'June 17–19, 2025',
    venue: 'PCA Zamboanga Office, Zamboanga City',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
  {
    id: 'pca-coconut-products',
    start: '2025-07-22',
    agencyId: 'pca',
    category: 'Seminar',
    title: 'Coconut By-Products Seminar',
    dates: 'July 22, 2025',
    venue: 'PCA Zamboanga Office, Zamboanga City',
    status: 'Upcoming',
    progress: 'Starts July 22',
    joinCode: 'PCA-CP03',
    capacity: { max: 60, taken: 41 },
  },
  // ---- BFAR ----
  {
    id: 'bfar-tilapia',
    start: '2025-06-17',
    agencyId: 'bfar',
    category: 'Extension Activity',
    title: 'Tilapia Pond Management',
    dates: 'June 17–19, 2025',
    venue: 'BFAR Demo Pond, Dipolog City',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
  {
    id: 'bfar-fisherfolk',
    start: '2025-05-13',
    agencyId: 'bfar',
    category: 'Seminar',
    title: 'Fisherfolk Registration and Safety Seminar',
    dates: 'May 13, 2025',
    venue: 'Municipal Gym, Sindangan',
    status: 'Completed',
    progress: 'Completed · May 13',
  },
  // ---- DOST Region IX (join code DOST9-8M2P) ----
  {
    id: 'dost-smart-farming',
    start: '2025-06-17',
    agencyId: 'dost9',
    category: 'Seminar',
    title: 'Smart Farming Technologies',
    dates: 'June 17–19, 2025',
    venue: 'DOST-IX Regional Office, Zamboanga City',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
  {
    id: 'dost-food-process',
    start: '2025-08-05',
    agencyId: 'dost9',
    category: 'Skills Training',
    title: 'Food Processing and Packaging',
    dates: 'August 5–6, 2025',
    venue: 'DOST-IX Regional Office, Zamboanga City',
    status: 'Upcoming',
    progress: 'Starts August 5',
    joinCode: 'DOST9-FP04',
    capacity: { max: 25, taken: 25 },
  },
  // ---- ATI RTC IX (join code ATI9-5R6D) ----
  {
    id: 'ati-learning-site',
    start: '2025-06-17',
    agencyId: 'ati9',
    category: 'Extension Activity',
    title: 'Learning Site Farmer Orientation',
    dates: 'June 17–19, 2025',
    venue: 'ATI-RTC9 Learning Site, Ipil',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
  {
    id: 'ati-agri-enterprise',
    start: '2025-07-15',
    agencyId: 'ati9',
    category: 'Skills Training',
    title: 'Agri-Fishery Entrepreneurship',
    dates: 'July 15–16, 2025',
    venue: 'ATI-RTC9, Ipil',
    status: 'Upcoming',
    progress: 'Starts July 15',
    joinCode: 'ATI9-AE05',
    capacity: { max: 35, taken: 9 },
  },
  // ---- WMSU Extension (join code WMSU-3XT1) ----
  {
    id: 'wmsu-digital',
    start: '2025-06-17',
    agencyId: 'wmsu',
    category: 'Extension Activity',
    title: 'Digital Literacy for Farmers',
    dates: 'June 17–19, 2025',
    venue: 'WMSU Extension Hall, Zamboanga City',
    status: 'Ongoing',
    progress: 'Happening now · Day 2 of 3',
  },
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** Month abbreviation and day of an activity's first day, for the date block (e.g. JUN / 17). */
export function dateParts(a: Activity) {
  const [, month, day] = a.start.split('-').map(Number);
  return { month: MONTHS[month - 1], day: String(day) };
}

/** Ongoing and completed activities are already registered; upcoming ones need the activity code. */
export const isRegistered = (a: Activity, joined: Record<string, true>) => a.status !== 'Upcoming' || !!joined[a.id];

/** Finds an organization, including ones joined with an invitation code. */
export const findAgency = (id: string) => agencies.find((a) => a.id === id) ?? invitations.find((i) => i.agency.id === id)?.agency;

export const activitiesOf = (agencyId: string) => activities.filter((a) => a.agencyId === agencyId);
