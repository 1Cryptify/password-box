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
import { useI18n } from '../../i18n';

export default function NewEquipmentScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t, tt } = useI18n();
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
      Alert.alert(t('equipment.error'), t('site.nameRequired'));
      return;
    }
    if (type === 'autre' && !customType.trim()) {
      Alert.alert(t('equipment.error'), t('site.customTypeRequired'));
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
      t('equipment.savedTitle'),
      t('equipment.savedMsg'),
      [
        { text: t('common.later'), style: 'cancel', onPress: () => router.back() },
        {
          text: t('equipment.geolocate'),
          onPress: () => router.replace(`/equipment/location?id=${newId}`),
        },
      ]
    );
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
        <Text style={styles.headerTitle}>{t('equipment.newTitle')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('equipment.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('equipment.namePlaceholder')}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>{t('equipment.type')}</Text>
        <View style={styles.chipGrid}>
          {equipmentTypes.map((eqType) => (
            <TouchableOpacity
              key={eqType}
              style={[styles.chip, type === eqType && styles.chipActive]}
              onPress={() => handleTypeChange(eqType)}
            >
              <Text style={[styles.chipText, type === eqType && styles.chipTextActive]}>
                {t(EQUIPMENT_TYPE_LABELS[eqType])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'autre' && (
          <View style={styles.customField}>
            <Text style={styles.label}>{t('equipment.customType')}</Text>
            <TextInput
              style={styles.input}
              value={customType}
              onChangeText={setCustomType}
              placeholder={t('equipment.customTypePlaceholder')}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        {type !== 'autre' && BRANDS_BY_TYPE[type] && BRANDS_BY_TYPE[type].length > 0 && (
          <View style={styles.customField}>
            <Text style={styles.label}>{t('equipment.brand')}</Text>
            <TextInput
              style={styles.input}
              value={brandQuery}
              onChangeText={(text) => {
                setBrandQuery(text);
                setBrand('');
                setShowBrandSuggestions(true);
              }}
              onFocus={() => setShowBrandSuggestions(true)}
              placeholder={t('equipment.brandPlaceholder')}
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
            <Text style={styles.label}>{t('equipment.os')}</Text>
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
                    {t(OS_LABELS[o])}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {os === 'autre' && (
              <TextInput
                style={[styles.input, styles.customOsInput]}
                value={customOS}
                onChangeText={setCustomOS}
                placeholder={t('equipment.customOS')}
                placeholderTextColor={Colors.textMuted}
              />
            )}
          </View>
        )}

        <Text style={styles.label}>{t('equipment.hostname')}</Text>
        <TextInput
          style={styles.input}
          value={hostname}
          onChangeText={setHostname}
          placeholder={t('equipment.hostnamePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>{t('equipment.ip')}</Text>
        <TextInput
          style={styles.input}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder={t('equipment.ipPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>{t('common.notes')}</Text>
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
