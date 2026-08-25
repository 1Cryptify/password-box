import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { Credential, AUTH_TYPE_LABELS } from '../../lib/types';
import { getCredential, deleteCredential } from '../../lib/database';

export default function CredentialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!id) return;
    const cred = await getCredential(id);
    setCredential(cred ?? null);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copie', label + ' copie dans le presse-papier.');
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'identifiant",
      "Supprimer cet identifiant ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (id) await deleteCredential(id);
            router.back();
          },
        },
      ]
    );
  };

  if (!credential) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{credential.label}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <MaterialIcons name="delete" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.authBadge}>
          <Text style={styles.authBadgeText}>{AUTH_TYPE_LABELS[credential.authType]}</Text>
        </View>

        {credential.username ? (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => copyToClipboard(credential.username, 'Utilisateur')}
          >
            <View style={styles.fieldHeader}>
              <MaterialIcons name="person" size={20} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Utilisateur</Text>
              <MaterialIcons name="content-copy" size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.fieldValue}>{credential.username}</Text>
          </TouchableOpacity>
        ) : null}

        {credential.password ? (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => copyToClipboard(credential.password, 'Mot de passe')}
          >
            <View style={styles.fieldHeader}>
              <MaterialIcons name="lock" size={20} color={Colors.primary} />
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
              <MaterialIcons name="content-copy" size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.fieldValueMono}>
              {showPassword ? credential.password : '\u2022'.repeat(Math.min(credential.password.length, 20))}
            </Text>
          </TouchableOpacity>
        ) : null}

        {credential.port ? (
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <MaterialIcons name="settings-ethernet" size={20} color={Colors.secondary} />
              <Text style={styles.fieldLabel}>Port</Text>
            </View>
            <Text style={styles.fieldValueMono}>{credential.port}</Text>
          </View>
        ) : null}

        {credential.extraInfo ? (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => copyToClipboard(credential.extraInfo, 'Info')}
          >
            <View style={styles.fieldHeader}>
              <MaterialIcons name="info" size={20} color={Colors.warning} />
              <Text style={styles.fieldLabel}>Informations supplementaires</Text>
              <MaterialIcons name="content-copy" size={16} color={Colors.textMuted} />
            </View>
            <Text style={styles.fieldValue}>{credential.extraInfo}</Text>
          </TouchableOpacity>
        ) : null}

        {credential.notes ? (
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <MaterialIcons name="notes" size={20} color={Colors.textMuted} />
              <Text style={styles.fieldLabel}>Notes</Text>
            </View>
            <Text style={styles.fieldValue}>{credential.notes}</Text>
          </View>
        ) : null}

        <View style={styles.metaCard}>
          <Text style={styles.metaText}>Cree: {new Date(credential.createdAt).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.metaText}>Modifie: {new Date(credential.updatedAt).toLocaleDateString('fr-FR')}</Text>
        </View>
      </ScrollView>
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  authBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  authBadgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  fieldCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
  fieldValue: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  fieldValueMono: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: 'monospace',
  },
  metaCard: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
});
