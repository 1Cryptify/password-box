import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEYS = {
  RECOVERY_HASH: '@passwordbox_recovery_hash',
};

function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = Crypto.getRandomValues(new Uint8Array(16));
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += chars[bytes[i] % chars.length];
    if (i === 3 || i === 7 || i === 11) key += '-';
  }
  return key;
}

export async function createRecoveryKey(): Promise<string> {
  const key = generateRecoveryKey();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    'passwordbox_recovery_' + key + '_v1'
  );
  await AsyncStorage.setItem(KEYS.RECOVERY_HASH, hash);
  return key;
}

export async function verifyRecoveryKey(key: string): Promise<boolean> {
  const storedHash = await AsyncStorage.getItem(KEYS.RECOVERY_HASH);
  if (!storedHash) return false;
  const inputHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    'passwordbox_recovery_' + key.toUpperCase().trim() + '_v1'
  );
  return storedHash === inputHash;
}

export async function hasRecoveryKey(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.RECOVERY_HASH);
  return val !== null;
}

export async function deleteRecoveryKey(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.RECOVERY_HASH);
}
