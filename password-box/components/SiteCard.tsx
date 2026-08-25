import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Site, SITE_TYPE_LABELS, SITE_ICONS, getSiteMode } from '../lib/types';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface SiteCardProps {
  site: Site;
  count: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function SiteCard({ site, count, onPress, onLongPress }: SiteCardProps) {
  const isPersonal = getSiteMode(site) === 'personnel';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={(isPersonal ? 'person' : (SITE_ICONS[site.type] || 'location-on')) as any}
          size={28}
          color={isPersonal ? Colors.secondary : Colors.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{site.name}</Text>
        {isPersonal ? (
          <Text style={styles.typePersonal}>Service personnel</Text>
        ) : (
          <Text style={styles.type}>{SITE_TYPE_LABELS[site.type]}</Text>
        )}
        {!isPersonal && site.address ? (
          <Text style={styles.address} numberOfLines={1}>{site.address}</Text>
        ) : null}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
        <MaterialIcons
          name={isPersonal ? 'vpn-key' : 'devices-other'}
          size={14}
          color={Colors.textSecondary}
        />
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
    width: 48,
    height: 48,
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
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  type: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  typePersonal: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  address: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
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
