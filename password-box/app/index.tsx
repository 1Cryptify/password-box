import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { Site, SiteMode, getSiteMode } from '../lib/types';
import {
  getSites,
  deleteSite,
  getEquipmentCountForSite,
  getCredentialCountForSite,
  isFirstLaunch,
  getPinHash,
  isAuthenticated,
} from '../lib/database';
import SiteCard from '../components/SiteCard';
import SearchBar from '../components/SearchBar';

export default function HomeScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteCounts, setSiteCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [activeMode, setActiveMode] = useState<SiteMode>('infrastructure');

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    const first = await isFirstLaunch();
    if (first) {
      router.replace('/setup');
      return;
    }
    const pinHash = await getPinHash();
    if (pinHash) {
      const authed = await isAuthenticated();
      if (!authed) {
        router.replace('/pin');
        return;
      }
    }
    setIsReady(true);
    loadData();
  };

  const loadData = async () => {
    const allSites = await getSites();
    setSites(allSites);
    const counts: Record<string, number> = {};
    for (const site of allSites) {
      const mode = getSiteMode(site);
      counts[site.id] = mode === 'personnel'
        ? await getCredentialCountForSite(site.id)
        : await getEquipmentCountForSite(site.id);
    }
    setSiteCounts(counts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredSites = useMemo(() => {
    return sites
      .filter((s) => getSiteMode(s) === activeMode)
      .filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.address.toLowerCase().includes(search.toLowerCase())
      );
  }, [sites, activeMode, search]);

  const handleDelete = (site: Site) => {
    const mode = getSiteMode(site);
    const msg = mode === 'personnel'
      ? `Supprimer "${site.name}" et tous ses identifiants ?`
      : `Supprimer "${site.name}" et tout son équipement ?`;
    Alert.alert('Supprimer', msg, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteSite(site.id);
          loadData();
        },
      },
    ]);
  };

  const handleFabPress = () => {
    if (activeMode === 'personnel') {
      router.push('/site/personal-new');
    } else {
      router.push('/site/new');
    }
  };

  const countLabel = activeMode === 'personnel'
    ? `${filteredSites.length} service${filteredSites.length !== 1 ? 's' : ''}`
    : `${filteredSites.length} site${filteredSites.length !== 1 ? 's' : ''}`;

  if (!isReady) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PasswordBox</Text>
          <Text style={styles.subtitle}>{countLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <MaterialIcons name="settings" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeMode === 'infrastructure' && styles.segmentActive]}
          onPress={() => { setActiveMode('infrastructure'); setSearch(''); }}
        >
          <MaterialIcons
            name="business"
            size={18}
            color={activeMode === 'infrastructure' ? Colors.white : Colors.textSecondary}
          />
          <Text style={[styles.segmentText, activeMode === 'infrastructure' && styles.segmentTextActive]}>
            Infrastructure
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeMode === 'personnel' && styles.segmentActive]}
          onPress={() => { setActiveMode('personnel'); setSearch(''); }}
        >
          <MaterialIcons
            name="person"
            size={18}
            color={activeMode === 'personnel' ? Colors.white : Colors.textSecondary}
          />
          <Text style={[styles.segmentText, activeMode === 'personnel' && styles.segmentTextActive]}>
            Personnel
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={activeMode === 'personnel' ? 'Rechercher un service...' : 'Rechercher un site...'}
      />

      <FlatList
        data={filteredSites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SiteCard
            site={item}
            count={siteCounts[item.id] || 0}
            onPress={() => router.push(`/site/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons
              name={activeMode === 'personnel' ? 'person-add' : 'business'}
              size={64}
              color={Colors.surfaceBorder}
            />
            <Text style={styles.emptyTitle}>
              {activeMode === 'personnel' ? 'Aucun service' : 'Aucun site'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeMode === 'personnel'
                ? 'Appuyez sur + pour ajouter un service'
                : 'Appuyez sur + pour ajouter un site'}
            </Text>
          </View>
        }
        contentContainerStyle={
          filteredSites.length === 0 ? styles.emptyContainer : styles.list
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.white,
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
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
