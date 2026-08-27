import AsyncStorage from '@react-native-async-storage/async-storage';
import { Site, Equipment, Credential } from './types';
import { generateId } from './encryption';

const KEYS = {
  SITES: '@passwordbox_sites',
  EQUIPMENT: '@passwordbox_equipment',
  CREDENTIALS: '@passwordbox_credentials',
  PIN: '@passwordbox_pin',
  PIN_HASH: '@passwordbox_pin_hash',
  ENCRYPTION_KEY: '@passwordbox_enc_key',
  FIRST_LAUNCH: '@passwordbox_first_launch',
  LOCKOUT_UNTIL: '@passwordbox_lockout',
  PIN_ATTEMPTS: '@passwordbox_attempts',
};

// --- Generic helpers ---
async function getAll<T>(key: string): Promise<T[]> {
  const json = await AsyncStorage.getItem(key);
  return json ? JSON.parse(json) : [];
}

async function saveAll<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// --- Sites ---
export async function getSites(): Promise<Site[]> {
  return getAll<Site>(KEYS.SITES);
}

export async function getSite(id: string): Promise<Site | undefined> {
  const sites = await getSites();
  return sites.find((s) => s.id === id);
}

export async function saveSite(site: Site): Promise<void> {
  const sites = await getSites();
  const idx = sites.findIndex((s) => s.id === site.id);
  if (idx >= 0) {
    sites[idx] = { ...site, updatedAt: new Date().toISOString() };
  } else {
    sites.push(site);
  }
  await saveAll(KEYS.SITES, sites);
}

export async function deleteSite(id: string): Promise<void> {
  const sites = await getSites();
  await saveAll(
    KEYS.SITES,
    sites.filter((s) => s.id !== id)
  );
  // Delete related equipment and credentials
  const equipment = await getEquipment();
  const relatedEquipment = equipment.filter((e) => e.siteId === id);
  for (const eq of relatedEquipment) {
    await deleteEquipment(eq.id);
  }
}

// --- Equipment ---
export async function getEquipment(): Promise<Equipment[]> {
  return getAll<Equipment>(KEYS.EQUIPMENT);
}

export async function getEquipmentBySite(siteId: string): Promise<Equipment[]> {
  const all = await getEquipment();
  return all.filter((e) => e.siteId === siteId);
}

export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  const all = await getEquipment();
  return all.find((e) => e.id === id);
}

export async function saveEquipment(equipment: Equipment): Promise<void> {
  const all = await getEquipment();
  const idx = all.findIndex((e) => e.id === equipment.id);
  if (idx >= 0) {
    all[idx] = { ...equipment, updatedAt: new Date().toISOString() };
  } else {
    all.push(equipment);
  }
  await saveAll(KEYS.EQUIPMENT, all);
}

export async function deleteEquipment(id: string): Promise<void> {
  const all = await getEquipment();
  await saveAll(
    KEYS.EQUIPMENT,
    all.filter((e) => e.id !== id)
  );
  // Delete related credentials
  const creds = await getCredentials();
  const related = creds.filter((c) => c.equipmentId === id);
  for (const c of related) {
    await deleteCredential(c.id);
  }
}

// --- Credentials ---
export async function getCredentials(): Promise<Credential[]> {
  return getAll<Credential>(KEYS.CREDENTIALS);
}

export async function getCredentialsByEquipment(equipmentId: string): Promise<Credential[]> {
  const all = await getCredentials();
  return all.filter((c) => c.equipmentId === equipmentId);
}

export async function getCredential(id: string): Promise<Credential | undefined> {
  const all = await getCredentials();
  return all.find((c) => c.id === id);
}

export async function saveCredential(credential: Credential): Promise<void> {
  const all = await getCredentials();
  const idx = all.findIndex((c) => c.id === credential.id);
  if (idx >= 0) {
    all[idx] = { ...credential, updatedAt: new Date().toISOString() };
  } else {
    all.push(credential);
  }
  await saveAll(KEYS.CREDENTIALS, all);
}

export async function deleteCredential(id: string): Promise<void> {
  const all = await getCredentials();
  await saveAll(
    KEYS.CREDENTIALS,
    all.filter((c) => c.id !== id)
  );
}

// --- PIN ---
export async function getPinHash(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.PIN_HASH);
}

export async function setPinHash(hash: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.PIN_HASH, hash);
}

// --- Auth Session ---
export async function isAuthenticated(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.PIN);
  return val === 'authenticated';
}

export async function setAuthenticated(): Promise<void> {
  await AsyncStorage.setItem(KEYS.PIN, 'authenticated');
}

export async function clearAuthenticated(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PIN);
}

// --- Lockout ---
const LOCKOUT_DURATION = 3 * 60 * 60 * 1000; // 3 hours

export async function getLockoutUntil(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.LOCKOUT_UNTIL);
  return val ? parseInt(val, 10) : 0;
}

export async function setLockout(): Promise<void> {
  const until = Date.now() + LOCKOUT_DURATION;
  await AsyncStorage.setItem(KEYS.LOCKOUT_UNTIL, until.toString());
}

export async function clearLockout(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.LOCKOUT_UNTIL);
}

export async function getAttempts(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.PIN_ATTEMPTS);
  return val ? parseInt(val, 10) : 0;
}

export async function setAttempts(count: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.PIN_ATTEMPTS, count.toString());
}

// --- First Launch ---
export async function isFirstLaunch(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.FIRST_LAUNCH);
  return val === null;
}

export async function setFirstLaunchDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.FIRST_LAUNCH, 'done');
}

// --- Export/Import ---
export async function getAllData(): Promise<{ sites: Site[]; equipment: Equipment[]; credentials: Credential[] }> {
  return {
    sites: await getSites(),
    equipment: await getEquipment(),
    credentials: await getCredentials(),
  };
}

export async function importAllData(data: {
  sites: Site[];
  equipment: Equipment[];
  credentials: Credential[];
}): Promise<void> {
  await saveAll(KEYS.SITES, data.sites);
  await saveAll(KEYS.EQUIPMENT, data.equipment);
  await saveAll(KEYS.CREDENTIALS, data.credentials);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SITES);
  await AsyncStorage.removeItem(KEYS.EQUIPMENT);
  await AsyncStorage.removeItem(KEYS.CREDENTIALS);
  await AsyncStorage.removeItem(KEYS.PIN);
  await AsyncStorage.removeItem(KEYS.PIN_HASH);
  await AsyncStorage.removeItem(KEYS.ENCRYPTION_KEY);
  await AsyncStorage.removeItem(KEYS.FIRST_LAUNCH);
  await AsyncStorage.removeItem(KEYS.LOCKOUT_UNTIL);
  await AsyncStorage.removeItem(KEYS.PIN_ATTEMPTS);
  await AsyncStorage.removeItem('@passwordbox_auth');
  try {
    const { deleteRecoveryKey } = await import('./recovery');
    await deleteRecoveryKey();
  } catch {
    // récupération déjà absente
  }
  try {
    const { clearTileCache } = await import('./tile-cache');
    await clearTileCache();
  } catch {
    // cache absent
  }
}

// --- Personal mode helpers ---
export async function getCredentialsBySite(siteId: string): Promise<Credential[]> {
  const equipment = await getEquipmentBySite(siteId);
  const allCreds = await getCredentials();
  const eqIds = new Set(equipment.map((e) => e.id));
  return allCreds.filter((c) => eqIds.has(c.equipmentId));
}

export async function getEquipmentCountForSite(siteId: string): Promise<number> {
  const equipment = await getEquipmentBySite(siteId);
  return equipment.length;
}

export async function getCredentialCountForSite(siteId: string): Promise<number> {
  const creds = await getCredentialsBySite(siteId);
  return creds.length;
}

export async function createPersonalSite(site: Site): Promise<string> {
  await saveSite(site);
  const equipmentId = generateId();
  await saveEquipment({
    id: equipmentId,
    siteId: site.id,
    name: 'Comptes personnels',
    type: 'autre',
    customType: 'Comptes personnels',
    os: 'autre',
    customOS: '',
    hostname: '',
    ipAddress: '',
    latitude: null,
    longitude: null,
    notes: '',
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  });
  return equipmentId;
}
