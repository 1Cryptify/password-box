import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Equipment, EQUIPMENT_ICONS, getEquipmentTypeLabel, getOSLabel } from '../lib/types';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface EquipmentCardProps {
  equipment: Equipment;
  credentialCount: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function EquipmentCard({ equipment, credentialCount, onPress, onLongPress }: EquipmentCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={(EQUIPMENT_ICONS[equipment.type] || 'devices-other') as any}
          size={24}
          color={Colors.secondary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{equipment.name}</Text>
        <Text style={styles.details}>
          {getEquipmentTypeLabel(equipment)} &middot; {getOSLabel(equipment)}
          {equipment.brand ? ` · ${equipment.brand}` : ''}
        </Text>
        {equipment.hostname ? (
          <Text style={styles.hostname} numberOfLines={1}>{equipment.hostname}</Text>
        ) : null}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{credentialCount}</Text>
        <MaterialIcons name="vpn-key" size={14} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  details: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  hostname: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
