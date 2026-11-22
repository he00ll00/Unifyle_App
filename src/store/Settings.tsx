import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * The person's own app settings, kept on the phone.
 *
 * Text size is applied by our Text and TextInput components (src/components/Text.tsx), so every screen
 * follows it. It stacks on top of the phone's own text size setting (Settings > Display), which the app
 * also respects, so someone who already enlarged their phone's text does not need to change anything.
 */
export type TextSize = 'small' | 'default' | 'large' | 'xlarge';

export const TEXT_SIZES: { value: TextSize; label: string; scale: number }[] = [
  { value: 'small', label: 'Small', scale: 0.9 },
  { value: 'default', label: 'Default', scale: 1 },
  { value: 'large', label: 'Large', scale: 1.15 },
  { value: 'xlarge', label: 'Extra large', scale: 1.3 },
];

type Settings = { textSize: TextSize };
const KEY = 'unifyle.settings.v1';
const initial: Settings = { textSize: 'default' };

type Ctx = Settings & { scale: number; setTextSize: (v: TextSize) => void };
const SettingsCtx = createContext<Ctx>({ ...initial, scale: 1, setTextSize: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Settings>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const saved = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
        if (live && saved.textSize && TEXT_SIZES.some((t) => t.value === saved.textSize)) setState({ textSize: saved.textSize });
      } catch {}
      if (live) setLoaded(true);
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const setTextSize = useCallback((textSize: TextSize) => setState((s) => ({ ...s, textSize })), []);
  const value = useMemo<Ctx>(
    () => ({ ...state, scale: TEXT_SIZES.find((t) => t.value === state.textSize)?.scale ?? 1, setTextSize }),
    [state, setTextSize],
  );
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
