import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

export interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
  disabled?: boolean;
  hint?: string;
  leftBottom?: React.ReactNode;
}

const KEYS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function PinInput({
  length = 6,
  onComplete,
  error,
  disabled,
  hint,
  leftBottom,
}: PinInputProps) {
  const [pin, setPin] = useState('');
  const pinRef = useRef('');
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = () => {
    if (completeTimer.current) {
      clearTimeout(completeTimer.current);
      completeTimer.current = null;
    }
  };

  const pressKey = (value: string) => {
    if (disabled) return;
    clearPending();
    const next = (pinRef.current + value).slice(0, length);
    pinRef.current = next;
    setPin(next);
    if (next.length === length) {
      completeTimer.current = setTimeout(() => {
        completeTimer.current = null;
        onComplete(next);
        pinRef.current = '';
        setPin('');
      }, 250);
    }
  };

  const pressBackspace = () => {
    if (disabled) return;
    clearPending();
    if (pinRef.current.length === 0) return;
    const next = pinRef.current.slice(0, -1);
    pinRef.current = next;
    setPin(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <View style={styles.dotsContainer}>
          {Array.from({ length }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                i === pin.length && styles.dotActive,
                disabled && styles.dotDisabled,
              ]}
            />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((row) => (
          <View key={row.join('')} style={styles.row}>
            {row.map((value) => (
              <Pressable
                key={value}
                disabled={disabled}
                accessibilityLabel={value}
                onPress={() => pressKey(value)}
                style={({ pressed }) => [
                  styles.key,
                  pressed && !disabled && styles.keyPressed,
                ]}
              >
                {({ pressed }) => (
                  <Text
                    style={[styles.keyText, pressed && !disabled && styles.keyTextPressed]}
                  >
                    {value}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <View style={styles.key}>{leftBottom}</View>
          <Pressable
            disabled={disabled}
            accessibilityLabel="0"
            onPress={() => pressKey('0')}
            style={({ pressed }) => [
              styles.key,
              pressed && !disabled && styles.keyPressed,
            ]}
          >
            {({ pressed }) => (
              <Text
                style={[styles.keyText, pressed && !disabled && styles.keyTextPressed]}
              >
                0
              </Text>
            )}
          </Pressable>
          <Pressable
            disabled={disabled || pin.length === 0}
            accessibilityLabel="Effacer"
            onPress={pressBackspace}
            style={({ pressed }) => [
              styles.key,
              pressed && !disabled && pin.length > 0 && styles.keyPressed,
            ]}
          >
            {({ pressed }) => (
              <MaterialIcons
                name="backspace"
                size={26}
                color={pin.length === 0 ? Colors.textMuted : Colors.textSecondary}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  display: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotActive: {
    borderColor: Colors.primary,
  },
  dotDisabled: {
    opacity: 0.4,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  key: {
    flex: 1,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  keyText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  keyTextPressed: {
    color: Colors.white,
  },
});