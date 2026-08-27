import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../constants/theme';
import {
  getPinHash,
  setAuthenticated,
  getLockoutUntil,
  setLockout,
  clearLockout,
  getAttempts,
  setAttempts,
} from '../lib/database';
import { hashPin } from '../lib/encryption';
import PinInput from '../components/PinInput';
import { useI18n } from '../i18n';

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function PinScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [attempts, setAttemptsState] = useState(0);
  const [pinKey, setPinKey] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkLockout();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const checkLockout = async () => {
    const until = await getLockoutUntil();
    const storedAttempts = await getAttempts();
    setAttemptsState(storedAttempts);

    if (until > Date.now()) {
      setLocked(true);
      startCountdown(until);
    } else if (until > 0) {
      await clearLockout();
      await setAttempts(0);
      setAttemptsState(0);
    }
  };

  const startCountdown = (until: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const update = () => {
      const remaining = until - Date.now();
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setLocked(false);
        setLockoutRemaining('');
        clearLockout();
        setAttempts(0);
        setAttemptsState(0);
      } else {
        setLockoutRemaining(formatTime(remaining));
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
  };

  const handleComplete = async (pin: string) => {
    if (locked) return;

    const storedHash = await getPinHash();
    const inputHash = await hashPin(pin);
    if (storedHash === inputHash) {
      await clearLockout();
      await setAttempts(0);
      await setAuthenticated();
      setError('');
      router.replace('/');
    } else {
      setPinKey((k) => k + 1);
      const newAttempts = attempts + 1;
      setAttemptsState(newAttempts);
      await setAttempts(newAttempts);

      if (newAttempts >= 5) {
        await setLockout();
        setLocked(true);
        setError(t('auth.tooMany'));
        const until = Date.now() + 3 * 60 * 60 * 1000;
        startCountdown(until);
      } else {
        setError(t('auth.wrongPin', { attempts: newAttempts }));
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={locked ? 'lock-clock' : 'lock'}
            size={64}
            color={locked ? Colors.error : Colors.primary}
          />
        </View>
        <Text style={styles.title}>{t('auth.unlockTitle')}</Text>
        <Text style={styles.subtitle}>
          {locked
            ? t('auth.locked', { time: lockoutRemaining })
            : t('auth.enterPin')}
        </Text>
      </View>

      <PinInput
        key={pinKey}
        length={6}
        onComplete={handleComplete}
        error={error}
        disabled={locked}
      />

      {!locked && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.recoveryLink}
            onPress={() => router.push('/recovery')}
          >
            <MaterialIcons name="help-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.recoveryLinkText}>{t('auth.forgotPin')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  top: {
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
    borderColor: Colors.primary,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  recoveryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  recoveryLinkText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
