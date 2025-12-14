import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Linking,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  X,
  Crown,
  Bell,
  Vibrate,
  Star,
  Mail,
  FileText,
  Shield,
  ChevronRight,
  Clock,
  Calendar,
  Check,
  Globe,
} from "lucide-react-native";
import { SettingsScreenProps } from "../types/navigation";
import { SoundMixer } from "../components";
import {
  useSettings,
  ReminderFrequency,
  WeekDay,
  Language,
  LANGUAGES,
} from "../context/SettingsContext";
import { useTranslation } from "../hooks";

// WeekDay index to translation key mapping
const WEEKDAY_KEYS: Record<
  WeekDay,
  keyof typeof import("../i18n/translations/tr").tr.weekdaysShort
> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#22d3ee",
  secondary: "#4ade80",
  accent: "#fbbf24",
  muted: "#6b7280",
  white: "#FFFFFF",
  divider: "#2E2E2E",
};

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.settingRow}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showChevron && onPress && !rightElement && (
        <ChevronRight color={COLORS.muted} size={20} />
      )}
    </TouchableOpacity>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const {
    hapticEnabled,
    setHapticEnabled,
    reminderSettings,
    setReminderEnabled,
    setReminderFrequency,
    setReminderDays,
    toggleReminderDay,
    setReminderTime,
    language,
    setLanguage,
  } = useSettings();
  const { t } = useTranslation();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDaysPicker, setShowDaysPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<
    "terms" | "privacy" | null
  >(null);
  const [selectedTime, setSelectedTime] = useState(() => {
    const date = new Date();
    date.setHours(reminderSettings.hour);
    date.setMinutes(reminderSettings.minute);
    return date;
  });

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const frequencyLabels: Record<ReminderFrequency, string> = {
    daily: t.settings.frequencyDaily,
    custom: t.settings.frequencyCustom,
  };

  const getSelectedDaysText = () => {
    const days = reminderSettings.selectedDays || [1, 2, 3, 4, 5];
    if (days.length === 7) return t.settings.frequencyDaily;
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
      return t.settings.weekdays;
    }
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return t.settings.weekends;
    }
    return days.map((d) => t.weekdaysShort[WEEKDAY_KEYS[d]]).join(", ");
  };

  const handleRateApp = () => console.log("Rate app");
  const handleContactSupport = async () => {
    const email = "support@nefeskocu.app";
    const subject = encodeURIComponent(t.supportEmail.subject);
    const body = encodeURIComponent(
      t.supportEmail.body +
        "\n" +
        t.supportEmail.platform +
        ": " +
        Platform.OS +
        "\n" +
        t.supportEmail.version +
        ": " +
        Platform.Version +
        "\n"
    );
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Mail uygulaması yoksa Gmail web aç
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
        await Linking.openURL(gmailUrl);
      }
    } catch (error) {
      console.error("Mail açılamadı:", error);
      // Fallback: sadece email adresini kopyalamak için alert göster
      alert(`${t.supportEmail.contactUs}: ${email}`);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.settings.title}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X color={COLORS.muted} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Paywall")}
            style={styles.proCard}
            activeOpacity={0.8}
          >
            <View style={styles.proIcon}>
              <Crown color={COLORS.white} size={24} />
            </View>
            <View style={styles.proTextContainer}>
              <Text style={styles.proTitle}>{t.settings.upgradeToPro}</Text>
              <Text style={styles.proSubtitle}>
                {t.settings.upgradeSubtitle}
              </Text>
            </View>
            <ChevronRight color={COLORS.white} size={24} />
          </TouchableOpacity>

          <SettingSection title="Preferences">
            <TouchableOpacity
              onPress={() => setShowLanguagePicker(true)}
              activeOpacity={0.7}
            >
              <SettingRow
                icon={<Globe color={COLORS.secondary} size={20} />}
                title={t.settings.language}
                subtitle={`${LANGUAGES[language].flag} ${LANGUAGES[language].nativeName}`}
                showChevron={true}
              />
            </TouchableOpacity>
            <Divider />
            <SettingRow
              icon={<Vibrate color={COLORS.primary} size={20} />}
              title={t.settings.hapticFeedback}
              subtitle={t.settings.hapticSubtitle}
              showChevron={false}
              rightElement={
                <Switch
                  value={hapticEnabled}
                  onValueChange={setHapticEnabled}
                  trackColor={{ false: "#3E3E3E", true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              }
            />
            <Divider />
            <SettingRow
              icon={<Bell color={COLORS.accent} size={20} />}
              title={t.settings.reminders}
              subtitle={t.settings.remindersSubtitle}
              showChevron={false}
              rightElement={
                <Switch
                  value={reminderSettings.enabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: "#3E3E3E", true: COLORS.accent }}
                  thumbColor={COLORS.white}
                />
              }
            />
            {reminderSettings.enabled && (
              <>
                <Divider />
                <TouchableOpacity
                  onPress={() => setShowFrequencyPicker(true)}
                  activeOpacity={0.7}
                >
                  <SettingRow
                    icon={<Calendar color={COLORS.secondary} size={20} />}
                    title={t.settings.frequency}
                    subtitle={frequencyLabels[reminderSettings.frequency]}
                    showChevron={true}
                  />
                </TouchableOpacity>
                {reminderSettings.frequency === "custom" && (
                  <>
                    <Divider />
                    <TouchableOpacity
                      onPress={() => setShowDaysPicker(true)}
                      activeOpacity={0.7}
                    >
                      <SettingRow
                        icon={<Calendar color={COLORS.accent} size={20} />}
                        title={t.settings.selectDays}
                        subtitle={getSelectedDaysText()}
                        showChevron={true}
                      />
                    </TouchableOpacity>
                  </>
                )}
                <Divider />
                <TouchableOpacity
                  onPress={() => {
                    const date = new Date();
                    date.setHours(reminderSettings.hour);
                    date.setMinutes(reminderSettings.minute);
                    setSelectedTime(date);
                    setShowTimePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <SettingRow
                    icon={<Clock color={COLORS.primary} size={20} />}
                    title={t.settings.time}
                    subtitle={formatTime(
                      reminderSettings.hour,
                      reminderSettings.minute
                    )}
                    showChevron={true}
                  />
                </TouchableOpacity>
              </>
            )}
          </SettingSection>

          {/* Sound Mixer Section */}
          <SoundMixer />

          <SettingSection title={t.settings.support}>
            <SettingRow
              icon={<Star color={COLORS.accent} size={20} />}
              title={t.settings.rateApp}
              subtitle={t.settings.rateAppSubtitle}
              onPress={handleRateApp}
            />
            <Divider />
            <SettingRow
              icon={<Mail color={COLORS.primary} size={20} />}
              title={t.settings.contactSupport}
              subtitle={t.settings.contactSupportSubtitle}
              onPress={handleContactSupport}
            />
          </SettingSection>

          <SettingSection title={t.settings.legal}>
            <SettingRow
              icon={<FileText color={COLORS.muted} size={20} />}
              title={t.settings.termsOfUse}
              onPress={() => setShowLegalModal("terms")}
            />
            <Divider />
            <SettingRow
              icon={<Shield color={COLORS.muted} size={20} />}
              title={t.settings.privacyPolicy}
              onPress={() => setShowLegalModal("privacy")}
            />
          </SettingSection>

          <View style={styles.footer}>
            <Text style={styles.versionText}>Nefes Koçu v1.0.0</Text>
            <Text style={styles.madeWithText}>
              Made with ❤️ for better breathing
            </Text>
          </View>
        </ScrollView>

        {/* Language Picker Modal */}
        <Modal
          visible={showLanguagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLanguagePicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.settings.selectLanguage}</Text>
              {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.modalOption}
                  onPress={() => {
                    setLanguage(lang);
                    setShowLanguagePicker(false);
                  }}
                >
                  <View style={styles.languageOption}>
                    <Text style={styles.languageFlag}>
                      {LANGUAGES[lang].flag}
                    </Text>
                    <View>
                      <Text
                        style={[
                          styles.modalOptionText,
                          language === lang && styles.modalOptionTextActive,
                        ]}
                      >
                        {LANGUAGES[lang].nativeName}
                      </Text>
                      <Text style={styles.languageSubtext}>
                        {LANGUAGES[lang].name}
                      </Text>
                    </View>
                  </View>
                  {language === lang && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Frequency Picker Modal */}
        <Modal
          visible={showFrequencyPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFrequencyPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFrequencyPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t.settings.reminderFrequency}
              </Text>
              {(["daily", "custom"] as ReminderFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={styles.modalOption}
                  onPress={() => {
                    setReminderFrequency(freq);
                    setShowFrequencyPicker(false);
                    // Belirli günler seçildiğinde gün seçici aç
                    if (freq === "custom") {
                      setShowDaysPicker(true);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      reminderSettings.frequency === freq &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {frequencyLabels[freq]}
                  </Text>
                  {reminderSettings.frequency === freq && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Days Picker Modal */}
        <Modal
          visible={showDaysPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDaysPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDaysPicker(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t.settings.selectDays}</Text>
                <Text style={styles.modalSubtitle}>
                  {language === "tr"
                    ? "Hangi günlerde hatırlatılsın?"
                    : "Which days should we remind you?"}
                </Text>
                <View style={styles.daysGrid}>
                  {([1, 2, 3, 4, 5, 6, 0] as WeekDay[]).map((day) => {
                    const selectedDays = reminderSettings.selectedDays || [
                      1, 2, 3, 4, 5,
                    ];
                    const isSelected = selectedDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          isSelected && styles.dayButtonActive,
                        ]}
                        onPress={() => toggleReminderDay(day)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            isSelected && styles.dayButtonTextActive,
                          ]}
                        >
                          {t.weekdaysShort[WEEKDAY_KEYS[day]]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Quick selection buttons */}
                <View style={styles.quickSelectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.quickSelectButton,
                      reminderSettings.selectedDays?.length === 5 &&
                        !reminderSettings.selectedDays?.includes(0) &&
                        !reminderSettings.selectedDays?.includes(6) &&
                        styles.quickSelectButtonActive,
                    ]}
                    onPress={() => setReminderDays([1, 2, 3, 4, 5])}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickSelectText,
                        reminderSettings.selectedDays?.length === 5 &&
                          !reminderSettings.selectedDays?.includes(0) &&
                          !reminderSettings.selectedDays?.includes(6) &&
                          styles.quickSelectTextActive,
                      ]}
                    >
                      💼 {t.settings.weekdays}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickSelectButton,
                      reminderSettings.selectedDays?.length === 2 &&
                        reminderSettings.selectedDays?.includes(0) &&
                        reminderSettings.selectedDays?.includes(6) &&
                        styles.quickSelectButtonActive,
                    ]}
                    onPress={() => setReminderDays([0, 6])}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickSelectText,
                        reminderSettings.selectedDays?.length === 2 &&
                          reminderSettings.selectedDays?.includes(0) &&
                          reminderSettings.selectedDays?.includes(6) &&
                          styles.quickSelectTextActive,
                      ]}
                    >
                      ☕ {t.settings.weekends}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.daysConfirmButton}
                  onPress={() => setShowDaysPicker(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.daysConfirmButtonText}>
                    {t.common.ok}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Time Picker - Native */}
        {showTimePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(event, date) => {
              setShowTimePicker(false);
              if (event.type === "set" && date) {
                setSelectedTime(date);
                setReminderTime(date.getHours(), date.getMinutes());
              }
            }}
          />
        )}

        {/* Time Picker Modal - iOS */}
        {Platform.OS === "ios" && (
          <Modal
            visible={showTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            >
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {t.settings.reminderTime}
                  </Text>
                  <View style={styles.dateTimePickerContainer}>
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      textColor="#fff"
                      themeVariant="dark"
                      onChange={(event, date) => {
                        if (date) {
                          setSelectedTime(date);
                        }
                      }}
                      style={styles.iosTimePicker}
                    />
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.modalButtonCancelText}>
                        {t.common.cancel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButtonConfirm}
                      onPress={() => {
                        setReminderTime(
                          selectedTime.getHours(),
                          selectedTime.getMinutes()
                        );
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={styles.modalButtonConfirmText}>
                        {t.common.save}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Legal Modal */}
        <Modal
          visible={showLegalModal !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLegalModal(null)}
        >
          <View style={styles.legalModalContainer}>
            <View style={styles.legalModalContent}>
              <View style={styles.legalModalHeader}>
                <Text style={styles.legalModalTitle}>
                  {showLegalModal === "terms"
                    ? t.settings.termsOfUse
                    : t.settings.privacyPolicy}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLegalModal(null)}
                  style={styles.legalCloseButton}
                >
                  <X size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.legalScrollView}
                showsVerticalScrollIndicator={true}
              >
                {showLegalModal === "terms" ? (
                  <View style={styles.legalTextContainer}>
                    <Text style={styles.legalHeading}>
                      {t.legal.terms.heading}
                    </Text>
                    <Text style={styles.legalDate}>
                      {t.legal.terms.lastUpdated}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section1Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section1Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section2Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section2Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section3Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section3Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section4Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section4Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section5Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section5Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section6Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section6Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.terms.section7Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.terms.section7Text}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.legalTextContainer}>
                    <Text style={styles.legalHeading}>
                      {t.legal.privacy.heading}
                    </Text>
                    <Text style={styles.legalDate}>
                      {t.legal.privacy.lastUpdated}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section1Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section1Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section2Title}
                    </Text>
                    <Text style={styles.legalText}>
                      <Text style={styles.legalBold}>
                        {t.legal.privacy.section2TextAuto}
                      </Text>
                      {"\n"}
                      {t.legal.privacy.section2TextAutoList}
                      {"\n\n"}
                      <Text style={styles.legalBold}>
                        {t.legal.privacy.section2TextUser}
                      </Text>
                      {"\n"}
                      {t.legal.privacy.section2TextUserList}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section3Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section3Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section4Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section4Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section5Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section5Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section6Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section6Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section7Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section7Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section8Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section8Text}
                    </Text>

                    <Text style={styles.legalSectionTitle}>
                      {t.legal.privacy.section9Title}
                    </Text>
                    <Text style={styles.legalText}>
                      {t.legal.privacy.section9Text}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: "bold" },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  proCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  proTextContainer: { flex: 1 },
  proTitle: { color: COLORS.white, fontWeight: "bold", fontSize: 18 },
  proSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTextContainer: { flex: 1 },
  settingTitle: { color: COLORS.white, fontWeight: "500", fontSize: 16 },
  settingSubtitle: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 16 },
  footer: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  versionText: { color: COLORS.muted, fontSize: 14 },
  madeWithText: { color: "rgba(107,114,128,0.5)", fontSize: 12, marginTop: 4 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: 300,
    maxWidth: "90%",
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  modalOptionText: {
    color: COLORS.muted,
    fontSize: 16,
  },
  modalOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  // Language picker styles
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageSubtext: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  // Time Picker styles
  dateTimePickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iosTimePicker: {
    width: 280,
    height: 180,
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  timeColumn: {
    alignItems: "center",
  },
  timeLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  timeScroller: {
    alignItems: "center",
  },
  timeArrow: {
    padding: 12,
  },
  timeArrowText: {
    color: COLORS.primary,
    fontSize: 20,
  },
  timeValue: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: "700",
    width: 80,
    textAlign: "center",
  },
  timeSeparator: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  modalButtonCancelText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalButtonConfirmText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
  // Days picker styles
  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary + "30",
    borderColor: COLORS.primary,
  },
  dayButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  dayButtonTextActive: {
    color: COLORS.primary,
  },
  quickSelectContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickSelectButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  quickSelectButtonActive: {
    backgroundColor: COLORS.secondary + "20",
    borderColor: COLORS.secondary,
  },
  quickSelectText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  quickSelectTextActive: {
    color: COLORS.secondary,
  },
  daysConfirmButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  daysConfirmButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  // Legal Modal Styles
  legalModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  legalModalContent: {
    flex: 1,
    paddingTop: 60,
  },
  legalModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  legalModalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },
  legalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  legalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  legalTextContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  legalHeading: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  legalDate: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 24,
  },
  legalSectionTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  legalText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
  legalBold: {
    fontWeight: "700",
    color: COLORS.white,
  },
});
