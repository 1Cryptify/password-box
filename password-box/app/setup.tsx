import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { setPinHash, setFirstLaunchDone } from '../lib/database';
import { hashPin } from '../lib/encryption';
import { createRecoveryKey } from '../lib/recovery';
import PinInput from '../components/PinInput';

export default function SetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'confirm' | 'recovery'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin === firstPin) {
      const hash = await hashPin(pin);
      await setPinHash(hash);
      const key = await createRecoveryKey();
      setRecoveryKey(key);
      setStep('recovery');
    } else {
      setError('Les PIN ne correspondent pas');
      setStep('create');
      setFirstPin('');
    }
  };

  const handleRecoveryDone = async () => {
    if (!keySaved) {
      Alert.alert(
        'Sauvegardez votre code',
        'Vous devez copier ou noter votre code de récupération avant de continuer.',
        [{ text: 'OK' }]
      );
      return;
    }
    await setFirstLaunchDone();
    router.replace('/');
  };

  const copyKey = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(recoveryKey);
      Alert.alert('Copié', 'Code de récupération copié dans le presse-papier.');
      setKeySaved(true);
    } catch {
      setKeySaved(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {step === 'recovery' ? (
        <ScrollView contentContainerStyle={styles.recoveryContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="vpn-key" size={72} color={Colors.warning} />
          </View>
          <Text style={styles.title}>Code de récupération</Text>
          <Text style={styles.subtitle}>
            Ce code vous permet de réinitialiser votre PIN si vous l'oubliez.
          </Text>

          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={24} color={Colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Important</Text>
              <Text style={styles.warningText}>
                Votre PIN est le seul moyen d'accéder à vos données.{'\n'}
                Ce code de récupération est votre seul moyen de récupérer votre compte en cas d'oublie du PIN.
              </Text>
              <Text style={[styles.warningText, { marginTop: Spacing.sm, fontWeight: '700' }]}>
                Copiez ou notez ce code et gardez-le en lieu sûr. Sans lui, vos données seront perdues.
              </Text>
            </View>
          </View>

          <View style={styles.keyBox}>
            <Text style={styles.keyText}>{recoveryKey}</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={copyKey}>
            <MaterialIcons name="content-copy" size={20} color={Colors.white} />
            <Text style={styles.copyBtnText}>
              {keySaved ? 'Code copié' : 'Copier le code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.checkRow}>
            <TouchableOpacity
              style={[styles.checkbox, keySaved && styles.checkboxActive]}
              onPress={() => setKeySaved(!keySaved)}
            >
              {keySaved && <MaterialIcons name="check" size={18} color={Colors.white} />}
            </TouchableOpacity>
            <Text style={styles.checkLabel}>J'ai sauvegardé ce code en sécurité</Text>
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !keySaved && styles.continueBtnDisabled]}
            onPress={handleRecoveryDone}
          >
            <Text style={styles.continueBtnText}>Continuer</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.pinContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="shield"
              size={72}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.title}>PasswordBox</Text>
          <Text style={styles.subtitle}>
            {step === 'create'
              ? 'Créez votre PIN de sécurité (6 chiffres)'
              : 'Confirmez votre PIN'}
          </Text>

          {step === 'create' ? (
            <PinInput key="create" length={6} onComplete={handleFirstPin} />
          ) : (
            <PinInput
              key="confirm"
              length={6}
              onComplete={handleConfirmPin}
              error={error}
            />
          )}

          {step === 'confirm' && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setStep('create');
                setFirstPin('');
                setError('');
              }}
            >
              <Text style={styles.backBtnText}>Retour</Text>
            </TouchableOpacity>
          )}
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
  pinContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  recoveryContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingBottom: Spacing.xxxl,
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
    borderColor: Colors.primary,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  warningTitle: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  warningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  keyBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.warning,
    marginBottom: Spacing.xl,
  },
  keyText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  copyBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  backBtnText: {
    color: Colors.primary,
    fontSize: FontSize.md,
  },
});
