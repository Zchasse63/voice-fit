import React from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Component under test
import ChatInput from "../../../../src/components/chat/ChatInput";
import tokens from "../../../../src/theme/tokens";

// Mock ThemeContext to keep theme deterministic for tests (light mode)
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// Helper: flatten possibly nested style arrays into a single object
function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => Object.assign(acc, flattenStyle(s)), {});
  }
  return { ...style };
}

describe("ChatInput component", () => {
  it("renders placeholder and calls onChangeText when typing", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <ChatInput
        value=""
        onChangeText={onChangeText}
        onSend={() => {}}
        placeholder="Type a message..."
      />
    );

    const input = getByPlaceholderText("Type a message...");
    expect(input).toBeTruthy();

    fireEvent.changeText(input, "Hello");
    expect(onChangeText).toHaveBeenCalledWith("Hello");
  });

  it("does not call onSend when value is empty", () => {
    const onSend = jest.fn();
    const { UNSAFE_getByType } = render(
      <ChatInput value="" onChangeText={() => {}} onSend={onSend} />
    );

    const sendButton = UNSAFE_getByType(Pressable);
    fireEvent.press(sendButton);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend when value is only whitespace", () => {
    const onSend = jest.fn();
    const { UNSAFE_getByType } = render(
      <ChatInput value={"   "} onChangeText={() => {}} onSend={onSend} />
    );

    const sendButton = UNSAFE_getByType(Pressable);
    fireEvent.press(sendButton);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onSend when value is non-empty and not loading/disabled", () => {
    const onSend = jest.fn();
    const { UNSAFE_getByType } = render(
      <ChatInput value={"Hello"} onChangeText={() => {}} onSend={onSend} />
    );

    const sendButton = UNSAFE_getByType(Pressable);
    fireEvent.press(sendButton);
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("send button background uses accent.blue when enabled, secondary when disabled", () => {
    // Enabled state (non-empty value)
    const { UNSAFE_getByType, unmount } = render(
      <ChatInput value={"Hi"} onChangeText={() => {}} onSend={() => {}} />
    );
    const sendEnabled = UNSAFE_getByType(Pressable);
    const enabledStyle = flattenStyle(sendEnabled.props.style);
    expect(enabledStyle.backgroundColor).toBe(tokens.colors.light.accent.blue);
    unmount();

    // Disabled state (empty value)
    const { UNSAFE_getByType: getByTypeDisabled } = render(
      <ChatInput value={""} onChangeText={() => {}} onSend={() => {}} />
    );
    const sendDisabled = getByTypeDisabled(Pressable);
    const disabledStyle = flattenStyle(sendDisabled.props.style);
    expect(disabledStyle.backgroundColor).toBe(
      tokens.colors.light.background.secondary
    );
  });

  it("TextInput is not editable and send disabled when disabled=true", () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, UNSAFE_getByType } = render(
      <ChatInput
        value={"Hello"}
        onChangeText={() => {}}
        onSend={onSend}
        disabled
        placeholder="Type a message..."
      />
    );

    const input = getByPlaceholderText("Type a message...");
    expect((input as any).props.editable).toBe(false);

    const sendButton = UNSAFE_getByType(Pressable);
    expect(sendButton.props.disabled).toBe(true);

    fireEvent.press(sendButton);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("TextInput is not editable, shows ActivityIndicator, and send disabled when loading=true", () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, UNSAFE_getByType, UNSAFE_getByType: getByType } =
      render(
        <ChatInput
          value={"Hello"}
          onChangeText={() => {}}
          onSend={onSend}
          loading
          placeholder="Type a message..."
        />
      );

    const input = getByPlaceholderText("Type a message...");
    expect((input as any).props.editable).toBe(false);

    const sendButton = UNSAFE_getByType(Pressable);
    expect(sendButton.props.disabled).toBe(true);

    // ActivityIndicator should be present inside send button
    const indicator = getByType(ActivityIndicator);
    expect(indicator).toBeTruthy();

    fireEvent.press(sendButton);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("respects multiline input and maxLength without crashing", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <ChatInput
        value={""}
        onChangeText={onChangeText}
        onSend={() => {}}
        placeholder="Type a message..."
      />
    );
    const input = getByPlaceholderText("Type a message...");
    // Multiline/maxlength assertions using props
    expect((input as any).props.multiline).toBe(true);
    expect((input as any).props.maxLength).toBe(1000);
  });
});
