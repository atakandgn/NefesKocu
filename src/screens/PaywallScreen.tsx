import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Check,
  Sparkles,
  Volume2,
  Ban,
  Crown,
  Zap,
} from "lucide-react-native";
import { PaywallScreenProps } from "../types/navigation";
import { useTranslation } from "../hooks";

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#22d3ee",
  secondary: "#4ade80",
  muted: "#6b7280",
  white: "#FFFFFF",
};

// Benefit icon mapping
const BENEFIT_ICONS = {
  removeAds: Ban,
  premiumSounds: Volume2,
  advancedPatterns: Sparkles,
  prioritySupport: Zap,
} as const;

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const { t } = useTranslation();

  const BENEFITS = [
    { key: "removeAds" as const, icon: BENEFIT_ICONS.removeAds },
    { key: "premiumSounds" as const, icon: BENEFIT_ICONS.premiumSounds },
    { key: "advancedPatterns" as const, icon: BENEFIT_ICONS.advancedPatterns },
    { key: "prioritySupport" as const, icon: BENEFIT_ICONS.prioritySupport },
  ];

  const handlePurchase = () => console.log("Purchase initiated");
  const handleRestore = () => console.log("Restore purchases");

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
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
        >
          <View style={styles.headerSection}>
            <View style={styles.crownContainer}>
              <Crown color={COLORS.primary} size={40} />
            </View>
            <Text style={styles.title}>{t.paywall.title}</Text>
            <Text style={styles.subtitle}>{t.paywall.subtitle}</Text>
          </View>

          <View style={styles.benefitsContainer}>
            {BENEFITS.map((benefit, index) => {
              const IconComponent = benefit.icon;
              const benefitData = t.paywall.benefits[benefit.key];
              return (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <IconComponent color={COLORS.primary} size={24} />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{benefitData.title}</Text>
                    <Text style={styles.benefitDescription}>
                      {benefitData.description}
                    </Text>
                  </View>
                  <Check color={COLORS.secondary} size={20} />
                </View>
              );
            })}
          </View>

          <View style={styles.pricingCard}>
            <LinearGradient
              colors={["#22d3ee", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.pricingContent}>
                <Text style={styles.pricingLabel}>
                  {t.paywall.lifetimeAccess}
                </Text>
                <Text style={styles.pricingAmount}>$9.99</Text>
                <Text style={styles.pricingNote}>
                  {t.paywall.oneTimePurchase}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handlePurchase}
            style={styles.purchaseButton}
            activeOpacity={0.8}
          >
            <Text style={styles.purchaseText}>{t.paywall.unlockAccess}</Text>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={handleRestore} activeOpacity={0.7}>
              <Text style={styles.restoreText}>
                {t.paywall.restorePurchase}
              </Text>
            </TouchableOpacity>
            <View style={styles.termsRow}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.termsText}>{t.paywall.termsOfUse}</Text>
              </TouchableOpacity>
              <View style={styles.dot} />
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.termsText}>{t.paywall.privacyPolicy}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
  headerSection: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34,211,238,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: { color: COLORS.muted, textAlign: "center", fontSize: 16 },
  benefitsContainer: { gap: 16, marginBottom: 32 },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(34,211,238,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  benefitText: { flex: 1 },
  benefitTitle: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  benefitDescription: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  pricingCard: { borderRadius: 24, overflow: "hidden", marginBottom: 24 },
  gradient: { padding: 24 },
  pricingContent: { alignItems: "center" },
  pricingLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  pricingAmount: { color: COLORS.white, fontSize: 48, fontWeight: "bold" },
  pricingNote: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 },
  purchaseButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  purchaseText: { color: COLORS.background, fontWeight: "bold", fontSize: 18 },
  linksContainer: { alignItems: "center", gap: 12 },
  restoreText: { color: COLORS.primary, fontWeight: "500" },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  termsText: { color: COLORS.muted, fontSize: 14 },
  dot: { width: 4, height: 4, backgroundColor: COLORS.muted, borderRadius: 2 },
});
