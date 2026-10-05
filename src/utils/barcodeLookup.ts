export async function requestBarcodeLookup(
  barcode: string,
  options: { apiKey?: string; headers?: Record<string, string> } = {},
  fetcher: typeof fetch = fetch,
): Promise<any> {
  const controller = new AbortController();
  // The server can try web databases, then BarcodeFinder, then Gemini.
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetcher('/api/games/lookup-barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify({ barcode, apiKey: options.apiKey || undefined }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Service de recherche indisponible (HTTP ${response.status}). Réessayez dans quelques instants.`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error("L'API de recherche renvoie une page au lieu de JSON. Vérifiez le déploiement du serveur.");
    }
    const data = await response.json();
    if (typeof data?.found !== 'boolean' || (data.found && !data.game?.title)) {
      throw new Error('Réponse du service de recherche non valide. Réessayez.');
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Le service de recherche a dépassé le délai de réponse. Réessayez.');
    }
    if (error instanceof TypeError) {
      throw new Error('Impossible de joindre le service de recherche. Vérifiez votre connexion et réessayez.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
