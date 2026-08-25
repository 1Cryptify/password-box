import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { Site, Equipment, EQUIPMENT_ICONS, EQUIPMENT_TYPE_LABELS } from '../../lib/types';
import { getSite, getEquipmentBySite, getCredentialsByEquipment } from '../../lib/database';
import LeafletMap, { MapMarker } from '../../components/LeafletMap';
import { cacheAreaForZooms, isOnline } from '../../lib/tile-cache';
import { EQUIPMENT_ICONS as ICON_MAP } from '../../lib/types';

const EQUIPMENT_COLORS: Record<string, string> = {
  routeur: '#FF6B6B',
  switch: '#6BCB77',
  firewall: '#FFD93D',
  serveur: '#6C63FF',
  pc: '#00C9A7',
  laptop: '#8B85FF',
  imprimante: '#FF9671',
  ap_wifi: '#00D2D3',
  phone_ip: '#FECA57',
  cam_ip: '#FF9FF3',
  nas: '#54A0FF',
  ups: '#C8D6E5',
  autre: '#A7A9BE',
};

export default function SiteMapScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [credCounts, setCredCounts] = useState<Record<string, number>>({});
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [caching, setCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState('');
  const [showList, setShowList] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const s = await getSite(id);
    if (!s) {
      router.back();
      return;
    }
    setSite(s);
    const eq = await getEquipmentBySite(id);
    setEquipmentList(eq);
    const counts: Record<string, number> = {};
    for (const e of eq) {
      const creds = await getCredentialsByEquipment(e.id);
      counts[e.id] = creds.length;
    }
    setCredCounts(counts);
  };

  const getCenter = () => {
    if (site?.latitude && site?.longitude) {
      return { latitude: site.latitude, longitude: site.longitude };
    }
    const located = equipmentList.filter((e) => e.latitude != null && e.longitude != null);
    if (located.length > 0) {
      const avgLat = located.reduce((s, e) => s + e.latitude!, 0) / located.length;
      const avgLng = located.reduce((s, e) => s + e.longitude!, 0) / located.length;
      return { latitude: avgLat, longitude: avgLng };
    }
    return { latitude: 48.8566, longitude: 2.3522 };
  };

  const getMapMarkers = (): MapMarker[] => {
    return equipmentList
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        id: e.id,
        latitude: e.latitude!,
        longitude: e.longitude!,
        title: e.name,
        color: EQUIPMENT_COLORS[e.type] || Colors.primary,
      }));
  };

  const handleMarkerPress = (markerId: string) => {
    const eq = equipmentList.find((e) => e.id === markerId);
    if (eq) setSelectedEquipment(eq);
  };

  const handleCacheTiles = async () => {
    const online = await isOnline();
    if (!online) {
      Alert.alert('Hors ligne', 'Connectez-vous à Internet pour télécharger les tuiles de carte.');
      return;
    }

    const center = getCenter();
    setCaching(true);
    setCacheProgress('Téléchargement...');

    try {
      await cacheAreaForZooms(center.latitude, center.longitude, 14, 18, 4, (zoom, dl, total) => {
        setCacheProgress(`Zoom ${zoom}: ${dl}/${total}`);
      });
      Alert.alert('Succès', 'La carte du site a été téléchargée pour une utilisation hors ligne.');
    } catch {
      Alert.alert('Erreur', 'Erreur lors du téléchargement.');
    } finally {
      setCaching(false);
      setTimeout(() => setCacheProgress(''), 2000);
    }
  };

  const locatedCount = equipmentList.filter((e) => e.latitude != null && e.longitude != null).length;

  if (!site) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Carte — {site.name}</Text>
        <TouchableOpacity
          style={styles.listToggle}
          onPress={() => setShowList(!showList)}
        >
          <MaterialIcons
            name={showList ? 'map' : 'list'}
            size={22}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cacheBtn} onPress={handleCacheTiles} disabled={caching}>
          <MaterialIcons
            name={caching ? 'hourglass-empty' : 'cloud-download'}
            size={22}
            color={Colors.secondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.mapArea}>
        <LeafletMap
          center={getCenter()}
          zoom={site.latitude ? 17 : 15}
          markers={getMapMarkers()}
          onMapReady={() => setMapReady(true)}
          onMarkerPress={handleMarkerPress}
          style={styles.map}
        />

        {caching && (
          <View style={styles.cacheOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.cacheText}>{cacheProgress}</Text>
          </View>
        )}

        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <MaterialIcons name="devices-other" size={14} color={Colors.primary} />
            <Text style={styles.statText}>{equipmentList.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <MaterialIcons name="place" size={14} color={Colors.secondary} />
            <Text style={styles.statText}>{locatedCount} géolocalisés</Text>
          </View>
        </View>
      </View>

      {selectedEquipment && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <View style={[styles.selectedIcon, { backgroundColor: EQUIPMENT_COLORS[selectedEquipment.type] + '30' }]}>
              <MaterialIcons
                name={(EQUIPMENT_ICONS[selectedEquipment.type] || 'devices-other') as any}
                size={20}
                color={EQUIPMENT_COLORS[selectedEquipment.type]}
              />
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName} numberOfLines={1}>{selectedEquipment.name}</Text>
              <Text style={styles.selectedType}>
                {EQUIPMENT_TYPE_LABELS[selectedEquipment.type]}
                {selectedEquipment.hostname ? ` · ${selectedEquipment.hostname}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.selectedClose}
              onPress={() => setSelectedEquipment(null)}
            >
              <MaterialIcons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.selectedAction}
              onPress={() => {
                setSelectedEquipment(null);
                router.push(`/equipment/${selectedEquipment.id}`);
              }}
            >
              <MaterialIcons name="visibility" size={16} color={Colors.primary} />
              <Text style={styles.selectedActionText}>Détails</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectedAction}
              onPress={() => {
                setSelectedEquipment(null);
                router.push(`/equipment/location?id=${selectedEquipment.id}`);
              }}
            >
              <MaterialIcons name="edit-location" size={16} color={Colors.secondary} />
              <Text style={styles.selectedActionText}>Position</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showList && (
        <View style={styles.listPanel}>
          <FlatList
            data={equipmentList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setShowList(false);
                  if (item.latitude != null && item.longitude != null) {
                    setSelectedEquipment(item);
                  } else {
                    router.push(`/equipment/${item.id}`);
                  }
                }}
              >
                <View style={[styles.listDot, { backgroundColor: EQUIPMENT_COLORS[item.type] || Colors.primary }]} />
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.listItemDetail}>
                    {EQUIPMENT_TYPE_LABELS[item.type]}
                    {item.latitude != null ? ' · Géolocalisé' : ' · Sans position'}
                  </Text>
                </View>
                {item.latitude != null && (
                  <MaterialIcons name="place" size={16} color={Colors.success} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>Aucun équipement</Text>
              </View>
            }
          />
        </View>
      )}
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
    zIndex: 10,
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
  listToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  cacheBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapArea: {
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
  statsBar: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,46,0.9)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.surfaceBorder,
  },
  selectedCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selectedIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  selectedType: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  selectedClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  selectedAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
  },
  selectedActionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  listPanel: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  listItemDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  emptyList: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyListText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
