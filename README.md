# USBGF App

A polished mobile app for the US Backgammon Federation community.

## Features

- **Splash Screen**: Animated logo with routing logic
- **Onboarding**: Carousel with 3 slides and persistence
- **Authentication**: Sign in with email/password and OAuth (Apple, Google)
- **Legal Pages**: Privacy Policy and Terms of Service webviews
- **Modern Design**: Clean, premium UI with smooth animations

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- React Native Reanimated
- AsyncStorage for persistence

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Project Structure

```
app/
├── assets/                 # Images and static assets
│   ├── USBGF_com_logo.png
│   └── onboarding/         # Onboarding slide images
├── components/             # Reusable UI components
│   ├── Button.tsx
│   ├── TextField.tsx
│   ├── OAuthButton.tsx
│   ├── AuthDivider.tsx
│   └── Dots.tsx
├── navigation/             # Navigation configuration
│   └── index.tsx
├── screens/                # App screens
│   ├── SplashScreen.tsx
│   ├── OnboardingCarousel.tsx
│   ├── SignInScreen.tsx
│   ├── LegalWebview.tsx
│   └── HomePlaceholderScreen.tsx
├── storage/                # Data persistence utilities
│   └── flags.ts
└── theme/                  # Design tokens
    └── tokens.ts
```

## Design System

The app uses a design system derived from the USBGF logo:

- **Primary Color**: Dark blue (#1A1A2E) from logo
- **Accent Color**: Red (#DC2626) from logo elements
- **Typography**: System fonts with clear hierarchy
- **Spacing**: 4px base unit scale
- **Radius**: 14px for cards, 24px for buttons

## Navigation Flow

1. **Splash** → Checks onboarding status
2. **Onboarding** → First-time user experience
3. **Sign In** → Authentication screen
4. **Home Placeholder** → Main app (placeholder)

## Features Implemented

✅ Splash screen with logo animation  
✅ Onboarding carousel with persistence  
✅ Sign in form with validation  
✅ OAuth buttons (Apple, Google)  
✅ Legal webview screens  
✅ Responsive design  
✅ Accessibility support  
✅ Dark mode support  
✅ Smooth animations  

## Next Steps

- Implement actual authentication backend
- Add membership management screens
- Build event calendar
- Create match tracking features
- Add community features
