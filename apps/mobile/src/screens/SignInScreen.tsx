/**
 * SignInScreen
 *
 * Authentication screen with SSO (Apple, Google) and email/password fallback.
 * Clean, MacroFactor-inspired design with proper validation and error handling.
 */

import React, { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { Button, Input } from "../components/ui";
import { SSOButton, AuthContainer, ErrorMessage } from "../components/auth";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { useAuthStore } from "../store/auth.store";

export default function SignInScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<"apple" | "google" | null>(null);

  // Email/password sign in
  const handleEmailSignIn = async () => {
    // Validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      // Navigation handled by auth state change
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apple SSO sign in
  const handleAppleSignIn = async () => {
    setSsoLoading("apple");
    setError("");

    try {
      // TODO: Implement Apple SSO flow
      // await signInWithSSO('apple');
      Alert.alert(
        "Apple Sign In",
        "Apple SSO will be implemented with backend configuration",
      );
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Apple");
    } finally {
      setSsoLoading(null);
    }
  };

  // Google SSO sign in
  const handleGoogleSignIn = async () => {
    setSsoLoading("google");
    setError("");

    try {
      // TODO: Implement Google SSO flow
      // await signInWithSSO('google');
      Alert.alert(
        "Google Sign In",
        "Google SSO will be implemented with backend configuration",
      );
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setSsoLoading(null);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  return (
    <AuthContainer
      title="Welcome Back"
      subtitle="Sign in to continue your fitness journey"
    >
      {/* SSO Buttons */}
      <SSOButton
        provider="apple"
        onPress={handleAppleSignIn}
        loading={ssoLoading === "apple"}
      />

      <SSOButton
        provider="google"
        onPress={handleGoogleSignIn}
        loading={ssoLoading === "google"}
      />

      {/* Divider */}
      <View style={styles.divider}>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border.light }]}
        />
        <Text
          style={[
            styles.dividerText,
            {
              color: colors.text.tertiary,
              fontSize: tokens.typography.fontSize.sm,
            },
          ]}
        >
          or
        </Text>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border.light }]}
        />
      </View>

      {/* Error Message */}
      {error && <ErrorMessage message={error} type="error" />}

      {/* Email Input */}
      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
      />

      {/* Password Input */}
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="password"
      />

      {/* Forgot Password Link */}
      <Pressable
        onPress={handleForgotPassword}
        style={styles.forgotPasswordContainer}
      >
        <Text
          style={[
            styles.forgotPasswordText,
            {
              color: colors.accent.blue,
              fontSize: tokens.typography.fontSize.sm,
            },
          ]}
        >
          Forgot password?
        </Text>
      </Pressable>

      {/* Sign In Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onPress={handleEmailSignIn}
      >
        Sign In
      </Button>

      {/* Sign Up Link */}
      <View style={styles.signUpContainer}>
        <Text
          style={[
            styles.signUpText,
            {
              color: colors.text.secondary,
              fontSize: tokens.typography.fontSize.sm,
            },
          ]}
        >
          Don't have an account?{" "}
        </Text>
        <Pressable onPress={handleSignUp}>
          <Text
            style={[
              styles.signUpLink,
              {
                color: colors.accent.blue,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
              },
            ]}
          >
            Sign Up
          </Text>
        </Pressable>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: tokens.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: tokens.spacing.md,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: tokens.spacing.lg,
  },
  forgotPasswordText: {
    // Dynamic styles applied inline
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: tokens.spacing.lg,
  },
  signUpText: {
    // Dynamic styles applied inline
  },
  signUpLink: {
    // Dynamic styles applied inline
  },
});
