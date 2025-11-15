import React from "react";
import { render } from "@testing-library/react-native";

// Component under test
import ErrorMessage from "../../../../src/components/auth/ErrorMessage";
// Tokens to assert color resolutions
import tokens from "../../../../src/theme/tokens";

// Mock ThemeContext to keep theme deterministic (light mode)
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

describe("ErrorMessage component", () => {
  it("renders the provided message text", () => {
    const { getByText } = render(
      <ErrorMessage message="Something went wrong" type="error" />
    );
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("defaults to type 'error' when not provided", () => {
    const { toJSON } = render(<ErrorMessage message="Default error" />);
    const tree: any = toJSON();
    // Root container style should include error color decorations
    const rootStyle = flattenStyle(tree.props.style);

    const expectedColor = tokens.colors.light.accent.red;
    expect(rootStyle.borderLeftColor).toBe(expectedColor);
    // Background color uses 15% opacity suffix
    expect(rootStyle.backgroundColor).toBe(`${expectedColor}15`);
  });

  it("applies error styling (red border and tinted background) for type='error'", () => {
    const { toJSON, getByText } = render(
      <ErrorMessage message="Error state" type="error" />
    );
    expect(getByText("Error state")).toBeTruthy();

    const tree: any = toJSON();
    const rootStyle = flattenStyle(tree.props.style);

    const expectedColor = tokens.colors.light.accent.red;
    expect(rootStyle.borderLeftColor).toBe(expectedColor);
    expect(rootStyle.backgroundColor).toBe(`${expectedColor}15`);
  });

  it("applies warning styling (orange border and tinted background) for type='warning'", () => {
    const { toJSON, getByText } = render(
      <ErrorMessage message="Warning state" type="warning" />
    );
    expect(getByText("Warning state")).toBeTruthy();

    const tree: any = toJSON();
    const rootStyle = flattenStyle(tree.props.style);

    const expectedColor = tokens.colors.light.accent.orange;
    expect(rootStyle.borderLeftColor).toBe(expectedColor);
    expect(rootStyle.backgroundColor).toBe(`${expectedColor}15`);
  });

  it("applies info styling (blue border and tinted background) for type='info'", () => {
    const { toJSON, getByText } = render(
      <ErrorMessage message="Info state" type="info" />
    );
    expect(getByText("Info state")).toBeTruthy();

    const tree: any = toJSON();
    const rootStyle = flattenStyle(tree.props.style);

    const expectedColor = tokens.colors.light.accent.blue;
    expect(rootStyle.borderLeftColor).toBe(expectedColor);
    expect(rootStyle.backgroundColor).toBe(`${expectedColor}15`);
  });
});
