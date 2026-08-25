import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  EquipmentType,
  OSType,
  EQUIPMENT_TYPE_LABELS,
  OS_LABELS,
  COMPATIBLE_OS_MAP,
  BRANDS_BY_TYPE,
} from '../../lib/types';
import { saveEquipment } from '../../lib/database';
import { generateId } from '../../lib/encryption';

export default function NewEquipmentScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const [name, setName] = useState('');
  const [type, setType] = useState<EquipmentType>('pc');
  const [customType, setCustomType] = useState('');
  const [brand, setBrand] = useState('');
  const [brandQuery, setBrandQuery] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [os, setOs] = useState<OSType>('windows_10');
  const [customOS, setCustomOS] = useState('');
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [notes, setNotes] = useState('');

  const equipmentTypes = Object.keys(EQUIPMENT_TYPE_LABELS) as EquipmentType[];

  const compatibleOS = useMemo(() => COMPATIBLE_OS_MAP[type] ?? [], [type]);

  const brandSuggestions = useMemo(() => {
    if (!type) return [];
    const brands = BRANDS_BY_TYPE[type] ?? [];
    if (!brandQuery.trim()) return brands;
    const q = brandQuery.toLowerCase();
    return brands.filter((b) => b.toLowerCase().includes(q));
  }, [type, brandQuery]);

  const handleTypeChange = (newType: EquipmentType) => {
    setType(newType);
    setCustomType('');
    const firstOS = COMPATIBLE_OS_MAP[newType]?.[0] ?? 'autre';
    setOs(firstOS);
    setCustomOS('');
    setBrand('');
    setBrandQuery('');
    setShowBrandSuggestions(false);
  };

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setBrandQuery(selectedBrand);
    setShowBrandSuggestions(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }
    if (type === 'autre' && !customType.trim()) {
      Alert.alert('Erreur', 'Veuillez préciser le type d\'équipement.');
      return;
    }
    if (!siteId) return;
    const now = new Date().toISOString();
    const newId = generateId();
    await saveEquipment({
      id: newId,
      siteId,
      name: name.trim(),
      type,
      customType: type === 'autre' ? customType.trim() : undefined,
      os,
      customOS: os === 'autre' ? customOS.trim() : undefined,
      brand: brand.trim() || undefined,
      hostname: hostname.trim(),
      ipAddress: ipAddress.trim(),
      latitude: null,
      longitude: null,
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    });
    Alert.alert(
      'Équipement enregistré',
      'Voulez-vous géolocaliser cet équipement maintenant ?',
      [
        { text: 'Plus tard', style: 'cancel', onPress: () => router.back() },
        {
          text: 'Géolocaliser',
          onPress: () => router.replace(`/equipment/location?id=${newId}`),
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Nouvel équipement</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Nom de l'équipement *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Routeur principal"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Type d'équipement *</Text>
        <View style={styles.chipGrid}>
          {equipmentTypes.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => handleTypeChange(t)}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                {EQUIPMENT_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'autre' && (
          <View style={styles.customField}>
            <Text style={styles.label}>Précisez le type *</Text>
            <TextInput
              style={styles.input}
              value={customType}
              onChangeText={setCustomType}
              placeholder="Ex: Contrôleur HVAC"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        {type !== 'autre' && BRANDS_BY_TYPE[type] && BRANDS_BY_TYPE[type].length > 0 && (
          <View style={styles.customField}>
            <Text style={styles.label}>Marque</Text>
            <TextInput
              style={styles.input}
              value={brandQuery}
              onChangeText={(text) => {
                setBrandQuery(text);
                setBrand('');
                setShowBrandSuggestions(true);
              }}
              onFocus={() => setShowBrandSuggestions(true)}
              placeholder="Rechercher une marque..."
              placeholderTextColor={Colors.textMuted}
            />
            {showBrandSuggestions && brandSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView
                  style={styles.suggestionsScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {brandSuggestions.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.suggestionItem,
                        brand === b && styles.suggestionItemActive,
                      ]}
                      onPress={() => handleBrandSelect(b)}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          brand === b && styles.suggestionTextActive,
                        ]}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {type !== 'autre' && (
          <View style={styles.customField}>
            <Text style={styles.label}>Système d'exploitation</Text>
            <View style={styles.chipGrid}>
              {compatibleOS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.chip, os === o && styles.chipActive]}
                  onPress={() => {
                    setOs(o);
                    setCustomOS('');
                  }}
                >
                  <Text style={[styles.chipText, os === o && styles.chipTextActive]}>
                    {OS_LABELS[o]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {os === 'autre' && (
              <TextInput
                style={[styles.input, styles.customOsInput]}
                value={customOS}
                onChangeText={setCustomOS}
                placeholder="Précisez le système d'exploitation"
                placeholderTextColor={Colors.textMuted}
              />
            )}
          </View>
        )}

        <Text style={styles.label}>Nom d'hôte</Text>
        <TextInput
          style={styles.input}
          value={hostname}
          onChangeText={setHostname}
          placeholder="Ex: SRV-PRD-01"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Adresse IP</Text>
        <TextInput
          style={styles.input}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder="Ex: 192.168.1.1"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />

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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  chipTextActive: {
    color: Colors.white,
  },
  customField: {
    marginTop: Spacing.md,
  },
  customOsInput: {
    marginTop: Spacing.md,
  },
  suggestionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.sm,
    maxHeight: 160,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    maxHeight: 160,
  },
  suggestionItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  suggestionItemActive: {
    backgroundColor: Colors.secondary + '20',
  },
  suggestionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  suggestionTextActive: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});
