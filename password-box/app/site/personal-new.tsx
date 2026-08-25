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
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  PERSONAL_SERVICE_CATEGORIES,
  ALL_PERSONAL_SERVICES,
} from '../../lib/types';
import { createPersonalSite } from '../../lib/database';
import { generateId } from '../../lib/encryption';

export default function NewPersonalSiteScreen() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return PERSONAL_SERVICE_CATEGORIES;
    const q = search.toLowerCase();
    return PERSONAL_SERVICE_CATEGORIES
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((s) => s.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [search]);

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsCustom(false);
    setCustomName('');
  };

  const handleCustomPress = () => {
    setIsCustom(true);
    setSelectedService(null);
  };

  const handleSave = async () => {
    const serviceName = isCustom ? customName.trim() : selectedService;
    if (!serviceName) {
      Alert.alert('Erreur', 'Selectionnez un service ou saisissez un nom.');
      return;
    }
    const now = new Date().toISOString();
    const siteId = generateId();
    await createPersonalSite({
      id: siteId,
      name: serviceName,
      type: 'autre',
      mode: 'personnel',
      address: '',
      latitude: null,
      longitude: null,
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
        <Text style={styles.headerTitle}>Nouveau service</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un service..."
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SectionList
        sections={filteredCategories.map((cat) => ({
          title: cat.label,
          icon: cat.icon,
          data: cat.services,
        }))}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.serviceItem, isCustom && styles.serviceItemActive]}
            onPress={handleCustomPress}
          >
            <View style={[styles.serviceIcon, isCustom && styles.serviceIconActive]}>
              <MaterialIcons
                name="edit"
                size={22}
                color={isCustom ? Colors.white : Colors.primary}
              />
            </View>
            <Text style={[styles.serviceName, isCustom && styles.serviceNameActive]}>
              Autre service...
            </Text>
          </TouchableOpacity>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialIcons name={section.icon as any} size={16} color={Colors.textMuted} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.serviceItem,
              selectedService === item.name && styles.serviceItemActive,
            ]}
            onPress={() => handleServiceSelect(item.name)}
          >
            <View
              style={[
                styles.serviceIcon,
                selectedService === item.name && styles.serviceIconActive,
              ]}
            >
              <MaterialIcons
                name={item.icon as any}
                size={22}
                color={selectedService === item.name ? Colors.white : Colors.primary}
              />
            </View>
            <Text
              style={[
                styles.serviceName,
                selectedService === item.name && styles.serviceNameActive,
              ]}
            >
              {item.name}
            </Text>
            {selectedService === item.name && (
              <MaterialIcons name="check-circle" size={20} color={Colors.secondary} />
            )}
          </TouchableOpacity>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          isCustom ? (
            <View style={styles.customSection}>
              <Text style={styles.label}>Nom du service *</Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={setCustomName}
                placeholder="Ex: Mon site perso"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>
          ) : null
        }
      />

      <View style={styles.notesSection}>
        <Text style={styles.label}>Notes (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Informations supplementaires..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  serviceItemActive: {
    backgroundColor: Colors.secondary + '10',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconActive: {
    backgroundColor: Colors.secondary,
  },
  serviceName: {
    color: Colors.text,
    fontSize: FontSize.md,
    flex: 1,
  },
  serviceNameActive: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  customSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
    height: 60,
  },
  notesSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
});
