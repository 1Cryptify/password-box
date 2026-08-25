import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { verifyRecoveryKey } from '../lib/recovery';
import { setPinHash, clearLockout, setAttempts } from '../lib/database';

export default function RecoveryScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyKey = async () => {
    if (!recoveryKey.trim()) {
      setError('Saisissez votre code de récupération');
      return;
    }
    setLoading(true);
    const valid = await verifyRecoveryKey(recoveryKey);
    setLoading(false);
    if (valid) {
      setStep('reset');
      setError('');
    } else {
      setError('Code de récupération invalide');
    }
  };

  const handleResetPin = async () => {
    if (newPin.length !== 6) {
      setError('Le PIN doit contenir 6 chiffres');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Les PIN ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const { hashPin } = await import('../lib/encryption');
      const hash = await hashPin(newPin);
      await setPinHash(hash);
      await clearLockout();
      await setAttempts(0);
      setLoading(false);
      Alert.alert(
        'PIN réinitialisé',
        'Votre nouveau PIN a été enregistré.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch {
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de réinitialiser le PIN.');
    }
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
        <Text style={styles.headerTitle}>Récupération</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'verify' ? (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="vpn-key" size={64} color={Colors.warning} />
          </View>
          <Text style={styles.title}>Code de récupération</Text>
          <Text style={styles.subtitle}>
            Saisissez votre code de récupération de 16 caractères pour réinitialiser votre PIN.
          </Text>

          <TextInput
            style={styles.input}
            value={recoveryKey}
            onChangeText={(t) => {
              setRecoveryKey(t.toUpperCase());
              setError('');
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
            onPress={handleVerifyKey}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>
              {loading ? 'Vérification...' : 'Vérifier'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="lock-reset" size={64} color={Colors.success} />
          </View>
          <Text style={styles.title}>Nouveau PIN</Text>
          <Text style={styles.subtitle}>
            Code vérifié. Définissez votre nouveau PIN de 6 chiffres.
          </Text>

          <Text style={styles.label}>Nouveau PIN</Text>
          <TextInput
            style={styles.input}
            value={newPin}
            onChangeText={(t) => {
              setNewPin(t.replace(/[^0-9]/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="6 chiffres"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmer le PIN</Text>
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={(t) => {
              setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="6 chiffres"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
            onPress={handleResetPin}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>
              {loading ? 'Enregistrement...' : 'Enregistrer le nouveau PIN'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
    width: '100%',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
    width: '100%',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.md,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
