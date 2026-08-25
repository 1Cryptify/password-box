import * as Crypto from 'expo-crypto';

export async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    'passwordbox_salt_' + pin + '_v1'
  );
}

export function generateId(): string {
  return Crypto.randomUUID();
}

function base64Encode(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    output += chars.charAt(a >> 2);
    output += chars.charAt(((a & 3) << 4) | (b >> 4));
    output += i + 1 < bytes.length ? chars.charAt(((b & 15) << 2) | (c >> 6)) : '=';
    output += i + 2 < bytes.length ? chars.charAt(c & 63) : '=';
  }
  return output;
}

function base64Decode(str: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = str.replace(/=+$/, '');
  const output = new Uint8Array(Math.floor(clean.length * 3 / 4));
  let idx = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = chars.indexOf(clean.charAt(i));
    const b = chars.indexOf(clean.charAt(i + 1));
    const c = i + 2 < clean.length ? chars.indexOf(clean.charAt(i + 2)) : 0;
    const d = i + 3 < clean.length ? chars.indexOf(clean.charAt(i + 3)) : 0;
    if (idx < output.length) output[idx++] = (a << 2) | (b >> 4);
    if (idx < output.length) output[idx++] = ((b & 15) << 4) | (c >> 2);
    if (idx < output.length) output[idx++] = ((c & 3) << 6) | d;
  }
  return output.slice(0, idx);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const pwHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );

  const pwBytes = base64Decode(pwHash);
  const combined = new Uint8Array(salt.length + pwBytes.length);
  combined.set(salt, 0);
  combined.set(pwBytes, salt.length);

  const result = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64Encode(combined)
  );

  const decoded = base64Decode(result);
  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = decoded[i % decoded.length];
  }
  return keyBytes;
}

export async function encryptData(data: string, key: string): Promise<string> {
  const salt = Crypto.getRandomValues(new Uint8Array(16));

  const keyBytes = await deriveKey(key, salt);

  const dataBytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    dataBytes[i] = data.charCodeAt(i);
  }

  const encrypted = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    if (i > 0) encrypted[i] ^= encrypted[i - 1];
  }

  const result = new Uint8Array(salt.length + encrypted.length);
  result.set(salt, 0);
  result.set(encrypted, salt.length);

  return base64Encode(result);
}

export async function decryptData(encryptedBase64: string, key: string): Promise<string> {
  const raw = base64Decode(encryptedBase64);

  const salt = raw.slice(0, 16);
  const encrypted = raw.slice(16);

  const keyBytes = await deriveKey(key, salt);

  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    const val = encrypted[i] ^ (i > 0 ? encrypted[i - 1] : 0);
    decrypted[i] = val ^ keyBytes[i % keyBytes.length];
  }

  let output = '';
  for (let i = 0; i < decrypted.length; i++) {
    output += String.fromCharCode(decrypted[i]);
  }
  return output;
}
