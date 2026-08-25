import { Paths, File, Directory } from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

const TILE_DIR_NAME = 'osm_tiles';
const MIN_ZOOM = 2;
const MAX_ZOOM = 19;

function getTileDir(): Directory {
  return new Directory(Paths.document, TILE_DIR_NAME);
}

function getTileFile(x: number, y: number, z: number): File {
  return new File(Paths.document, TILE_DIR_NAME, `${z}`, `${x}`, `${y}.png`);
}

export function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export function tileToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

function tileUrl(x: number, y: number, z: number): string {
  const s = ['a', 'b', 'c'][Math.abs(x + y) % 3];
  return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

async function ensureDir(dir: Directory): Promise<void> {
  const info = Paths.info(dir.uri);
  if (!info.exists) {
    dir.create();
  }
}

export async function downloadTile(x: number, y: number, z: number): Promise<boolean> {
  try {
    const file = getTileFile(x, y, z);
    const info = Paths.info(file.uri);
    if (info.exists) return true;

    await ensureDir(new Directory(Paths.document, TILE_DIR_NAME, `${z}`, `${x}`));
    const url = tileUrl(x, y, z);
    await File.downloadFileAsync(url, file);
    return true;
  } catch {
    return false;
  }
}

export async function getTileLocal(x: number, y: number, z: number): Promise<string | null> {
  try {
    const file = getTileFile(x, y, z);
    const info = Paths.info(file.uri);
    if (info.exists) return file.uri;
    return null;
  } catch {
    return null;
  }
}

export async function cacheTilesForArea(
  centerLat: number,
  centerLng: number,
  zoom: number,
  radiusTiles: number = 3,
  onProgress?: (downloaded: number, total: number) => void
): Promise<number> {
  const center = latLngToTile(centerLat, centerLng, zoom);
  let downloaded = 0;
  const total = (radiusTiles * 2 + 1) * (radiusTiles * 2 + 1);

  for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (x < 0 || y < 0 || x >= Math.pow(2, zoom) || y >= Math.pow(2, zoom)) continue;

      const success = await downloadTile(x, y, zoom);
      if (success) downloaded++;
      onProgress?.(downloaded, total);
    }
  }

  return downloaded;
}

export async function cacheAreaForZooms(
  centerLat: number,
  centerLng: number,
  minZoom: number = 14,
  maxZoom: number = 18,
  radiusTiles: number = 3,
  onProgress?: (zoom: number, downloaded: number, total: number) => void
): Promise<void> {
  for (let z = minZoom; z <= maxZoom; z++) {
    const count = await cacheTilesForArea(centerLat, centerLng, z, radiusTiles, (dl, total) => {
      onProgress?.(z, dl, total);
    });
    onProgress?.(z, count, count);
  }
}

export async function getCachedTileCount(): Promise<number> {
  try {
    const dir = getTileDir();
    const info = Paths.info(dir.uri);
    if (!info.exists) return 0;

    let count = 0;
    const walk = (d: Directory): void => {
      const items = d.list();
      for (const item of items) {
        if (item instanceof Directory) {
          walk(item);
        } else if (item instanceof File && item.extension === '.png') {
          count++;
        }
      }
    };
    walk(dir);
    return count;
  } catch {
    return 0;
  }
}

export async function clearTileCache(): Promise<void> {
  try {
    const dir = getTileDir();
    const info = Paths.info(dir.uri);
    if (info.exists) {
      dir.delete();
    }
  } catch {}
}

export { MIN_ZOOM, MAX_ZOOM };
