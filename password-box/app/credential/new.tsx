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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { AuthType, AUTH_TYPE_LABELS } from '../../lib/types';
import { saveCredential } from '../../lib/database';
import { generateId } from '../../lib/encryption';

export default function NewCredentialScreen() {
  const router = useRouter();
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const [label, setLabel] = useState('');
  const [authType, setAuthType] = useState<AuthType>('mot_de_passe');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const authTypes = Object.keys(AUTH_TYPE_LABELS) as AuthType[];

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Erreur', 'Le label est obligatoire.');
      return;
    }
    if (!equipmentId) return;
    const now = new Date().toISOString();
    await saveCredential({
      id: generateId(),
      equipmentId,
      label: label.trim(),
      authType,
      username: username.trim(),
      password: password.trim(),
      port: port.trim(),
      extraInfo: extraInfo.trim(),
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
        <Text style={styles.headerTitle}>Nouvel identifiant</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Libelle *</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="Ex: Compte admin, Acces SSH..."
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Type d'authentification</Text>
        <View style={styles.chipGrid}>
          {authTypes.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, authType === a && styles.chipActive]}
              onPress={() => setAuthType(a)}
            >
              <Text style={[styles.chipText, authType === a && styles.chipTextActive]}>
                {AUTH_TYPE_LABELS[a]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nom d'utilisateur</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="admin"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Mot de passe / Cle</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={22}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          placeholder="Ex: 22, 80, 443"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Informations supplementaires</Text>
        <TextInput
          style={styles.input}
          value={extraInfo}
          onChangeText={setExtraInfo}
          placeholder="URL, OID, cle publique..."
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes diverses..."
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eyeBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  chipTextActive: {
    color: Colors.white,
  },
});
