import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { useI18n, LANGUAGES } from '../../i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const { lang, setLang } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {LANGUAGES.find((l) => l.code === lang)?.nativeName ?? 'Language'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {LANGUAGES.map((l) => {
          const active = l.code === lang;
          return (
            <TouchableOpacity
              key={l.code}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => setLang(l.code)}
            >
              <Text style={styles.name}>{l.nativeName}</Text>
              <View style={styles.right}>
                {l.rtl ? <Text style={styles.rtlBadge}>RTL</Text> : null}
                {active && <MaterialIcons name="check" size={22} color={Colors.primary} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  itemActive: {
    borderColor: Colors.primary,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rtlBadge: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
