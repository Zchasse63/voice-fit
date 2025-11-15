import React from "react";
import { render } from "@testing-library/react-native";
import { ViewStyle } from "react-native";

// Component under test
import PillBadge from "../../../../src/components/ui/PillBadge";

// Mock ThemeContext to keep theme deterministic for tests
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

describe("PillBadge component", () => {
  it("renders provided text", () => {
    const { getByText } = render(<PillBadge text="2488 / 2468" />);
    expect(getByText("2488 / 2468")).toBeTruthy();
  });

  it("renders primary, secondary, and outlined variants without crashing", () => {
    (["primary", "secondary", "outlined"] as const).forEach((variant) => {
      const { getByText, unmount } = render(
        <PillBadge variant={variant} text={`Badge-${variant}`} />
      );
      expect(getByText(`Badge-${variant}`)).toBeTruthy();
      unmount();
    });
  });

  it("renders sm and md sizes without crashing", () => {
    (["sm", "md"] as const).forEach((size) => {
      const { getByText, unmount } = render(
        <PillBadge size={size} text={`Size-${size}`} />
      );
      expect(getByText(`Size-${size}`)).toBeTruthy();
      unmount();
    });
  });

  it("merges custom container style", () => {
    const { toJSON } = render(
      <PillBadge text="Styled" style={{ marginTop: 7 }} />
    );
    const tree = toJSON() as any;
    const styleArray: ViewStyle[] = Array.isArray(tree.props.style)
      ? tree.props.style
      : [tree.props.style];

    expect(styleArray).toEqual(
      expect.arrayContaining([expect.objectContaining({ marginTop: 7 })])
    );
  });

  it("outlined variant applies a border width", () => {
    const { toJSON } = render(<PillBadge text="Outlined" variant="outlined" />);
    const tree = toJSON() as any;
    const styleArray: ViewStyle[] = Array.isArray(tree.props.style)
      ? tree.props.style
      : [tree.props.style];

    // Expect at least one style layer to include borderWidth for outlined variant
    expect(
      styleArray.some((s) => s && typeof s === "object" && "borderWidth" in s)
    ).toBe(true);

    // And specifically a width of 1 as defined by the variant
    expect(styleArray).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderWidth: 1 })])
    );
  });
});
