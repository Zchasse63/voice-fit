import React from "react";
import { ScrollView } from "react-native";
import { render } from "@testing-library/react-native";

// Component under test
import StatsOverview from "../../../../src/components/dashboard/StatsOverview";

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

describe("StatsOverview component", () => {
  it("renders title and grid stats with labels, values, and units", () => {
    const stats = [
      { label: "Workouts", value: 12 },
      { label: "Volume", value: 3400, unit: "lbs", color: "#ff00ff" },
      { label: "Time", value: 75, unit: "min" },
    ];

    const { getByText } = render(
      <StatsOverview title="This Week" stats={stats} variant="grid" />
    );

    // Title
    expect(getByText("This Week")).toBeTruthy();

    // Labels and values
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("12")).toBeTruthy();

    expect(getByText("Volume")).toBeTruthy();
    // Value and unit rendered as separate Text nodes
    const volumeValueNode = getByText("3400");
    const volumeUnitNode = getByText("lbs");
    expect(volumeValueNode).toBeTruthy();
    expect(volumeUnitNode).toBeTruthy();

    expect(getByText("Time")).toBeTruthy();
    expect(getByText("75")).toBeTruthy();
    expect(getByText("min")).toBeTruthy();
  });

  it("applies provided color to value text when stat.color is supplied (grid variant)", () => {
    const stats = [
      { label: "Workouts", value: 12 },
      { label: "Volume", value: 3400, unit: "lbs", color: "#ff00ff" },
    ];

    const { getByText } = render(<StatsOverview stats={stats} variant="grid" />);

    // Target the value with custom color
    const volValue = getByText("3400");
    const style = flattenStyle((volValue as any).props.style);
    expect(style.color).toBe("#ff00ff");
  });

  it("does not render title when not provided (grid variant)", () => {
    const stats = [{ label: "Workouts", value: 7 }];

    const { queryByText, getByText } = render(
      <StatsOverview stats={stats} variant="grid" />
    );

    // Title absent
    expect(queryByText("This Week")).toBeNull();

    // Still renders stat items
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("7")).toBeTruthy();
  });

  it("renders row variant inside a horizontal ScrollView", () => {
    const stats = [
      { label: "Workouts", value: 3 },
      { label: "Volume", value: 1200, unit: "lbs" },
      { label: "Time", value: 45, unit: "min" },
    ];

    const { UNSAFE_getByType, getByText } = render(
      <StatsOverview title="Row Stats" stats={stats} variant="row" />
    );

    // Title present for row variant when provided
    expect(getByText("Row Stats")).toBeTruthy();

    // Row variant uses a horizontal ScrollView
    const scroll = UNSAFE_getByType(ScrollView);
    expect(scroll).toBeTruthy();
    expect(scroll.props.horizontal).toBe(true);

    // Ensure labels/values still render
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("Volume")).toBeTruthy();
    expect(getByText("1200")).toBeTruthy();
    expect(getByText("lbs")).toBeTruthy();
    expect(getByText("Time")).toBeTruthy();
    expect(getByText("45")).toBeTruthy();
    expect(getByText("min")).toBeTruthy();
  });

  it("renders without units for stats that omit the unit field", () => {
    const stats = [
      { label: "Workouts", value: 9 }, // no unit
      { label: "Time", value: 60, unit: "min" }, // with unit
    ];

    const { getByText, queryAllByText } = render(
      <StatsOverview stats={stats} variant="grid" />
    );

    // The stat without unit renders only the value (no trailing unit text)
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("9")).toBeTruthy();

    // "min" appears once for Time stat (sanity check)
    expect(getByText("Time")).toBeTruthy();
    expect(getByText("60")).toBeTruthy();
    const mins = queryAllByText("min");
    expect(mins.length).toBe(1);
  });
});
