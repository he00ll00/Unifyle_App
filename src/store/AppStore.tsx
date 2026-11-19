import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { agencies as defaultAgencies, Agency, invitations } from '@/data/mock';

type JoinResult = { ok: true; agency: Agency } | { ok: false; error: string };

type State = {
  agencies: Agency[];
  /** Organizations the participant left, so the sample ones don't come back on the next start. */
  hiddenAgencyIds: string[];
};

const KEY = 'unifyle.state.v5';
const initial: State = { agencies: defaultAgencies, hiddenAgencyIds: [] };

/** Saved data may come from an older app version: refresh known agencies and drop malformed ones. */
function normalize(value: unknown): State {
  const saved = value && typeof value === 'object' ? (value as Partial<State>) : {};
  const catalog = [...defaultAgencies, ...invitations.map((i) => i.agency)];
  const savedAgencies = (Array.isArray(saved.agencies) ? saved.agencies : [])
    .map((a) => {
      const known = catalog.find((c) => c.id === a?.id);
      return known ? { ...known, memberSince: a.memberSince || known.memberSince } : a;
    })
    .filter((a): a is Agency => !!a && typeof a.brand === 'string' && typeof a.short === 'string');
  const hiddenAgencyIds = (Array.isArray(saved.hiddenAgencyIds) ? saved.hiddenAgencyIds : []).filter(
    (id): id is string => typeof id === 'string',
  );
  // Keep the saved order (the participant can reorder). Sample organizations added in a newer
  // version appear at the end, unless the participant has left them.
  const agencies = [
    ...savedAgencies.filter((a) => !hiddenAgencyIds.includes(a.id)),
    ...defaultAgencies.filter((d) => !hiddenAgencyIds.includes(d.id) && !savedAgencies.some((a) => a.id === d.id)),
  ];
  return { agencies, hiddenAgencyIds };
}

type Store = State & {
  hydrated: boolean;
  online: boolean;
  joinAgency: (code: string) => JoinResult;
  leaveAgency: (agencyId: string) => void;
  moveAgency: (agencyId: string, direction: -1 | 1) => void;
};

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const ref = useRef(state);

  const commit = useCallback((next: State) => {
    ref.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (active && raw) commit(normalize(JSON.parse(raw)));
      } catch {}
      if (active) setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [commit]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  // Poll connectivity (shown on the Profile screen).
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const s = await Network.getNetworkStateAsync();
        if (active) setOnline(!!s.isConnected && s.isInternetReachable !== false);
      } catch {}
    };
    check();
    const t = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  // Redeems an invitation code. A real app needs the server for this; here it checks the sample codes.
  const joinAgency: Store['joinAgency'] = useCallback(
    (raw) => {
      const code = raw.trim().toUpperCase();
      if (!code) return { ok: false, error: 'Enter the invitation code from your agency.' };
      const invitation = invitations.find((item) => item.code === code);
      if (!invitation) return { ok: false, error: 'That code is not valid. Check it and try again.' };
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date())
        return { ok: false, error: 'This invitation code has expired. Ask your agency for a new one.' };
      if (invitation.maxUses !== undefined && invitation.uses >= invitation.maxUses)
        return { ok: false, error: 'This invitation code has reached its limit.' };
      const current = ref.current;
      if (current.agencies.some((agency) => agency.id === invitation.agency.id))
        return { ok: false, error: `You are already a member of ${invitation.agency.name}.` };
      const agency: Agency = {
        ...invitation.agency,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      commit({
        agencies: [...current.agencies, agency],
        hiddenAgencyIds: current.hiddenAgencyIds.filter((id) => id !== agency.id),
      });
      return { ok: true, agency };
    },
    [commit],
  );

  const leaveAgency: Store['leaveAgency'] = useCallback(
    (agencyId) => {
      const current = ref.current;
      commit({
        agencies: current.agencies.filter((a) => a.id !== agencyId),
        hiddenAgencyIds: current.hiddenAgencyIds.includes(agencyId) ? current.hiddenAgencyIds : [...current.hiddenAgencyIds, agencyId],
      });
    },
    [commit],
  );

  const moveAgency: Store['moveAgency'] = useCallback(
    (agencyId, direction) => {
      const current = ref.current;
      const from = current.agencies.findIndex((a) => a.id === agencyId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.agencies.length) return;
      const agencies = [...current.agencies];
      [agencies[from], agencies[to]] = [agencies[to], agencies[from]];
      commit({ ...current, agencies });
    },
    [commit],
  );

  const value = useMemo<Store>(
    () => ({ ...state, hydrated: loaded, online, joinAgency, leaveAgency, moveAgency }),
    [state, loaded, online, joinAgency, leaveAgency, moveAgency],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside AppStoreProvider');
  return v;
}
