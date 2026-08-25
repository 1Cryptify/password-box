import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Credential, AUTH_TYPE_LABELS } from '../lib/types';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface CredentialCardProps {
  credential: Credential;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function CredentialCard({ credential, onPress, onLongPress }: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  const maskedPassword = credential.password
    ? '\u2022'.repeat(Math.min(credential.password.length, 16))
    : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="vpn-key" size={18} color={Colors.primary} />
          <Text style={styles.label} numberOfLines={1}>{credential.label}</Text>
        </View>
        <View style={styles.authBadge}>
          <Text style={styles.authText}>{AUTH_TYPE_LABELS[credential.authType]}</Text>
        </View>
      </View>

      {credential.username ? (
        <View style={styles.field}>
          <MaterialIcons name="person" size={14} color={Colors.textMuted} />
          <Text style={styles.fieldValue} numberOfLines={1}>{credential.username}</Text>
        </View>
      ) : null}

      {credential.password ? (
        <View style={styles.field}>
          <MaterialIcons name="lock" size={14} color={Colors.textMuted} />
          <Text style={styles.fieldValue} numberOfLines={1}>
            {showPassword ? credential.password : maskedPassword}
          </Text>
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {credential.port ? (
        <View style={styles.field}>
          <MaterialIcons name="settings-ethernet" size={14} color={Colors.textMuted} />
          <Text style={styles.fieldValue}>Port: {credential.port}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  authBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  authText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  fieldValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
    fontFamily: 'monospace',
  },
});
