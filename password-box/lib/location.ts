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