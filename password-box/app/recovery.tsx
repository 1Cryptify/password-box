import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { verifyRecoveryKey } from '../lib/recovery';
import { setPinHash, clearLockout, setAttempts } from '../lib/database';
import PinInput from '../components/PinInput';
import { useI18n } from '../i18n';

export default function RecoveryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<'verify' | 'new' | 'confirm'>('verify');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyKey = async () => {
    if (!recoveryKey.trim()) {
      setError(t('recovery.enterCode'));
      return;
    }
    setLoading(true);
    const valid = await verifyRecoveryKey(recoveryKey);
    setLoading(false);
    if (valid) {
      setStep('new');
      setError('');
    } else {
      setError(t('recovery.invalidCode'));
    }
  };

  const handleNewPin = (pin: string) => {
    setNewPin(pin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== newPin) {
      setError(t('auth.pinMismatch'));
      setStep('new');
      setNewPin('');
      return;
    }
    setLoading(true);
    try {
      const { hashPin } = await import('../lib/encryption');
      const hash = await hashPin(pin);
      await setPinHash(hash);
      await clearLockout();
      await setAttempts(0);
      setLoading(false);
      Alert.alert(
        t('recovery.pinReset'),
        t('recovery.pinResetMsg'),
        [{ text: t('common.ok'), onPress: () => router.replace('/') }]
      );
    } catch {
      setLoading(false);
      Alert.alert(t('common.error'), t('recovery.errorReset'));
    }
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
        <Text style={styles.headerTitle}>{t('recovery.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'verify' ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="vpn-key" size={64} color={Colors.warning} />
          </View>
          <Text style={styles.title}>{t('recovery.codeTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('recovery.subtitle')}
          </Text>

          <TextInput
            style={styles.input}
            value={recoveryKey}
            onChangeText={(t) => {
              setRecoveryKey(t.toUpperCase());
              setError('');
            }}
            placeholder={t('recovery.placeholder')}
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
              {loading ? t('recovery.verifying') : t('recovery.verify')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <View style={styles.top}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={64} color={Colors.success} />
            </View>
            <Text style={styles.title}>{t('recovery.newPinTitle')}</Text>
            <Text style={styles.subtitle}>
              {step === 'new'
                ? t('recovery.codeVerified')
                : t('recovery.confirmNewPin')}
            </Text>
          </View>

          {step === 'new' ? (
            <PinInput key="new" length={6} onComplete={handleNewPin} disabled={loading} />
          ) : (
            <PinInput key="confirm" length={6} onComplete={handleConfirmPin} error={error} disabled={loading} />
          )}

          {step === 'confirm' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => {
                  setStep('new');
                  setNewPin('');
                  setError('');
                }}
              >
                <Text style={styles.backLinkText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
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
  contentScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  backLink: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: FontSize.md,
  },
  footer: {
    paddingVertical: Spacing.lg,
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
