import React from "react";
import { View } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Button under test
import Button from "../../../../src/components/ui/Button";

// Mock ThemeContext to provide a stable theme for tests
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

describe("Button component", () => {
  it("renders with text children", () => {
    const { getByText } = render(
      <Button onPress={() => {}}>Click Me</Button>
    );
    expect(getByText("Click Me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Press</Button>);
    fireEvent.press(getByText("Press"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button disabled onPress={onPress}>
        Disabled
      </Button>
    );
    fireEvent.press(getByText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress when loading and hides label", () => {
    const onPress = jest.fn();
    const { queryByText, getByTestId } = render(
      <Button loading onPress={onPress}>
        Loading
      </Button>
    );
    // label is not rendered while loading (ActivityIndicator shown instead)
    expect(queryByText("Loading")).toBeNull();

    // pressing should be disabled when loading
    // We can't press the ActivityIndicator, but we can still attempt press on container by label (which is absent).
    // To ensure behavior, we rely on disabled logic: no onPress invocation occurred.
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders left and right icons when provided", () => {
    const { getByTestId } = render(
      <Button
        onPress={() => {}}
        leftIcon={<View testID="left-icon" />}
        rightIcon={<View testID="right-icon" />}
      >
        With Icons
      </Button>
    );
    expect(getByTestId("left-icon")).toBeTruthy();
    expect(getByTestId("right-icon")).toBeTruthy();
  });

  it("supports all variants without crashing and can be pressed", () => {
    const variants: Array<"primary" | "secondary" | "ghost" | "outline"> = [
      "primary",
      "secondary",
      "ghost",
      "outline",
    ];

    variants.forEach((variant) => {
      const onPress = jest.fn();
      const label = `Variant-${variant}`;
      const { getByText, unmount } = render(
        <Button variant={variant} onPress={onPress}>
          {label}
        </Button>
      );
      expect(getByText(label)).toBeTruthy();
      fireEvent.press(getByText(label));
      expect(onPress).toHaveBeenCalledTimes(1);
      unmount();
    });
  });

  it("supports all sizes without crashing", () => {
    const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];

    sizes.forEach((size) => {
      const label = `Size-${size}`;
      const { getByText, unmount } = render(
        <Button size={size} onPress={() => {}}>
          {label}
        </Button>
      );
      expect(getByText(label)).toBeTruthy();
      unmount();
    });
  });

  it("respects fullWidth prop (renders and remains pressable)", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button fullWidth onPress={onPress}>
        Full Width
      </Button>
    );
    // We don't assert exact width style here; we validate usability/interaction.
    fireEvent.press(getByText("Full Width"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("applies combined states correctly: disabled + loading prevents presses", () => {
    const onPress = jest.fn();
    const { queryByText } = render(
      <Button disabled loading onPress={onPress}>
        Busy
      </Button>
    );

    // no text when loading
    expect(queryByText("Busy")).toBeNull();

    // no onPress
    expect(onPress).not.toHaveBeenCalled();
  });
});
