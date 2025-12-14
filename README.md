# 🫁 Nefes Koçu (Breath Coach)

A modern, feature-rich breathing exercise app built with React Native and Expo SDK 54. Designed to help users reduce stress, improve focus, and build healthy breathing habits.

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey)

## ✨ Features

### 🌬️ Breathing Exercises

- **9 Scientifically-backed breathing patterns**
  - 4-7-8 Relaxing Breath
  - Box Breathing (4-4-4-4)
  - Energizing Breath
  - Sleep Breath
  - Focus Breath
  - Calming Breath
  - And more...
- **Animated breathing circle** with smooth Reanimated animations
- **Haptic feedback** on phase transitions (optional)
- **Round tracking** with customizable target rounds

### ⏱️ Focus Timer

- Customizable focus duration (5-60 minutes)
- Beautiful ambient gradient animations
- Session completion stats
- Motivational messages

### 🎵 Background Sounds

- **9 ambient sounds** across 3 categories:
  - 🌲 **Nature**: Rain, Ocean Waves, Sea Waves, Forest, Forest Birds, Fireplace
  - 🏙️ **City & Life**: Train Journey
  - 🧘 **Zen & Music**: Tibetan Bowls, Wind Chimes
- **Mix multiple sounds** simultaneously
- **Individual volume control** (5 levels)
- **Master volume & mute** controls
- **Floating sound button** on Home and Focus screens
- Sounds persist across sessions

### 🔔 Smart Reminders

- Daily or custom day scheduling
- Time picker for precise scheduling
- Local push notifications
- iOS and Android support

### 🌍 Multi-Language Support

- 🇹🇷 Turkish (Türkçe)
- 🇺🇸 English
- Dynamic language switching

### 📊 Progress Tracking

- Daily streak counter
- Session history
- Motivational achievements

### ⚙️ Customization

- Haptic feedback toggle
- Reminder scheduling
- Language selection
- Sound preferences
- Theme (Dark mode)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator or Expo Go app

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/atakandgn/NefesKocu.git
   cd NefesKocu
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app

### Development Build (Recommended for full features)

For full notification support and native features:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 🏗️ Project Structure

```
NefesKocu/
├── App.tsx                     # App entry point
├── index.ts                    # Expo entry
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── babel.config.js             # Babel config
│
├── assets/
│   └── sounds/                 # Audio files (.mp3)
│       ├── rain.mp3
│       ├── ocean_waves.mp3
│       ├── forest.mp3
│       └── ...
│
├── src/
│   ├── components/
│   │   ├── BreathingCircle.tsx     # Animated breathing visualization
│   │   ├── SoundMixer.tsx          # Background sounds mixer
│   │   ├── FloatingSoundButton.tsx # Quick sound access button
│   │   ├── SessionControls.tsx     # Session control buttons
│   │   └── BannerAdPlaceholder.tsx # Ad placeholder
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Main breathing screen
│   │   ├── FocusScreen.tsx         # Focus timer screen
│   │   ├── SettingsScreen.tsx      # Settings & preferences
│   │   ├── PaywallScreen.tsx       # Pro upgrade screen
│   │   └── OnboardingScreen.tsx    # First-time user flow
│   │
│   ├── context/
│   │   ├── SettingsContext.tsx     # App settings state
│   │   └── SoundContext.tsx        # Sound playback state
│   │
│   ├── hooks/
│   │   ├── useBreathingSession.ts  # Breathing logic hook
│   │   ├── useStreak.ts            # Streak tracking hook
│   │   └── useTranslation.ts       # i18n hook
│   │
│   ├── i18n/
│   │   ├── index.ts                # i18n exports
│   │   └── translations/
│   │       ├── tr.ts               # Turkish translations
│   │       └── en.ts               # English translations
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Navigation setup
│   │
│   ├── services/
│   │   └── NotificationService.ts  # Push notifications
│   │
│   └── types/
│       └── navigation.ts           # TypeScript types
│
└── docs/                           # Documentation
```

## 🛠️ Tech Stack

| Category      | Technology                                |
| ------------- | ----------------------------------------- |
| Framework     | React Native 0.81.5                       |
| Platform      | Expo SDK 54                               |
| Language      | TypeScript 5.9                            |
| Navigation    | React Navigation 7                        |
| Animations    | React Native Reanimated 4                 |
| Audio         | expo-av                                   |
| Haptics       | expo-haptics                              |
| Notifications | expo-notifications                        |
| Storage       | @react-native-async-storage/async-storage |
| Icons         | lucide-react-native                       |
| Styling       | NativeWind (TailwindCSS)                  |

## 📦 Key Dependencies

```json
{
  "expo": "~54.0.0",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo-av": "~16.0.8",
  "expo-haptics": "~15.0.8",
  "expo-notifications": "~0.32.15",
  "react-native-reanimated": "~4.1.1",
  "@react-navigation/native": "^7.1.0",
  "@react-navigation/native-stack": "^7.3.0"
}
```

## 🌐 Internationalization (i18n)

The app supports multiple languages with a custom i18n system:

```typescript
// Usage in components
import { useTranslation } from "../hooks";

function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t.home.focus}</Text>;
}
```

### Adding a New Language

1. Create a new translation file in `src/i18n/translations/`:

   ```typescript
   // src/i18n/translations/de.ts
   export const de = {
     common: {
       cancel: "Abbrechen",
       save: "Speichern",
       // ...
     },
     // ... rest of translations
   };
   ```

2. Update `SettingsContext.tsx` to include the new language:
   ```typescript
   export const LANGUAGES = {
     tr: { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
     en: { name: "English", nativeName: "English", flag: "🇺🇸" },
     de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" }, // Add this
   };
   ```

## 🔔 Notifications

The app uses local scheduled notifications for reminders:

```typescript
// Schedule a reminder
await scheduleReminderNotifications(
  {
    enabled: true,
    frequency: "daily",
    selectedDays: [1, 2, 3, 4, 5], // Mon-Fri
    hour: 9,
    minute: 0,
  },
  {
    title: t.notifications.reminderTitle,
    body: t.notifications.reminderBody,
  }
);
```

> **Note**: Push notifications require a development build. They don't work in Expo Go for SDK 53+.

## 🎨 Theming

The app uses a dark theme by default:

```typescript
const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceLight: "#2E2E2E",
  primary: "#22d3ee", // Cyan
  secondary: "#4ade80", // Green
  accent: "#a78bfa", // Purple
  muted: "#6b7280", // Gray
  white: "#FFFFFF",
};
```

## 🔧 Configuration

### app.json

Key configuration options:

```json
{
  "expo": {
    "name": "NefesKocu",
    "slug": "NefesKocu",
    "newArchEnabled": true,
    "plugins": [
      "expo-asset",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#22d3ee"
        }
      ]
    ]
  }
}
```

## 📄 Legal

- **Terms of Use**: Available in Settings → Terms of Use
- **Privacy Policy**: Available in Settings → Privacy Policy

Both documents are available in Turkish and English.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Atakan Doğan**

- GitHub: [@atakandgn](https://github.com/atakandgn)

## 🙏 Acknowledgments

- Breathing techniques based on scientific research
- Sound assets from royalty-free sources
- Icons by [Lucide](https://lucide.dev/)

---

<p align="center">
  Made with ❤️ for better breathing
</p>
