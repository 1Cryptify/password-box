import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { SiteType, SITE_TYPE_LABELS } from '../../lib/types';
import { saveSite } from '../../lib/database';
import { generateId } from '../../lib/encryption';
import { getPosition } from '../../lib/location';

export default function NewSiteScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<SiteType>('entreprise');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const siteTypes = Object.keys(SITE_TYPE_LABELS) as SiteType[];

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Localisation désactivée',
          'Le GPS est éteint. Activez la localisation dans les paramètres puis réessayez.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Autorisez l\'accès à la localisation pour utiliser le GPS.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const loc = await getPosition();
      if (!loc) {
        Alert.alert(
          'Erreur',
          'Impossible d\'obtenir la position. Approchez-vous d\'une fenêtre ou sortez à l\'extérieur, puis réessayez.'
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
        Alert.alert('Erreur', 'La position a été enregistrée mais l\'adresse n\'a pas pu être déterminée.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'obtenir la position.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }
    const now = new Date().toISOString();
    await saveSite({
      id: generateId(),
      name: name.trim(),
      type,
      address: address.trim(),
      latitude,
      longitude,
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau site</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Nom du site *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Bureau Paris"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Type de site</Text>
        <View style={styles.typeGrid}>
          {siteTypes.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {SITE_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Adresse</Text>
        <View style={styles.addressRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Adresse complète"
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

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Informations supplémentaires..."
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
