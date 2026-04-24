/** Clé Gemini côté serveur uniquement (jamais NEXT_PUBLIC_). */
export function getGeminiServerApiKey(): string | null {
  const k =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY_NEW?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!k || k === 'MY_GEMINI_API_KEY') return null;
  return k;
}
