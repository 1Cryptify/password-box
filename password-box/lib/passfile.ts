import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { encryptData, decryptData } from './encryption';
import { AppData, PassFile } from './types';

const MAGIC = 'PBX1';

export async function getDeviceId(): Promise<string> {
  const parts = [
    Device.brand ?? '',
    Device.modelName ?? '',
    Device.deviceName ?? '',
    Device.osBuildId ?? '',
    Device.osName ?? '',
    String(Device.totalMemory ?? ''),
    Constants.installationId ?? '',
  ];
  const raw = parts.join('|');
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    'passwordbox_device_' + raw + '_v1'
  );
  return hash.substring(0, 15).toUpperCase();
}

export async function getDeviceLabel(): Promise<string> {
  const brand = Device.brand ?? '';
  const model = Device.modelName ?? '';
  return [brand, model].filter(Boolean).join(' ') || 'Appareil inconnu';
}

export async function createPassFile(
  data: AppData,
  whitelist: string[]
): Promise<string> {
  const deviceId = await getDeviceId();
  const jsonData = JSON.stringify(data);
  const encrypted = await encryptData(jsonData, deviceId);

  const pass: PassFile = {
    magic: MAGIC,
    whitelist,
    payload: encrypted,
  };

  return JSON.stringify(pass);
}

export async function readPassFile(
  content: string,
  deviceId: string
): Promise<AppData | null> {
  let pass: PassFile;
  try {
    pass = JSON.parse(content);
  } catch {
    return null;
  }

  if (!pass.magic || pass.magic !== MAGIC) return null;
  if (!pass.whitelist || !Array.isArray(pass.whitelist)) return null;
  if (!pass.payload || typeof pass.payload !== 'string') return null;

  if (!pass.whitelist.includes(deviceId)) return null;

  try {
    const json = await decryptData(pass.payload, deviceId);
    const data: AppData = JSON.parse(json);
    if (!data.sites || !data.equipment || !data.credentials) return null;
    return data;
  } catch {
    return null;
  }
}
