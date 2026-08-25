import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function PinInput({ length = 6, onComplete, error, disabled }: PinInputProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!disabled) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChange = (text: string) => {
    if (disabled) return;
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    setPin(cleaned);
    if (cleaned.length === length) {
      Keyboard.dismiss();
      onComplete(cleaned);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={focusInput}
      style={styles.container}
      disabled={disabled}
    >
      <View style={styles.dotsContainer}>
        {Array.from({ length }).map((_, i) => (
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
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        secureTextEntry
        editable={!disabled}
        showSoftInputOnFocus={!disabled}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!disabled && <Text style={styles.hint}>Appuyez pour saisir le PIN</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surfaceBorder,
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
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 50,
    opacity: 0,
    top: Spacing.xxl,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.lg,
  },
});
