import * as Location from 'expo-location';

const ATTEMPT_TIMEOUT = 12000;
const LAST_KNOWN_MAX_AGE = 600000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function getPosition(): Promise<Location.LocationObject | null> {
  const accuracies = [Location.Accuracy.Balanced, Location.Accuracy.Highest];
  for (const accuracy of accuracies) {
    try {
      return await withTimeout(Location.getCurrentPositionAsync({ accuracy }), ATTEMPT_TIMEOUT);
    } catch {}
  }
  return await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE });
}

export interface PrecisePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  samples: number;
}

type Sample = { lat: number; lng: number; accuracy: number };

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function round1(x: number): number {
  return Math.round((x + Number.EPSILON) * 10) / 10;
}

/**
 * Agrège une série d'échantillons GPS en une position unique haute précision :
 * - calcule un centroïde robuste (médiane lat/lng) 
 * - rejette les outliers (multipath / bruit) éloignés de plus d'un seuil dérivé
 *   de l'accuracy observée
 * - moyenne les échantillons restants en pondérant par la fiabilité (1/précision)
 * - retourne la meilleure précision atteinte
 */
function aggregate(samples: Sample[]): PrecisePosition {
  if (samples.length === 1) {
    return {
      latitude: samples[0].lat,
      longitude: samples[0].lng,
      accuracy: round1(samples[0].accuracy),
      samples: 1,
    };
  }

  const sortedLat = samples.map((s) => s.lat).sort((a, b) => a - b);
  const sortedLng = samples.map((s) => s.lng).sort((a, b) => a - b);
  const sortedAcc = samples.map((s) => s.accuracy).sort((a, b) => a - b);
  const mid = Math.floor(samples.length / 2);

  const medLat = sortedLat[mid];
  const medLng = sortedLng[mid];
  const medAccuracy = sortedAcc[mid];

  const threshold = Math.max(medAccuracy * 2, 6);
  const clean = samples.filter(
    (s) => haversineMeters(s.lat, s.lng, medLat, medLng) <= threshold
  );

  if (clean.length === 0) {
    let bestIdx = 0;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].accuracy < samples[bestIdx].accuracy) bestIdx = i;
    }
    return {
      latitude: samples[bestIdx].lat,
      longitude: samples[bestIdx].lng,
      accuracy: round1(samples[bestIdx].accuracy),
      samples: samples.length,
    };
  }

  let wLat = 0;
  let wLng = 0;
  let wSum = 0;
  let best = Infinity;
  for (const s of clean) {
    const w = 1 / (s.accuracy || 1);
    wLat += s.lat * w;
    wLng += s.lng * w;
    wSum += w;
    if (s.accuracy < best) best = s.accuracy;
  }

  return {
    latitude: wLat / wSum,
    longitude: wLng / wSum,
    accuracy: round1(best),
    samples: clean.length,
  };
}

/**
 * Collecte en continu des lectures GPS GNSS (satellites, donc fonctionne hors ligne)
 * pendant une durée donnée, et s'arrête tôt dès qu'assez de lectures de bonne
 * précision ont été obtenues. Ignore les positions simulées.
 */
function collectRound(
  durationMs: number,
  targetAccuracy: number,
  minGoodSamples: number
): Promise<{ samples: Sample[]; reachedTarget: boolean }> {
  return new Promise((resolve) => {
    const samples: Sample[] = [];
    const started = Date.now();
    let subscription: Location.LocationSubscription | null = null;
    let done = false;

    const finish = (reached: boolean) => {
      if (done) return;
      done = true;
      try {
        subscription?.remove();
      } catch {}
      resolve({ samples: samples.slice(), reachedTarget: reached });
    };

    (async () => {
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 250,
            distanceInterval: 0,
          },
          (loc) => {
            if (loc.mocked) return;
            const accuracy = loc.coords.accuracy ?? Number.MAX_SAFE_INTEGER;
            samples.push({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy });
            const good = samples.filter((s) => s.accuracy <= targetAccuracy).length;
            if (good >= minGoodSamples) {
              finish(true);
            } else if (Date.now() - started >= durationMs) {
              finish(false);
            }
          }
        );
      } catch {
        finish(false);
      }
    })();
  });
}

/**
 * Capte une position de haute précision basée sur le GPS GNSS (satellites),
 * donc **fonctionne hors ligne** (aucune dépendance au réseau/WiFi) :
 * 1. vérifie simplement que les services de localisation sont actifs
 * 2. lance plusieurs cycles d'échantillonnage continu (watchPositionAsync en
 *    « BestForNavigation ») pour laisser le récepteur GPS se fixer, surtout
 *    utile hors ligne où le fix est plus lent (pas d'assistance réseau)
 * 3. s'arrête tôt dès qu'assez de lectures sous la précision cible sont reçues
 * 4. agrège l'ensemble des échantillons (rejet d'outliers + moyenne pondérée)
 *
 * Retourne null en cas d'échec complet.
 */
export async function getPrecisePosition(
  targetAccuracy = 5,
  minGoodSamples = 4,
  maxDurationMs = 30000,
  maxRounds = 3
): Promise<PrecisePosition | null> {
  try {
    if (!(await Location.hasServicesEnabledAsync())) return null;
  } catch {}

  const roundDuration = Math.max(5000, Math.floor(maxDurationMs / maxRounds));
  const allSamples: Sample[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const result = await collectRound(roundDuration, targetAccuracy, minGoodSamples);
    if (result.samples.length > 0) {
      allSamples.push(...result.samples);
      if (result.reachedTarget) break;
    }
  }

  if (allSamples.length === 0) return null;
  return aggregate(allSamples);
}
