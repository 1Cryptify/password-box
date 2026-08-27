import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { Equipment } from '../../lib/types';
import { getEquipmentById, saveEquipment } from '../../lib/database';
import LeafletMap, { MapMarker } from '../../components/LeafletMap';
import { cacheAreaForZooms, isOnline } from '../../lib/tile-cache';
import { getPrecisePosition } from '../../lib/location';
import { useI18n } from '../../i18n';

const ACCURACY_THRESHOLD = 5;

export default function EquipmentLocationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tt } = useI18n();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [caching, setCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState('');
  const [locBusy, setLocBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const eq = await getEquipmentById(id);
    if (!eq) {
      router.back();
      return;
    }
    setEquipment(eq);
    setLatitude(eq.latitude);
    setLongitude(eq.longitude);
    setLoading(false);
  };

  const getSiteCenter = async () => {
    if (!equipment) return { latitude: 48.8566, longitude: 2.3522 };
    const { getSite } = await import('../../lib/database');
    const site = await getSite(equipment.siteId);
    if (site?.latitude && site?.longitude) {
      return { latitude: site.latitude, longitude: site.longitude };
    }
    return { latitude: 48.8566, longitude: 2.3522 };
  };

  const captureGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('equipment.locationNoPermissions'), t('equipment.locationNoPermissionsMsg'));
        return;
      }

      setLocBusy(true);
      const pos = await getPrecisePosition(ACCURACY_THRESHOLD);
      setLocBusy(false);

      if (!pos) {
        Alert.alert(t('common.error'), t('equipment.locationErr'));
        return;
      }

      setGpsAccuracy(pos.accuracy);

      if (pos.accuracy > ACCURACY_THRESHOLD) {
        Alert.alert(
          t('equipment.locationLowAcc'),
          t('equipment.locationLowAccMsg', {
            accuracy: pos.accuracy.toFixed(1),
            samples: pos.samples,
            threshold: ACCURACY_THRESHOLD,
          }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('equipment.locationUseAnyway'), onPress: () => applyPosition(pos.latitude, pos.longitude, pos.accuracy) },
          ]
        );
        return;
      }

      applyPosition(pos.latitude, pos.longitude, pos.accuracy);
    } catch {
      Alert.alert(t('common.error'), t('equipment.locationErr'));
    } finally {
      setLocBusy(false);
    }
  };

  const applyPosition = (lat: number, lng: number, accuracy: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setGpsAccuracy(accuracy);
  };

  const handleMapTap = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setGpsAccuracy(null);
  };

  const handleSave = async () => {
    if (!equipment) return;
    setSaving(true);
    try {
      await saveEquipment({
        ...equipment,
        latitude,
        longitude,
      });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('equipment.locationSaveErr'));
    } finally {
      setSaving(false);
    }
  };

  const handleClearLocation = () => {
    Alert.alert(
      t('equipment.locationClearTitle'),
      t('equipment.locationClearMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('equipment.locationClear'),
          style: 'destructive',
          onPress: () => {
            setLatitude(null);
            setLongitude(null);
            setGpsAccuracy(null);
          },
        },
      ]
    );
  };

  const handleCacheTiles = async () => {
    const online = await isOnline();
    if (!online) {
      Alert.alert(t('equipment.cacheTitle'), t('equipment.cacheMsg'));
      return;
    }

    setCaching(true);
    setCacheProgress(t('equipment.cacheDownloading'));

    try {
      const center = latitude != null && longitude != null
        ? { latitude, longitude }
        : await getSiteCenter();

      await cacheAreaForZooms(center.latitude, center.longitude, 14, 18, 4, (zoom, dl, total) => {
        setCacheProgress(t('map.tileProgress', { zoom, done: dl, total }));
      });

      setCacheProgress(t('map.cacheDone'));
      Alert.alert(t('map.cacheSuccess'), t('map.cacheDoneMsg'));
    } catch {
      Alert.alert(t('map.cacheError'), t('map.cacheErrorMsg2'));
    } finally {
      setCaching(false);
      setTimeout(() => setCacheProgress(''), 2000);
    }
  };

  if (loading || !equipment) return null;

  const siteCenter = equipment.latitude && equipment.longitude
    ? { latitude: equipment.latitude, longitude: equipment.longitude }
    : { latitude: 48.8566, longitude: 2.3522 };

  const mapMarkers: MapMarker[] = latitude != null && longitude != null
    ? [{
        id: 'equipment',
        latitude,
        longitude,
        title: equipment.name,
        color: Colors.primary,
      }]
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('equipment.locationTitle', { name: equipment.name })}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <LeafletMap
          center={latitude != null && longitude != null ? { latitude, longitude } : siteCenter}
          zoom={latitude != null ? 18 : 16}
          markers={mapMarkers}
          showMyLocation={false}
          onTap={handleMapTap}
          onMapReady={() => setMapReady(true)}
          style={styles.map}
        />

        {latitude != null && longitude != null && (
          <View style={styles.centerIndicator}>
            <View style={styles.centerDot} />
          </View>
        )}

        {caching && (
          <View style={styles.cacheOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.cacheText}>{cacheProgress}</Text>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={captureGPS}
          disabled={locBusy}
        >
          {locBusy ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="my-location" size={22} color={Colors.primary} />
          )}
          <Text style={styles.toolBtnText}>{locBusy ? t('equipment.locationCapture') : t('equipment.locationGps')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={handleCacheTiles}
          disabled={caching}
        >
          <MaterialIcons name="cloud-download" size={22} color={Colors.secondary} />
          <Text style={styles.toolBtnText}>{t('equipment.locationCache')}</Text>
        </TouchableOpacity>

        {latitude != null && (
          <TouchableOpacity style={styles.toolBtn} onPress={handleClearLocation}>
            <MaterialIcons name="delete-outline" size={22} color={Colors.error} />
            <Text style={styles.toolBtnText}>{t('equipment.locationClear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {latitude != null && longitude != null && (
        <View style={styles.coordsBar}>
          <MaterialIcons name="place" size={16} color={Colors.success} />
          <Text style={styles.coordsText}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
          {gpsAccuracy != null && (
            <Text style={[styles.accuracyText, gpsAccuracy <= ACCURACY_THRESHOLD ? styles.accuracyGood : styles.accuracyBad]}>
              ±{gpsAccuracy.toFixed(1)}m
            </Text>
          )}
        </View>
      )}

      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.infoText}>
          {t('equipment.locationInfo', { threshold: ACCURACY_THRESHOLD })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  map: {
    flex: 1,
  },
  centerIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  cacheOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,14,23,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cacheText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  toolBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  coordsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  coordsText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  accuracyGood: {
    color: Colors.success,
  },
  accuracyBad: {
    color: Colors.error,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  infoText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
});
