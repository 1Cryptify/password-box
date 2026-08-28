import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { clearAllData, getSites, getEquipment, getCredentials, getPinHash } from '../../lib/database';
import { createPassFile, getDeviceId, getDeviceLabel } from '../../lib/passfile';
import { hashPin } from '../../lib/encryption';
import { createRecoveryKey, hasRecoveryKey } from '../../lib/recovery';
import { AppData } from '../../lib/types';
import PinInput from '../../components/PinInput';
import { useI18n, LANGUAGES } from '../../i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const [whitelistModalVisible, setWhitelistModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalAction, setPinModalAction] = useState<'export' | 'regen' | 'erase'>('export');
  const [pinError, setPinError] = useState('');
  const [imeiInput, setImeiInput] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryKeySaved, setRecoveryKeySaved] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [eraseModalVisible, setEraseModalVisible] = useState(false);
  const [eraseStep, setEraseStep] = useState<'phrase' | 'pin'>('phrase');
  const [erasePhrase, setErasePhrase] = useState('');
  const [eraseError, setEraseError] = useState('');

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    checkRecovery();
    loadDeviceLabel();
  }, []);

  const checkRecovery = async () => {
    const has = await hasRecoveryKey();
    setHasRecovery(has);
  };

  const loadDeviceLabel = async () => {
    const label = await getDeviceLabel();
    setDeviceLabel(label);
  };

  const openPinModal = (action: 'export' | 'regen') => {
    setPinModalAction(action);
    setPinError('');
    setPinModalVisible(true);
  };

  const handlePinVerified = async (pin: string) => {
    const storedHash = await getPinHash();
    const inputHash = await hashPin(pin);
    if (storedHash === inputHash) {
      setPinModalVisible(false);

      if (pinModalAction === 'export') {
        const id = await getDeviceId();
        setWhitelist([id]);
        setImeiInput('');
        setWhitelistModalVisible(true);
      } else if (pinModalAction === 'regen') {
        const key = await createRecoveryKey();
        setRecoveryKey(key);
        setRecoveryKeySaved(false);
        setRecoveryModalVisible(true);
      } else {
        await doErase();
      }
    } else {
      setPinError(t('settings.wrongPin'));
    }
  };

  const openErase = () => {
    setErasePhrase('');
    setEraseError('');
    setEraseStep('phrase');
    setEraseModalVisible(true);
  };

  const closeErase = () => {
    setEraseModalVisible(false);
    setErasePhrase('');
    setEraseError('');
    setEraseStep('phrase');
  };

  const handleErasePhrase = () => {
    const expected = t('settings.clearPhrase').trim().toUpperCase();
    const input = erasePhrase.trim().toUpperCase();
    if (input !== expected) {
      setEraseError(t('settings.clearWrongPhrase'));
      return;
    }
    setEraseError('');
    setEraseStep('pin');
  };

  const doErase = async () => {
    await clearAllData();
    setEraseModalVisible(false);
    Alert.alert(
      'PasswordBox',
      t('settings.clearFinalMsg'),
      [
        {
          text: t('common.ok'),
          onPress: () => {
            router.replace('/setup');
          },
        },
      ],
      { cancelable: false }
    );
  };

  const addDeviceId = () => {
    const cleaned = imeiInput.trim().toUpperCase();
    if (!cleaned) return;
    if (whitelist.includes(cleaned)) {
      Alert.alert(t('settings.duplicate'), t('settings.duplicateMsg'));
      return;
    }
    setWhitelist([...whitelist, cleaned]);
    setImeiInput('');
  };

  const removeDeviceId = (id: string) => {
    setWhitelist(whitelist.filter((e) => e !== id));
  };

  const exportPassFile = async () => {
    try {
      const sites = await getSites();
      const equipment = await getEquipment();
      const credentials = await getCredentials();

      const appData: AppData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        sites,
        equipment,
        credentials,
      };

      const content = await createPassFile(appData, whitelist);

      const { File, Paths } = await import('expo-file-system');
      const Sharing = await import('expo-sharing');

      const file = new File(Paths.document, 'passwordbox_export.pass');
      await file.write(content);
      await Sharing.shareAsync(file.uri);

      setWhitelistModalVisible(false);
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.exportError'));
    }
  };

  const copyRecoveryKey = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(recoveryKey);
      Alert.alert(t('common.copied'), t('settings.recoveryCopy'));
      setRecoveryKeySaved(true);
    } catch {
      setRecoveryKeySaved(true);
    }
  };

  const handleRecoveryDone = async () => {
    if (!recoveryKeySaved) {
      Alert.alert(t('settings.saveCodeTitle'), t('settings.saveCodeMsg'));
      return;
    }
    await checkRecovery();
    setRecoveryModalVisible(false);
    Alert.alert(t('common.success'), t('settings.recoverySaved'));
  };

  const securityItems = [
    {
      icon: 'lock',
      label: t('settings.changePin'),
      color: Colors.primary,
      onPress: () => router.push('/settings/change-pin'),
    },
    {
      icon: 'language',
      label: t('settings.language'),
      color: Colors.textSecondary,
      onPress: () => router.push('/settings/language'),
    },
  ];

  const dataItems = [
    {
      icon: 'file-upload',
      label: t('settings.exportData'),
      color: Colors.secondary,
      onPress: () => openPinModal('export'),
    },
    {
      icon: 'file-download',
      label: t('settings.importData'),
      color: Colors.warning,
      onPress: () => router.push('/settings/import'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
        {securityItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <MaterialIcons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.icon === 'language' && (
              <Text style={styles.langBadge}>{lang.toUpperCase()}</Text>
            )}
            <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>{t('settings.recovery')}</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => openPinModal('regen')}>
          <View style={[styles.menuIcon, { backgroundColor: Colors.success + '20' }]}>
            <MaterialIcons name="vpn-key" size={22} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>
              {hasRecovery ? t('settings.regenRecovery') : t('settings.genRecovery')}
            </Text>
            <Text style={styles.menuSubLabel}>
              {hasRecovery ? t('settings.regenRecoverySub') : t('settings.genRecoverySub')}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        {dataItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <MaterialIcons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>{t('settings.dangerZone')}</Text>
        <TouchableOpacity style={styles.dangerItem} onPress={openErase}>
          <View style={styles.dangerIcon}>
            <MaterialIcons name="delete-forever" size={22} color={Colors.error} />
          </View>
          <Text style={styles.dangerLabel}>{t('settings.clearAllData')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>PasswordBox v1.0.0</Text>
          <Text style={styles.footerText}>PasswordBox</Text>
        </View>
      </ScrollView>

      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pinModalAction === 'export' || pinModalAction === 'erase'
                ? t('settings.pinConfirm')
                : t('settings.confirmPin')}
            </Text>
            <Text style={styles.modalDescription}>
              {pinModalAction === 'export'
                ? t('settings.pinForExport')
                : pinModalAction === 'erase'
                ? t('settings.clearPinForErase')
                : t('settings.pinForRegen')}
            </Text>
            <PinInput
              key={`pin-verify-${pinModalAction}`}
              length={6}
              onComplete={handlePinVerified}
              error={pinError}
            />
            <TouchableOpacity
              style={styles.cancelBtnFull}
              onPress={() => setPinModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={whitelistModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWhitelistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: keyboardHeight + Spacing.xl }]}
          >
            <Text style={styles.modalTitle}>{t('settings.allowedDevices')}</Text>
            <Text style={styles.modalDescription}>
              {t('settings.allowedDevicesDesc', { label: deviceLabel })}
            </Text>

            <View style={styles.imeiInputRow}>
              <TextInput
                style={styles.imeiInput}
                value={imeiInput}
                onChangeText={setImeiInput}
                placeholder={t('settings.enterDeviceId')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addDeviceId}>
                <MaterialIcons name="add" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={whitelist}
              keyExtractor={(item) => item}
              style={styles.imeiList}
              renderItem={({ item, index }) => (
                <View style={styles.imeiItem}>
                  <MaterialIcons
                    name={index === 0 ? 'smartphone' : 'person'}
                    size={18}
                    color={index === 0 ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={styles.imeiText} numberOfLines={1}>
                    {item}
                    {index === 0 ? ` ${t('settings.you')}` : ''}
                  </Text>
                  {index > 0 && (
                    <TouchableOpacity onPress={() => removeDeviceId(item)}>
                      <MaterialIcons name="close" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setWhitelistModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportBtn, whitelist.length === 0 && styles.exportBtnDisabled]}
                onPress={exportPassFile}
                disabled={whitelist.length === 0}
              >
                <Text style={styles.exportBtnText}>{t('settings.exportPass')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={recoveryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRecoveryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.recoveryCopy')}</Text>
            <Text style={styles.modalDescription}>
              {t('settings.recoveryCopy')}
              {'\n\n'}
              <Text style={{ color: Colors.error, fontWeight: '600' }}>
                {t('setup.warningBold')}
              </Text>
            </Text>

            <View style={styles.keyBox}>
              <Text style={styles.keyText}>{recoveryKey}</Text>
            </View>

            <TouchableOpacity style={styles.copyBtn} onPress={copyRecoveryKey}>
              <MaterialIcons name="content-copy" size={18} color={Colors.white} />
              <Text style={styles.copyBtnText}>
                {recoveryKeySaved ? t('common.copied') : t('setup.copyCode')}
              </Text>
            </TouchableOpacity>

            <View style={styles.checkRow}>
              <TouchableOpacity
                style={[styles.checkbox, recoveryKeySaved && styles.checkboxActive]}
                onPress={() => setRecoveryKeySaved(!recoveryKeySaved)}
              >
                {recoveryKeySaved && <MaterialIcons name="check" size={16} color={Colors.white} />}
              </TouchableOpacity>
              <Text style={styles.checkLabel}>{t('setup.savedCheck')}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRecoveryModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('common.close')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportBtn, !recoveryKeySaved && styles.exportBtnDisabled]}
                onPress={handleRecoveryDone}
                disabled={!recoveryKeySaved}
              >
                <Text style={styles.exportBtnText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={eraseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeErase}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {eraseStep === 'phrase' ? (
              <>
                <Text style={[styles.modalTitle, { color: Colors.error }]}>
                  {t('settings.clearAllData')}
                </Text>
                <Text style={styles.modalDescription}>
                  {t('settings.clearConfirmPin')}
                </Text>
                <Text style={[styles.phraseHint, { color: Colors.error, fontWeight: '700' }]}>
                  {t('settings.clearPhrase')}
                </Text>
                <TextInput
                  style={styles.phraseInput}
                  value={erasePhrase}
                  onChangeText={(v) => {
                    setErasePhrase(v);
                    if (eraseError) setEraseError('');
                  }}
                  placeholder={t('settings.clearPhrasePlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
                {eraseError ? <Text style={styles.errorText}>{eraseError}</Text> : null}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeErase}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={handleErasePhrase}
                  >
                    <Text style={styles.exportBtnText}>{t('common.continue')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: Colors.error }]}>
                  {t('settings.clearAllData')}
                </Text>
                <Text style={styles.modalDescription}>
                  {t('settings.clearPinForErase')}
                </Text>
                <PinInput
                  key="pin-erase"
                  length={6}
                  onComplete={handlePinVerified}
                  error={pinError}
                />
                <TouchableOpacity style={styles.cancelBtnFull} onPress={closeErase}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    flex: 1,
  },
  menuSubLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  langBadge: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dangerLabel: {
    color: Colors.error,
    fontSize: FontSize.md,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl * 2,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  cancelBtnFull: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  imeiInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  imeiInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imeiList: {
    maxHeight: 200,
    marginBottom: Spacing.lg,
  },
  imeiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  imeiText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  exportBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  phraseHint: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  phraseInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  keyBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.warning,
    marginBottom: Spacing.lg,
  },
  keyText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  copyBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
});
