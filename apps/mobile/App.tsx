import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoadingSpinner from "./src/components/common/LoadingSpinner";
import { useOnboarding } from "./src/hooks/useOnboarding";
import { useAuthStore } from "./src/store/auth.store";
import { syncService } from "./src/services/sync/SyncService";
import "./global.css";

export default function App() {
  const {
    hasCompletedOnboarding,
    isLoading: onboardingLoading,
    completeOnboarding,
  } = useOnboarding();
  const user = useAuthStore((state) => state.user);
  const checkSession = useAuthStore((state) => state.checkSession);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

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
  }, [user?.id]);

  return (
    <ThemeProvider>
      {onboardingLoading || isCheckingAuth ? (
        <LoadingSpinner message="Loading..." fullScreen />
      ) : !hasCompletedOnboarding ? (
        <OnboardingScreen onComplete={completeOnboarding} />
      ) : !user ? (
        <AuthNavigator />
      ) : (
        <RootNavigator />
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
