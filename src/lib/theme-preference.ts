/**
 * Clé localStorage + logique d’application : doit rester alignée avec
 * `THEME_INIT_INLINE` (script beforeInteractive dans le layout).
 */
export const QUEST_THEME_STORAGE_KEY = 'quest-theme';

/**
 * Script synchrone exécuté avant l’hydratation pour éviter le flash clair → sombre
 * quand l’OS est en dark et le thème est « système » (ou sans préférence stockée).
 */
export const THEME_INIT_INLINE = `(function(){try{var k=${JSON.stringify(QUEST_THEME_STORAGE_KEY)};var v=localStorage.getItem(k);if(v!=="light"&&v!=="dark"&&v!=="system")v="system";var r=document.documentElement;r.classList.remove("light","dark");if(v==="system"){r.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}else{r.classList.add(v);}}catch(e){}})();`;

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
