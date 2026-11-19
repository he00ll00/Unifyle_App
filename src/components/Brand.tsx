import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_BRAND } from '@/data/mock';
import { Brand, makeBrand } from '@/theme';

const BrandCtx = createContext<Brand>(makeBrand(DEFAULT_BRAND));

export function BrandProvider({ color, children }: { color: string; children: React.ReactNode }) {
  const value = useMemo(() => makeBrand(color), [color]);
  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}

/** Brand colours of the agency whose screen is showing. */
export const useBrand = () => useContext(BrandCtx);
