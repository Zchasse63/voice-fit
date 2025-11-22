import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { ThemeProvider } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";

import LoadingSpinner from "./src/components/common/LoadingSpinner";

import { useAuthStore } from "./src/store/auth.store";
import { syncService } from "./src/services/sync/SyncService";
import { AnalyticsService } from "./src/services/analytics/AnalyticsService";
import "./global.css";

export default function App() {
  const user = useAuthStore((state) => state.user);
  const checkSession = useAuthStore((state) => state.checkSession);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  const navigationRef = React.useRef<NavigationContainerRef<any> | null>(null);
  const routeNameRef = React.useRef<string | null>(null);

  // Initialize analytics once on app mount
  useEffect(() => {
    AnalyticsService.initialize();
  }, []);

  // Keep Amplitude user identity in sync with auth state
  useEffect(() => {
    if (user?.id) {
      AnalyticsService.setUserId(user.id);
    } else {
      AnalyticsService.setUserId(null);
    }
  }, [user?.id]);

  // Check for existing session on mount
  useEffect(() => {
    checkSession().finally(() => setIsCheckingAuth(false));
  }, []);

  // Start background sync when user is authenticated
  useEffect(() => {
    if (user?.id) {
      console.log("🔄 Starting background sync for user:", user.id);
      syncService.startBackgroundSync(user.id);

      return () => {
        console.log("🛑 Stopping background sync");
        syncService.stopBackgroundSync();
      };
    }
    return undefined;
  }, [user?.id]);

  return (
    <ThemeProvider>
      {isCheckingAuth ? (
        <LoadingSpinner message="Loading..." fullScreen />
      ) : (
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            const currentRoute = navigationRef.current?.getCurrentRoute();
            if (currentRoute?.name) {
              routeNameRef.current = currentRoute.name;
              AnalyticsService.logEvent("screen_view", {
                screen_name: currentRoute.name,
              });
            }
          }}
          onStateChange={() => {
            const currentRoute = navigationRef.current?.getCurrentRoute();
            const currentName = currentRoute?.name;
            if (!currentName || routeNameRef.current === currentName) return;
            routeNameRef.current = currentName;
            AnalyticsService.logEvent("screen_view", {
              screen_name: currentName,
            });
          }}
        >
          {!user ? <AuthNavigator /> : <RootNavigator />}
        </NavigationContainer>
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
