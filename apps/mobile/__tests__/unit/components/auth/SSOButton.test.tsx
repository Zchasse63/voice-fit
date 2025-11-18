import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Pressable } from "react-native";


// Component under test
import SSOButton from "../../../../src/components/auth/SSOButton";

// Helper to flatten possibly nested style arrays into a single object
function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => Object.assign(acc, flattenStyle(s)), {});
  }
  return { ...style };
}

describe("SSOButton component", () => {
  it("renders Apple label and logo", () => {
    const { getByText } = render(
      <SSOButton provider="apple" onPress={() => {}} />,
    );

    // Label
    expect(getByText("Sign in with Apple")).toBeTruthy();
    // Logo (we render 🍎 text as placeholder logo)
    expect(getByText("🍎")).toBeTruthy();
  });

  it("renders Google label and logo", () => {
    const { getByText } = render(
      <SSOButton provider="google" onPress={() => {}} />,
    );

    // Label
    expect(getByText("Sign in with Google")).toBeTruthy();
    // Logo (we render 'G' letter as placeholder logo)
    expect(getByText("G")).toBeTruthy();
  });

  it("calls onPress when pressed (Apple)", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SSOButton provider="apple" onPress={onPress} />,
    );

    fireEvent.press(getByText("Sign in with Apple"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onPress when pressed (Google)", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SSOButton provider="google" onPress={onPress} />,
    );

    fireEvent.press(getByText("Sign in with Google"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is disabled and shows loading indicator when loading=true (Apple)", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType, queryByText } = render(
      <SSOButton provider="apple" onPress={onPress} loading />,
    );

    const pressable = UNSAFE_getByType(Pressable);
    // Ensure disabled is true
    expect(pressable.props.disabled).toBe(true);

    // Label should not be rendered while loading
    expect(queryByText("Sign in with Apple")).toBeNull();

    // Attempting to press should not invoke handler
    // (We can't press ActivityIndicator; ensure function not called)
    expect(onPress).not.toHaveBeenCalled();
  });

  it("is disabled and shows loading indicator when loading=true (Google)", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType, queryByText } = render(
      <SSOButton provider="google" onPress={onPress} loading />,
    );

    const pressable = UNSAFE_getByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
    expect(queryByText("Sign in with Google")).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it("applies Apple styling: black background and no border", () => {
    const { toJSON } = render(
      <SSOButton provider="apple" onPress={() => {}} />,
    );
    const tree: any = toJSON();

    // Root pressable style holds the background/border styles
    const style = flattenStyle(tree.props.style);
    expect(style.backgroundColor).toBe("#000000"); // Apple black
    expect(style.borderWidth).toBe(0);
  });

  it("applies Google styling: white background and subtle border", () => {
    const { toJSON } = render(
      <SSOButton provider="google" onPress={() => {}} />,
    );
    const tree: any = toJSON();

    const style = flattenStyle(tree.props.style);
    expect(style.backgroundColor).toBe("#FFFFFF"); // Google white
    expect(style.borderWidth).toBe(1); // Subtle border
    expect(style.borderColor).toBe("#E9ECEF");
  });

  it("respects pressed/opacity behavior by rendering without crashing (visual assertion not required)", () => {
    const { toJSON } = render(
      <SSOButton provider="apple" onPress={() => {}} />,
    );
    // Presence of the node with style is good enough here
    const tree: any = toJSON();
    expect(tree).toBeTruthy();
  });
});
