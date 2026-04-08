import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "QuidSafe",
  slug: "quidsafe",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "quidsafe",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "uk.co.quidsafe.app",
    buildNumber: "1",
    infoPlist: {
      NSCameraUsageDescription:
        "QuidSafe needs camera access to scan receipts for expense tracking.",
      NSFaceIDUsageDescription:
        "QuidSafe uses Face ID to securely access your financial data.",
      CFBundleAllowMixedLocalizations: true,
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: "uk.co.quidsafe.app",
    versionCode: 1,
    edgeToEdgeEnabled: true,
    permissions: ["INTERNET", "CAMERA"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
    name: "QuidSafe - Tax Tracking for UK Sole Traders",
    shortName: "QuidSafe",
    description:
      "Connect your bank, auto-categorise expenses, and know exactly what to set aside for HMRC. The smart tax tracker for UK sole traders.",
    themeColor: "#000000",
    backgroundColor: "#000000",
    lang: "en-GB",
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787",
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    eas: {
      projectId: "",
    },
  },
});
