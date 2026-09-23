  if (cleanCandidates.length === 0) return null;

  // Validation: Must have at least some gaming indicator if console was not detected
  const hasGamingContext = allTexts.some(txt =>
    /\b(?:jeu|video\s*game|videogame|gaming|console|playstation|xbox|nintendo|switch|gamecube|sega|atari|game\s*boy|rom|cartridge|disk|disc|edition|remaster|rockstar|ubisoft|konami|capcom|bandai|square\s*enix|electronic\s*arts|bethesda)\b/i.test(txt)
  );
  if (detectedConsole === 'Autre' && !hasGamingContext) {
    return null;
  }

  // A barcode result is only accepted when the same title is independently
  // observed by at least two search results. This prevents a single noisy
  // marketplace/search hit from becoming the identified game.
  const normalizeCandidateTitle = (title: string) =>
    title.toLowerCase()
      .replace(/[^a-z0-9àâçéèêëîïôûùüÿñæœ]+/gi, ' ')
      .replace(/\b(ii|2)\b/gi, '2')
      .replace(/\s+/g, ' ')
      .trim();

  // Weighted consensus. Keep every occurrence's own weight: using
  // rawTitles.indexOf() here used to discard the weight of duplicate hits.
  const weightedFrequency = new Map<string, number>();
  const occurrenceCount = new Map<string, number>();
  const maxSourceWeight = new Map<string, number>();

  for (let i = 0; i < cleanCandidates.length; i++) {
    const candidate = cleanCandidates[i];
    const key = normalizeCandidateTitle(candidate.title);
    const rawIndex = rawTitles.indexOf(candidate.title);
    const weight = rawIndex >= 0 ? (rawTitleWeights[rawIndex] || 1) : 1;
    weightedFrequency.set(key, (weightedFrequency.get(key) || 0) + weight);
    occurrenceCount.set(key, (occurrenceCount.get(key) || 0) + 1);
    maxSourceWeight.set(key, Math.max(maxSourceWeight.get(key) || 0, weight));
  }

  cleanCandidates.sort((a, b) => {
    const ka = normalizeCandidateTitle(a.title);
    const kb = normalizeCandidateTitle(b.title);
    const wa = weightedFrequency.get(ka) || 0;
    const wb = weightedFrequency.get(kb) || 0;
    const oa = occurrenceCount.get(ka) || 0;
    const ob = occurrenceCount.get(kb) || 0;
    return (wb * 100 + ob * 10 + b.score) - (wa * 100 + oa * 10 + a.score);
  });

  const bestCandidate = cleanCandidates[0];
  const bestKey = bestCandidate ? normalizeCandidateTitle(bestCandidate.title) : '';
  const bestWeight = bestKey ? (weightedFrequency.get(bestKey) || 0) : 0;
  const bestOccurrences = bestKey ? (occurrenceCount.get(bestKey) || 0) : 0;
  const bestSourceWeight = bestKey ? (maxSourceWeight.get(bestKey) || 0) : 0;

  // A specialized barcode database hit (weight 4) is already strong enough
  // to identify a product. Generic search results still require corroboration.
  // This is deliberately more usable than rejecting valid games simply because
  // one search engine returned a slightly different title variant.
  const hasTrustedDirectHit = bestSourceWeight >= 4 && bestWeight >= 4;
  const hasCorroboratedHit = bestOccurrences >= 2 && bestWeight >= 3;

  if (!bestCandidate || (!hasTrustedDirectHit && !hasCorroboratedHit)) return null;
  if (bestCandidate.score < -20) return null;
  if (detectedConsole === 'Autre' && !hasGamingContext && bestCandidate.score < 25) return null;

  const bestTitle = bestCandidate.title;

  return {
    title: bestTitle,
    console: detectedConsole,
    releaseYear: detectedYear,
    publisher: detectedPublisher,
    genre: guessGameGenre(bestTitle),
    rawText: allTexts.slice(0, 8).join(' | ').slice(0, 600)
  };