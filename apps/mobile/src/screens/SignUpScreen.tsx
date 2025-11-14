/**
 * SignUpScreen
 *
 * Registration screen with SSO (Apple, Google) and email/password signup.
 * Includes name, email, password, confirm password, and terms acceptance.
 */

import React, { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { Button, Input } from "../components/ui";
import { SSOButton, AuthContainer, ErrorMessage } from "../components/auth";
import tokens from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";
import { useAuthStore } from "../store/auth.store";

export default function SignUpScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  const signUp = useAuthStore((state) => state.signUp);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<"apple" | "google" | null>(null);

  // Email/password sign up
  const handleEmailSignUp = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signUp(email, password);
      // Navigation handled by auth state change
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apple SSO sign up
  const handleAppleSignUp = async () => {
    setSsoLoading("apple");
    setError("");

    try {
      // TODO: Implement Apple SSO flow
      // await signUpWithSSO('apple');
      Alert.alert(
        "Apple Sign Up",
        "Apple SSO will be implemented with backend configuration",
      );
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Apple");
    } finally {
      setSsoLoading(null);
    }
  };

  // Google SSO sign up
  const handleGoogleSignUp = async () => {
    setSsoLoading("google");
    setError("");

    try {
      // TODO: Implement Google SSO flow
      // await signUpWithSSO('google');
      Alert.alert(
        "Google Sign Up",
        "Google SSO will be implemented with backend configuration",
      );
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setSsoLoading(null);
    }
  };

  const handleSignIn = () => {
    navigation.navigate("SignIn");
  };

  const handleTermsPress = () => {
    // TODO: Navigate to terms screen or open in browser
    Alert.alert("Terms of Service", "Terms of Service will be displayed here");
  };

  const handlePrivacyPress = () => {
    // TODO: Navigate to privacy screen or open in browser
    Alert.alert("Privacy Policy", "Privacy Policy will be displayed here");
  };

  return (
    <AuthContainer
      title="Create Your Account"
      subtitle="Start your fitness journey today"
    >
      {/* SSO Buttons */}
      <SSOButton
        provider="apple"
        onPress={handleAppleSignUp}
        loading={ssoLoading === "apple"}
      />

      <SSOButton
        provider="google"
        onPress={handleGoogleSignUp}
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

      {/* Name Input */}
      <Input
        label="Full Name"
        type="text"
        placeholder="John Doe"
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />

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
        autoComplete="password-new"
        helperText="Must be at least 8 characters"
      />

      {/* Confirm Password Input */}
      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
        autoComplete="password-new"
      />

      {/* Terms Checkbox */}
      <Pressable
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        style={styles.termsContainer}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: agreedToTerms
                ? colors.accent.blue
                : colors.border.medium,
              backgroundColor: agreedToTerms
                ? colors.accent.blue
                : "transparent",
            },
          ]}
        >
          {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.termsTextContainer}>
          <Text
            style={[
              styles.termsText,
              {
                color: colors.text.secondary,
                fontSize: tokens.typography.fontSize.sm,
              },
            ]}
          >
            I agree to the{" "}
          </Text>
          <Pressable onPress={handleTermsPress}>
            <Text
              style={[
                styles.termsLink,
                {
                  color: colors.accent.blue,
                  fontSize: tokens.typography.fontSize.sm,
                },
              ]}
            >
              Terms of Service
            </Text>
          </Pressable>
          <Text
            style={[
              styles.termsText,
              {
                color: colors.text.secondary,
                fontSize: tokens.typography.fontSize.sm,
              },
            ]}
          >
            {" "}
            and{" "}
          </Text>
          <Pressable onPress={handlePrivacyPress}>
            <Text
              style={[
                styles.termsLink,
                {
                  color: colors.accent.blue,
                  fontSize: tokens.typography.fontSize.sm,
                },
              ]}
            >
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Sign Up Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onPress={handleEmailSignUp}
      >
        Create Account
      </Button>

      {/* Sign In Link */}
      <View style={styles.signInContainer}>
        <Text
          style={[
            styles.signInText,
            {
              color: colors.text.secondary,
              fontSize: tokens.typography.fontSize.sm,
            },
          ]}
        >
          Already have an account?{" "}
        </Text>
        <Pressable onPress={handleSignIn}>
          <Text
            style={[
              styles.signInLink,
              {
                color: colors.accent.blue,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
              },
            ]}
          >
            Sign In
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: tokens.spacing.sm,
    marginTop: 2,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  termsText: {
    lineHeight:
      tokens.typography.lineHeight.normal * tokens.typography.fontSize.sm,
  },
  termsLink: {
    textDecorationLine: "underline",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: tokens.spacing.lg,
  },
  signInText: {
    // Dynamic styles applied inline
  },
  signInLink: {
    // Dynamic styles applied inline
  },
});
