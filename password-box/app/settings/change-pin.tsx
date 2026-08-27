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
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { setPinHash, getPinHash } from '../../lib/database';
import { hashPin } from '../../lib/encryption';
import PinInput from '../../components/PinInput';

export default function ChangePinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'new' | 'confirm'>('verify');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [pinKey, setPinKey] = useState(0);

  const handleVerifyOld = async (pin: string) => {
    const storedHash = await getPinHash();
    const inputHash = await hashPin(pin);
    if (storedHash === inputHash) {
      setError('');
      setStep('new');
    } else {
      setPinKey((k) => k + 1);
      setError('PIN actuel incorrect');
    }
  };

  const handleNewPin = (pin: string) => {
    setNewPin(pin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin === newPin) {
      const hash = await hashPin(pin);
      await setPinHash(hash);
      Alert.alert('Succes', 'PIN change avec succes.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      setError('Les PIN ne correspondent pas');
      setStep('new');
      setNewPin('');
      setPinKey((k) => k + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changer le PIN</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="lock" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.subtitle}>
            {step === 'verify'
              ? 'Saisissez votre PIN actuel'
              : step === 'new'
              ? 'Saisissez votre nouveau PIN (6 chiffres)'
              : 'Confirmez votre nouveau PIN'}
          </Text>
        </View>

        {step === 'verify' ? (
          <PinInput key={`verify-${pinKey}`} length={6} onComplete={handleVerifyOld} error={error} />
        ) : step === 'new' ? (
          <PinInput key="new" length={6} onComplete={handleNewPin} />
        ) : (
          <PinInput key="confirm" length={6} onComplete={handleConfirmPin} error={error} />
        )}

        {step === 'confirm' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                setStep('new');
                setNewPin('');
                setError('');
                setPinKey((k) => k + 1);
              }}
            >
              <Text style={styles.backLinkText}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: Spacing.xxxl,
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
    borderColor: Colors.primary,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
});
