import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { importAllData } from '../../lib/database';
import { readPassFile, getDeviceId } from '../../lib/passfile';

export default function ImportScreen() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    Alert.alert(
      'Importer des donnees',
      'Les donnees actuelles seront remplacees. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: pickFile },
      ]
    );
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setImporting(true);
      const fileUri = result.assets[0].uri;

      const { File } = await import('expo-file-system');
      const file = new File(fileUri);
      const content = await file.text();

      const deviceId = await getDeviceId();
      const data = await readPassFile(content, deviceId);

      if (!data) {
        Alert.alert(
          'Acces refuse',
          "Votre appareil n'est pas autorise a importer ce fichier ou le fichier est corrompu."
        );
        setImporting(false);
        return;
      }

      await importAllData({
        sites: data.sites,
        equipment: data.equipment,
        credentials: data.credentials,
      });

      Alert.alert(
        'Succes',
        data.sites.length + ' sites, ' +
          data.equipment.length + ' equipements, ' +
          data.credentials.length + ' identifiants importes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'importer le fichier.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Importer</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="file-download" size={64} color={Colors.warning} />
        </View>
        <Text style={styles.title}>Importer des donnees</Text>
        <Text style={styles.description}>
          Selectionnez un fichier .pass exporte depuis PasswordBox.
          Votre identifiant d'appareil doit etre dans la liste blanche du fichier.
        </Text>

        <TouchableOpacity
          style={styles.importBtn}
          onPress={handleImport}
          disabled={importing}
          activeOpacity={0.8}
        >
          <MaterialIcons name="folder-open" size={24} color={Colors.white} />
          <Text style={styles.importBtnText}>
            {importing ? 'Importation...' : 'Selectionner un fichier'}
          </Text>
        </TouchableOpacity>

        <View style={styles.formatInfo}>
          <MaterialIcons name="info" size={16} color={Colors.textMuted} />
          <Text style={styles.formatText}>
            Format accepte: .pass (PasswordBox chiffré)
          </Text>
        </View>
      </View>
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
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  importBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  formatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  formatText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
