export const GEMINI_API_KEY_STORAGE_KEY = 'ludotheque_gemini_api_key';

/**
 * Retrieves the stored Gemini API key from localStorage
 */
export function getStoredGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)?.trim() || '';
  } catch (e) {
    console.error('Erreur lecture clé API Gemini:', e);
    return '';
  }
}

export function hasStoredGeminiApiKey(): boolean {
  return Boolean(getStoredGeminiApiKey());
}

/**
 * Saves or clears the Gemini API key in localStorage
 */
export function setStoredGeminiApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (!trimmed) {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
    }
    // Dispatch a custom event so components can update reactively
    window.dispatchEvent(new CustomEvent('gemini-api-key-changed', { detail: trimmed }));
  } catch (e) {
    console.error('Erreur sauvegarde clé API Gemini:', e);
  }
}

/**
 * Returns HTTP headers containing the custom Gemini API key if present
 */
export function getGeminiAuthHeaders(): Record<string, string> {
  const key = getStoredGeminiApiKey();
  if (key) {
    return {
      'x-gemini-api-key': key,
    };
  }
  return {};
}

/**
 * Validates a Gemini API key with the backend
 */
export async function validateGeminiApiKey(
  apiKey: string
): Promise<{ valid: boolean; message: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': apiKey.trim(),
      },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });

    const data = await res.json();
    if (res.ok && data.valid) {
      return {
        valid: true,
        message: data.message || 'Clé API Gemini valide et opérationnelle !',
      };
    } else {
      return {
        valid: false,
        message: data.error || 'Clé API invalide ou non reconnue.',
        error: data.raw,
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      message: 'Impossible de contacter le serveur pour valider la clé.',
      error: err?.message,
    };
  }
}
