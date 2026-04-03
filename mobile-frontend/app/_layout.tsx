import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(session: any, isReady: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't navigate until everything is ready
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth group
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // Redirect to tabs if authenticated and in auth group
      router.replace("/(tabs)");
    }
  }, [session, segments, isReady]);
}

export const unstable_settings = {
  initialRouteName: "(auth)/login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    "PlusJakartaSans-Regular": PlusJakartaSans_400Regular,
    "PlusJakartaSans-Medium": PlusJakartaSans_500Medium,
    "PlusJakartaSans-SemiBold": PlusJakartaSans_600SemiBold,
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
    "PlusJakartaSans-ExtraBold": PlusJakartaSans_800ExtraBold,
  });

  // Wait for both fonts and auth to be ready
  useEffect(() => {
    if (fontsLoaded && !loading) {
      setAppIsReady(true);
    }
  }, [fontsLoaded, loading]);

  // Handle auth-based navigation only when app is ready
  useProtectedRoute(session, appIsReady);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/new"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
