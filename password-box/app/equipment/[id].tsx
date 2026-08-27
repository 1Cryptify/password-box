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
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  Equipment,
  Credential,
  getEquipmentTypeLabel,
  getOSLabel,
} from '../../lib/types';
import {
  getEquipmentById,
  getCredentialsByEquipment,
  deleteCredential,
} from '../../lib/database';
import CredentialCard from '../../components/CredentialCard';
import { useI18n } from '../../i18n';

export default function EquipmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tt } = useI18n();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const eq = await getEquipmentById(id);
    setEquipment(eq ?? null);
    const creds = await getCredentialsByEquipment(id);
    setCredentials(creds);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteCredential = (cred: Credential) => {
    Alert.alert(
      t('site.detail.deleteCredentialTitle'),
      t('site.detail.deleteCredential', { name: cred.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteCredential(cred.id);
            loadData();
          },
        },
      ]
    );
  };

  if (!equipment) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{equipment.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.eqInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="category" size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>{tt(getEquipmentTypeLabel(equipment))}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="computer" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText}>{tt(getOSLabel(equipment))}</Text>
        </View>
        {equipment.brand ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="business" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>{equipment.brand}</Text>
          </View>
        ) : null}
        {equipment.hostname ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="dns" size={16} color={Colors.textMuted} />
            <Text style={styles.infoTextmonospace}>{equipment.hostname}</Text>
          </View>
        ) : null}
        {equipment.ipAddress ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="language" size={16} color={Colors.textMuted} />
            <Text style={styles.infoTextmonospace}>{equipment.ipAddress}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => router.push(`/equipment/location?id=${id}`)}
        >
          <MaterialIcons
            name={equipment.latitude != null ? 'place' : 'add-location'}
            size={16}
            color={equipment.latitude != null ? Colors.success : Colors.textMuted}
          />
          <Text style={[
            styles.infoText,
            equipment.latitude != null ? { color: Colors.success } : { color: Colors.textMuted }
          ]}>
            {equipment.latitude != null
              ? `${equipment.latitude!.toFixed(6)}, ${equipment.longitude!.toFixed(6)}`
              : t('equipment.geolocateThis')}
          </Text>
          <MaterialIcons name="chevron-right" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t('site.detail.identifiers', { count: credentials.length })}
        </Text>
      </View>

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
            <Text style={styles.emptyTitle}>{t('site.detail.noCredential')}</Text>
            <Text style={styles.emptySubtitle}>{t('site.detail.noCredentialSub')}</Text>
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/credential/new?equipmentId=${id}`)}
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
  eqInfo: {
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
  infoTextmonospace: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
    fontFamily: 'monospace',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
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
