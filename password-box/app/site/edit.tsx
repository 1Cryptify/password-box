import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { SiteType, SITE_TYPE_LABELS } from '../../lib/types';
import { saveSite, getSite } from '../../lib/database';
import { getPosition } from '../../lib/location';
import { useI18n } from '../../i18n';

export default function EditSiteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tt } = useI18n();
  const [name, setName] = useState('');
  const [type, setType] = useState<SiteType>('entreprise');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [createdAt, setCreatedAt] = useState('');

  const siteTypes = Object.keys(SITE_TYPE_LABELS) as SiteType[];

  useEffect(() => {
    loadSite();
  }, [id]);

  const loadSite = async () => {
    if (!id) return;
    const site = await getSite(id);
    if (site) {
      setName(site.name);
      setType(site.type);
      setAddress(site.address);
      setNotes(site.notes);
      setLatitude(site.latitude);
      setLongitude(site.longitude);
      setCreatedAt(site.createdAt);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          t('site.locDisabledTitle'),
          t('site.locDisabledMsg'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.settings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('site.locPermissions'),
          t('site.locPermissionsMsg'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.settings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const loc = await getPosition();
      if (!loc) {
        Alert.alert(
          t('common.error'),
          t('site.locError')
        );
        return;
      }

      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverse.length > 0) {
          const r = reverse[0];
          const parts = [r.name, r.street, r.city, r.region, r.country].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {
        Alert.alert(t('common.error'), t('site.locAddrError'));
      }
    } catch {
      Alert.alert(t('common.error'), t('site.locGetError'));
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('site.nameRequired'));
      return;
    }
    await saveSite({
      id: id!,
      name: name.trim(),
      type,
      address: address.trim(),
      latitude,
      longitude,
      notes: notes.trim(),
      createdAt: createdAt,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('site.editTitle')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('site.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('site.namePlaceholder')}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>{t('site.typeLabel')}</Text>
        <View style={styles.typeGrid}>
          {siteTypes.map((siteType) => (
            <TouchableOpacity
              key={siteType}
              style={[styles.typeChip, type === siteType && styles.typeChipActive]}
              onPress={() => setType(siteType)}
            >
              <Text style={[styles.typeChipText, type === siteType && styles.typeChipTextActive]}>
                {t(SITE_TYPE_LABELS[siteType])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('site.address')}</Text>
        <View style={styles.addressRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={address}
            onChangeText={setAddress}
            placeholder={t('site.addressFull')}
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            <MaterialIcons
              name={loadingLocation ? 'hourglass-empty' : 'my-location'}
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {latitude !== null && (
          <View style={styles.coordsBox}>
            <MaterialIcons name="place" size={16} color={Colors.success} />
            <Text style={styles.coordsText}>
              {latitude.toFixed(6)}, {longitude!.toFixed(6)}
            </Text>
          </View>
        )}

        <Text style={styles.label}>{t('site.notes')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('site.extraInfo')}
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  textArea: {
    height: 100,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  coordsText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
  },
});
