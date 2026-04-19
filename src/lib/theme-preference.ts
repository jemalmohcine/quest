/** Doit rester aligné avec le script inline dans index.html (clé + logique). */
export const QUEST_THEME_STORAGE_KEY = 'quest-theme';

export function applyDomTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

export function persistTheme(theme: 'light' | 'dark' | 'system'): void {
  try {
    localStorage.setItem(QUEST_THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode, quota, etc. */
  }
}

export function readPersistedTheme(): 'light' | 'dark' | 'system' | null {
  try {
    const v = localStorage.getItem(QUEST_THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return null;
}
