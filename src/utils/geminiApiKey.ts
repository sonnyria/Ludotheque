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
 * Validates a Gemini API key with the backend and direct fallback
 */
export async function validateGeminiApiKey(
  apiKey: string
): Promise<{ valid: boolean; message: string; error?: string }> {
  const cleanKey = apiKey.trim();

  if (!cleanKey) {
    return {
      valid: false,
      message: 'Veuillez renseigner une clé API avant de tester.',
    };
  }

  // Vérification basique du format officiel Google AI Studio
  if (!cleanKey.startsWith('AIzaSy') || cleanKey.length < 25) {
    return {
      valid: false,
      message: 'Format de clé invalide : une clé d\'API officielle Google Gemini commence toujours par "AIzaSy..." et comporte environ 39 caractères. Vérifiez que vous n\'avez pas inclus d\'espace ou de guillemets.',
    };
  }

  // 1. Tenter la validation via notre serveur backend (/api/gemini/validate-key)
  try {
    const res = await fetch('/api/gemini/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': cleanKey,
      },
      body: JSON.stringify({ apiKey: cleanKey }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Le serveur a retourné du texte ou du HTML (ex: page de démarrage Cloud Run ou erreur proxy)
      console.warn('Réponse non-JSON du serveur backend:', text.slice(0, 100));
    }

    if (data && typeof data.valid === 'boolean') {
      if (data.valid) {
        return {
          valid: true,
          message: data.message || 'Clé API Gemini validée avec succès ! L\'IA est prête.',
        };
      } else {
        return {
          valid: false,
          message: data.error || 'Clé API invalide ou refusée par Google.',
          error: data.raw,
        };
      }
    }
  } catch (err: any) {
    console.warn('Échec de la requête vers le backend, passage au test direct auprès de Google:', err);
  }

  // 2. Fallback de secours direct auprès de Google Generative Language API (navigateur -> Google)
  // Cela évite tout problème de proxy, de timeout ou d'erreur "Unexpected token T"
  try {
    const googleRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
        }),
      }
    );

    const googleText = await googleRes.text();
    let googleData: any = null;
    try {
      googleData = JSON.parse(googleText);
    } catch {
      // Ignorer
    }

    if (googleRes.ok && (googleData?.candidates || googleData?.promptFeedback)) {
      return {
        valid: true,
        message: 'Clé API Gemini vérifiée avec succès auprès de Google ! L\'IA est prête.',
      };
    }

    if (googleData?.error) {
      const errObj = googleData.error;
      const msg = errObj.message || '';
      const status = errObj.status || '';
      if (status === 'INVALID_ARGUMENT' || /API_KEY_INVALID|API key not valid/i.test(msg)) {
        return {
          valid: false,
          message: 'Clé API rejetée par Google : clé invalide. Vérifiez que vous avez bien copié toute la clé depuis Google AI Studio.',
          error: msg,
        };
      }
      if (status === 'PERMISSION_DENIED' || /PERMISSION_DENIED/i.test(msg)) {
        return {
          valid: false,
          message: 'Accès refusé par Google : vérifiez que l\'API Gemini est bien activée pour votre compte Google Cloud / AI Studio.',
          error: msg,
        };
      }
      if (status === 'RESOURCE_EXHAUSTED' || /quota/i.test(msg)) {
        return {
          valid: true,
          message: 'Clé API Gemini reconnue et valide ! (Note : le quota temporaire de requêtes est saturé, Google va le réinitialiser sous peu).',
        };
      }
      return {
        valid: false,
        message: `Erreur signalée par Google : ${msg}`,
        error: msg,
      };
    }

    return {
      valid: false,
      message: 'Impossible de valider la clé API. Vérifiez votre connexion internet ou le format de votre clé.',
    };
  } catch (directErr: any) {
    return {
      valid: false,
      message: 'Impossible de contacter les services Google pour valider la clé. Vérifiez votre connexion internet.',
      error: directErr?.message,
    };
  }
}
