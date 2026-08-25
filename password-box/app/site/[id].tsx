import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  Site,
  Equipment,
  Credential,
  SITE_TYPE_LABELS,
  getSiteMode,
} from '../../lib/types';
import {
  getSite,
  getEquipmentBySite,
  getEquipment,
  deleteEquipment,
  deleteSite,
  getCredentialsBySite,
  deleteCredential,
  getEquipmentById,
} from '../../lib/database';
import EquipmentCard from '../../components/EquipmentCard';
import CredentialCard from '../../components/CredentialCard';

export default function SiteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credCounts, setCredCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const isPersonal = site ? getSiteMode(site) === 'personnel' : false;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const s = await getSite(id);
    setSite(s ?? null);

    if (s && getSiteMode(s) === 'personnel') {
      const creds = await getCredentialsBySite(id);
      setCredentials(creds);
      setEquipmentList([]);
      setCredCounts({});
    } else {
      const eq = await getEquipmentBySite(id);
      setEquipmentList(eq);
      const counts: Record<string, number> = {};
      for (const e of eq) {
        const creds = await getEquipmentById(e.id).then(async (eqData) => {
          if (!eqData) return 0;
          const allCreds = await getCredentialsBySite(id);
          return allCreds.filter((c) => c.equipmentId === e.id).length;
        });
        counts[e.id] = creds;
      }
      setCredCounts(counts);
      setCredentials([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteEquipment = (eq: Equipment) => {
    Alert.alert(
      "Supprimer l'equipement",
      `Supprimer "${eq.name}" et ses identifiants ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteEquipment(eq.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleDeleteCredential = (cred: Credential) => {
    Alert.alert(
      "Supprimer l'identifiant",
      `Supprimer "${cred.label}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCredential(cred.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleDeleteSite = () => {
    const msg = isPersonal
      ? `Supprimer "${site?.name}" et tous ses identifiants ?`
      : `Supprimer "${site?.name}" et tout son contenu ?`;
    Alert.alert('Supprimer', msg, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteSite(id!);
          router.back();
        },
      },
    ]);
  };

  const openMap = () => {
    if (site?.latitude && site?.longitude) {
      const url = `https://www.google.com/maps?q=${site.latitude},${site.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleFabPress = () => {
    if (isPersonal) {
      const personalEquipment = equipmentList[0];
      if (personalEquipment) {
        router.push(`/credential/new?equipmentId=${personalEquipment.id}`);
      }
    } else {
      router.push(`/equipment/new?siteId=${id}`);
    }
  };

  if (!site) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{site.name}</Text>
        {!isPersonal && (
          <TouchableOpacity onPress={() => router.push(`/site/map?id=${id}`)} style={styles.mapBtn}>
            <MaterialIcons name="map" size={22} color={Colors.secondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push(`/site/edit?id=${id}`)} style={styles.editBtn}>
          <MaterialIcons name="edit" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteSite} style={styles.deleteBtn}>
          <MaterialIcons name="delete" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {!isPersonal && (
        <View style={styles.siteInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="category" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{SITE_TYPE_LABELS[site.type]}</Text>
          </View>
          {site.address ? (
            <TouchableOpacity style={styles.infoRow} onPress={openMap}>
              <MaterialIcons name="place" size={18} color={Colors.secondary} />
              <Text style={styles.infoText} numberOfLines={2}>{site.address}</Text>
              {site.latitude && <MaterialIcons name="open-in-new" size={14} color={Colors.textMuted} />}
            </TouchableOpacity>
          ) : null}
          {site.notes ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="notes" size={18} color={Colors.textMuted} />
              <Text style={styles.infoText} numberOfLines={3}>{site.notes}</Text>
            </View>
          ) : null}
        </View>
      )}

      {isPersonal && site.notes ? (
        <View style={styles.siteInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="notes" size={18} color={Colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={3}>{site.notes}</Text>
          </View>
        </View>
      ) : null}

      {isPersonal ? (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Identifiants ({credentials.length})
          </Text>
        </View>
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Equipements ({equipmentList.length})
          </Text>
        </View>
      )}

      {isPersonal ? (
        <FlatList
          data={credentials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CredentialCard
              credential={item}
              onPress={() => router.push(`/credential/${item.id}`)}
              onLongPress={() => handleDeleteCredential(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="vpn-key" size={48} color={Colors.surfaceBorder} />
              <Text style={styles.emptyTitle}>Aucun identifiant</Text>
              <Text style={styles.emptySubtitle}>Ajoutez des identifiants pour ce service</Text>
            </View>
          }
          contentContainerStyle={
            credentials.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={equipmentList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EquipmentCard
              equipment={item}
              credentialCount={credCounts[item.id] || 0}
              onPress={() => router.push(`/equipment/${item.id}`)}
              onLongPress={() => handleDeleteEquipment(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="devices-other" size={48} color={Colors.surfaceBorder} />
              <Text style={styles.emptyTitle}>Aucun equipement</Text>
              <Text style={styles.emptySubtitle}>Appuyez sur + pour ajouter</Text>
            </View>
          }
          contentContainerStyle={
            equipmentList.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
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
    paddingBottom: Spacing.lg,
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
    fontSize: FontSize.lg,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteInfo: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
