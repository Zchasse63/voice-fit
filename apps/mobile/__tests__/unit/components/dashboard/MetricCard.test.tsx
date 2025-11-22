import React from "react";
import { View } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Component under test
import MetricCard from "../../../../src/components/dashboard/MetricCard";

// Mock ThemeContext to provide deterministic theme (light mode)
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

// Provide a simple dummy icon component to verify icon rendering
const DummyIcon: React.FC<any> = () => <View testID="metric-icon" />;

describe("MetricCard component", () => {
  it("renders title and value", () => {
    const { getByText } = render(<MetricCard title="Workouts" value="12" />);
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("12")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    const { getByText } = render(
      <MetricCard title="Workouts" value="12" subtitle="this week" />,
    );
    expect(getByText("this week")).toBeTruthy();
  });

  it("renders icon when provided", () => {
    const { getByTestId } = render(
      <MetricCard title="Workouts" value="12" icon={DummyIcon as any} />,
    );
    expect(getByTestId("metric-icon")).toBeTruthy();
  });

  it("renders trend arrow and value when trend is up", () => {
    const { getByText } = render(
      <MetricCard
        title="Workouts"
        value="12"
        trend="up"
        trendValue="+2"
        subtitle="this week"
      />,
    );
    // Expect the trend arrow '↑' and value to appear together
    expect(getByText(/↑ \+2/)).toBeTruthy();
  });

  it("renders trend arrow and value when trend is down", () => {
    const { getByText } = render(
      <MetricCard
        title="Volume"
        value="10k"
        trend="down"
        trendValue="-1k"
        subtitle="this month"
      />,
    );
    // Expect the trend arrow '↓' and value to appear together
    expect(getByText(/↓ -1k/)).toBeTruthy();
  });

  it("does not render trend arrow when no trend is provided", () => {
    const { queryByText } = render(
      <MetricCard title="Workouts" value="12" trendValue="+2" />,
    );
    // No explicit arrow characters should exist without a trend set
    expect(queryByText(/↑/)).toBeNull();
    expect(queryByText(/↓/)).toBeNull();
  });

  it("calls onPress when pressed (pressable mode)", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <MetricCard title="Workouts" value="12" onPress={onPress} />,
    );

    const button = getByRole("button");
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes accessibility label when pressable", () => {
    const onPress = jest.fn();
    const a11yLabel = "Workouts: 12, this week";
    const { getByLabelText } = render(
      <MetricCard
        title="Workouts"
        value="12"
        subtitle="this week"
        onPress={onPress}
      />,
    );

    expect(getByLabelText(a11yLabel)).toBeTruthy();
  });

  it("renders compact variant without crashing", () => {
    const { getByText } = render(
      <MetricCard title="Distance" value="5.2" variant="compact" />,
    );
    expect(getByText("5.2")).toBeTruthy();
  });
});
