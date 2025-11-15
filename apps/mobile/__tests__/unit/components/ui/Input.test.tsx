import React from "react";
import { View, Pressable } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Component under test
import Input from "../../../../src/components/ui/Input";

// Mock ThemeContext to provide deterministic colors
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

describe("Input component", () => {
  it("renders label and placeholder, and calls onChangeText", () => {
    const onChangeText = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <Input
        label="Email"
        placeholder="Enter email"
        value=""
        onChangeText={onChangeText}
        type="email"
      />
    );

    // Label appears
    expect(getByText("Email")).toBeTruthy();

    // Placeholder appears
    const input = getByPlaceholderText("Enter email");
    expect(input).toBeTruthy();

    // onChangeText called when typing
    fireEvent.changeText(input, "test@example.com");
    expect(onChangeText).toHaveBeenCalledWith("test@example.com");
  });

  it("uses correct keyboardType for email and number, default otherwise", () => {
    const { getByPlaceholderText, rerender } = render(
      <Input
        placeholder="Email"
        value=""
        onChangeText={() => {}}
        type="email"
      />
    );
    const emailInput = getByPlaceholderText("Email");
    expect((emailInput as any).props.keyboardType).toBe("email-address");

    rerender(
      <Input
        placeholder="Amount"
        value=""
        onChangeText={() => {}}
        type="number"
      />
    );
    const numberInput = getByPlaceholderText("Amount");
    expect((numberInput as any).props.keyboardType).toBe("number-pad");

    rerender(
      <Input
        placeholder="Text"
        value=""
        onChangeText={() => {}}
        type="text"
      />
    );
    const textInput = getByPlaceholderText("Text");
    expect((textInput as any).props.keyboardType).toBe("default");
  });

  it("respects disabled prop (TextInput editable=false)", () => {
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Disabled"
        value=""
        onChangeText={() => {}}
        disabled
      />
    );
    const input = getByPlaceholderText("Disabled");
    expect((input as any).props.editable).toBe(false);
  });

  it("shows error text when error provided and hides helperText", () => {
    const { getByText, queryByText, rerender } = render(
      <Input
        placeholder="Email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        helperText="We will never share your email"
      />
    );

    // Error should have priority and be visible
    expect(getByText("Invalid email")).toBeTruthy();

    // Helper text should not show when error is present
    expect(queryByText("We will never share your email")).toBeNull();

    // When error removed, helper text should render
    rerender(
      <Input
        placeholder="Email"
        value=""
        onChangeText={() => {}}
        helperText="We will never share your email"
      />
    );
    expect(getByText("We will never share your email")).toBeTruthy();
  });

  it("renders left and right icons for non-password input", () => {
    const { getByTestId } = render(
      <Input
        placeholder="Name"
        value=""
        onChangeText={() => {}}
        type="text"
        leftIcon={<View testID="left-icon" />}
        rightIcon={<View testID="right-icon" />}
      />
    );

    expect(getByTestId("left-icon")).toBeTruthy();
    expect(getByTestId("right-icon")).toBeTruthy();
  });

  it("does not render right icon when type is password", () => {
    const { queryByTestId } = render(
      <Input
        placeholder="Password"
        value=""
        onChangeText={() => {}}
        type="password"
        leftIcon={<View testID="left-icon" />}
        rightIcon={<View testID="right-icon-should-not-appear" />}
      />
    );

    // Left icon can still render if provided
    expect(queryByTestId("left-icon")).toBeTruthy();
    // Right icon should be suppressed for password type
    expect(queryByTestId("right-icon-should-not-appear")).toBeNull();
  });

  it("password: secureTextEntry toggles when pressing visibility icon", () => {
    const { getByPlaceholderText, UNSAFE_getByType } = render(
      <Input
        placeholder="Password"
        value="secret"
        onChangeText={() => {}}
        type="password"
      />
    );

    const pwdInput = getByPlaceholderText("Password");
    // Initially secure
    expect((pwdInput as any).props.secureTextEntry).toBe(true);

    // The only Pressable inside Input for password is the toggle
    const toggle = UNSAFE_getByType(Pressable);
    fireEvent.press(toggle);

    // After toggle, secure should be false (visible)
    expect((pwdInput as any).props.secureTextEntry).toBe(false);

    // Toggling back
    fireEvent.press(toggle);
    expect((pwdInput as any).props.secureTextEntry).toBe(true);
  });

  it("autoCapitalize is none for email and sentences by default for text", () => {
    const { getByPlaceholderText, rerender } = render(
      <Input
        placeholder="Email"
        value=""
        onChangeText={() => {}}
        type="email"
      />
    );
    const emailInput = getByPlaceholderText("Email");
    expect((emailInput as any).props.autoCapitalize).toBe("none");

    rerender(
      <Input
        placeholder="Any"
        value=""
        onChangeText={() => {}}
        type="text"
      />
    );
    const anyInput = getByPlaceholderText("Any");
    expect((anyInput as any).props.autoCapitalize).toBe("sentences");
  });

  it("respects explicit autoCapitalize and autoComplete props", () => {
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Custom"
        value=""
        onChangeText={() => {}}
        type="text"
        autoCapitalize="words"
        autoComplete="name"
      />
    );
    const input = getByPlaceholderText("Custom");
    expect((input as any).props.autoCapitalize).toBe("words");
    expect((input as any).props.autoComplete).toBe("name");
  });
});
