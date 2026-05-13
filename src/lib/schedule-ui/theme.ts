import type { DailySkedTheme } from './types';

export function themeToStyle(theme?: DailySkedTheme): string | undefined {
  if (!theme) return undefined;
  const entries = Object.entries(theme)
    .filter(([key, value]) => key.startsWith('--ds-') && value !== undefined && value !== null)
    .map(([key, value]) => `${key}:${String(value)}`);
  return entries.length > 0 ? entries.join(';') : undefined;
}
