import React from "react";
import { render } from "@testing-library/react-native";

// Component under test
import ChatBubble from "../../../../src/components/chat/ChatBubble";
// Tokens for color expectations
import tokens from "../../../../src/theme/tokens";

// Mock ThemeContext to keep theme deterministic for tests (light mode)
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// Helper to flatten a style prop (which can be nested arrays/objects)
function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => Object.assign(acc, flattenStyle(s)), {});
  }
  return { ...style };
}

describe("ChatBubble component", () => {
  it("renders message text", () => {
    const { getByText } = render(
      <ChatBubble message="Hello world" isUser={true} />
    );
    expect(getByText("Hello world")).toBeTruthy();
  });

  it("aligns user message to the right (flex-end)", () => {
    const { toJSON } = render(
      <ChatBubble message="Right aligned" isUser={true} />
    );

    const tree: any = toJSON();
    // Root container view has alignItems based on isUser
    const containerStyle = flattenStyle(tree.props.style);
    expect(containerStyle.alignItems).toBe("flex-end");
  });

  it("aligns AI message to the left (flex-start)", () => {
    const { toJSON } = render(
      <ChatBubble message="Left aligned" isUser={false} />
    );

    const tree: any = toJSON();
    const containerStyle = flattenStyle(tree.props.style);
    expect(containerStyle.alignItems).toBe("flex-start");
  });

  it("renders timestamp with 12-hour AM/PM formatting", () => {
    // 13:05 -> 1:05 PM
    const ts = new Date(2025, 0, 15, 13, 5, 0);
    const { getByText } = render(
      <ChatBubble message="Timed" isUser={true} timestamp={ts} />
    );
    expect(getByText("1:05 PM")).toBeTruthy();
  });

  it("applies correct bubble background and text color for user message", () => {
    const { toJSON, getByText } = render(
      <ChatBubble message="User text" isUser={true} />
    );

    const tree: any = toJSON();
    // children[0] is the bubble View; children[1] (optional) is timestamp
    const bubble = tree.children[0];
    const bubbleStyle = flattenStyle(bubble.props.style);

    const expectedBubbleColor = tokens.colors.light.chat.userBubble;
    expect(bubbleStyle.backgroundColor).toBe(expectedBubbleColor);

    // Inside bubble, first child is Text with message
    const messageTextNode = bubble.children.find(
      (child: any) => child.type === "Text" && child.children?.[0] === "User text"
    );
    const msgStyle = flattenStyle(messageTextNode.props.style);
    const expectedTextColor = tokens.colors.light.chat.userText;
    expect(msgStyle.color).toBe(expectedTextColor);
  });

  it("applies correct bubble background and text color for AI message", () => {
    const { toJSON } = render(<ChatBubble message="AI text" isUser={false} />);

    const tree: any = toJSON();
    const bubble = tree.children[0];
    const bubbleStyle = flattenStyle(bubble.props.style);

    const expectedBubbleColor = tokens.colors.light.chat.aiBubble;
    expect(bubbleStyle.backgroundColor).toBe(expectedBubbleColor);

    const messageTextNode = bubble.children.find(
      (child: any) => child.type === "Text" && child.children?.[0] === "AI text"
    );
    const msgStyle = flattenStyle(messageTextNode.props.style);
    const expectedTextColor = tokens.colors.light.chat.aiText;
    expect(msgStyle.color).toBe(expectedTextColor);
  });

  it("does not render timestamp when not provided", () => {
    const { toJSON, queryByText } = render(
      <ChatBubble message="No time" isUser={false} />
    );
    const tree: any = toJSON();

    // With no timestamp, container should only have the bubble (no second text element)
    // We can also ensure that no AM/PM-looking string appears.
    // Since exact string is unknown, we just confirm there's only one child (the bubble).
    expect(tree.children.length).toBe(1);
    expect(queryByText(/AM|PM/i)).toBeNull();
  });
});
