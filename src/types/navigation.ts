import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Focus: undefined;
  Paywall: undefined;
  Settings: undefined;
};

export type OnboardingScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Onboarding"
>;

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Home"
>;

export type FocusScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Focus"
>;

export type PaywallScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Paywall"
>;

export type SettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Settings"
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
