/** URL absolue vers une route interne (API, etc.) depuis le navigateur. */
export function clientApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${p}`;
  }
  return p;
}
