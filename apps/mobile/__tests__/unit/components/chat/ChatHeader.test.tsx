import React from "react";
import { Pressable } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Component under test
import ChatHeader from "../../../../src/components/chat/ChatHeader";

// Mock ThemeContext to keep theme deterministic (light mode)
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// Mock Avatar component exported from ../profile to a simple identifiable element
jest.mock("../../../../src/components/profile", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Avatar = (props: any) => React.createElement(Text, { testID: "mock-avatar", ...props }, "AV");
  return { Avatar };
});

describe("ChatHeader component", () => {
  it("renders the provided title", () => {
    const { getByText } = render(
      <ChatHeader title="Coach" onBack={() => {}} />
    );
    expect(getByText("Coach")).toBeTruthy();
  });

  it("calls onBack when the back button is pressed", () => {
    const onBack = jest.fn();
    const { UNSAFE_getByType } = render(
      <ChatHeader title="Chat" onBack={onBack} />
    );

    // With no avatar, there is a single Pressable (the back button)
    const backPressable = UNSAFE_getByType(Pressable);
    fireEvent.press(backPressable);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders avatar when onAvatarPress is provided and calls its handler when pressed", () => {
    const onBack = jest.fn();
    const onAvatarPress = jest.fn();

    const { getByTestId, UNSAFE_getAllByType } = render(
      <ChatHeader
        title="Chat"
        onBack={onBack}
        onAvatarPress={onAvatarPress}
      />
    );

    // Avatar should be rendered (mocked)
    expect(getByTestId("mock-avatar")).toBeTruthy();

    // There are two Pressables now: [0] back, [1] avatar
    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBe(2);

    // Press the avatar wrapper
    fireEvent.press(pressables[1]);
    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });

  it("does not render avatar when onAvatarPress is not provided", () => {
    const { queryByTestId } = render(
      <ChatHeader title="Chat" onBack={() => {}} />
    );
    expect(queryByTestId("mock-avatar")).toBeNull();
  });

  it("back button remains first even when avatarPress is present", () => {
    const onBack = jest.fn();
    const onAvatarPress = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <ChatHeader
        title="Header"
        onBack={onBack}
        onAvatarPress={onAvatarPress}
      />
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    // First pressable is back button
    fireEvent.press(pressables[0]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
