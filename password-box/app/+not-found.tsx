import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page introuvable</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Retour à l'accueil</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 72,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xxl,
  },
  link: {
    marginTop: Spacing.lg,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSize.md,
  },
});
