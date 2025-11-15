import React from "react";
import { View } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Component under test
import TimelineItem from "../../../../src/components/dashboard/TimelineItem";

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

describe("TimelineItem component", () => {
  it("renders title, subtitle, and time", () => {
    const { getByText } = render(
      <TimelineItem
        title="Bench Press"
        subtitle="3x10 @ RPE 8"
        time="Yesterday"
      />,
    );

    expect(getByText("Bench Press")).toBeTruthy();
    expect(getByText("3x10 @ RPE 8")).toBeTruthy();
    expect(getByText("Yesterday")).toBeTruthy();
  });

  it("renders icon when provided and respects iconColor", () => {
    let lastIconProps: any = null;
    const DummyIcon: React.FC<any> = (props) => {
      lastIconProps = props;
      return <View testID="timeline-icon" />;
    };

    const { getByTestId } = render(
      <TimelineItem
        title="Run"
        subtitle="5.2 mi"
        time="Today"
        icon={DummyIcon}
        iconColor="#9900ff"
      />,
    );

    expect(getByTestId("timeline-icon")).toBeTruthy();
    // Assert props passed to icon component
    expect(lastIconProps).toBeTruthy();
    expect(lastIconProps.size).toBe(20);
    expect(lastIconProps.color).toBe("#9900ff");
  });

  it("shows vertical connector line when isLast is false (default) and hides it when isLast is true", () => {
    // Default (isLast=false) should render the connector
    const { toJSON, rerender } = render(
      <TimelineItem title="Workout" subtitle="12 sets" time="Mon" />,
    );
    let tree: any = toJSON();

    // Structure:
    // tree = View (row)
    // tree.children[0] = View (icon column)
    //   - children[0] = icon circle View
    //   - children[1] = connector line View (only when !isLast)
    const column = tree.children[0];
    expect(Array.isArray(column.children)).toBe(true);
    expect(column.children.length).toBe(2); // circle + connector

    // When isLast=true, connector should be absent
    rerender(
      <TimelineItem title="Workout" subtitle="12 sets" time="Mon" isLast />,
    );
    tree = toJSON();
    const lastColumn = tree.children[0];
    expect(Array.isArray(lastColumn.children)).toBe(true);
    expect(lastColumn.children.length).toBe(1); // only circle
  });

  it("is pressable when onPress is provided and exposes accessibility label", () => {
    const onPress = jest.fn();
    const title = "Deadlift";
    const subtitle = "5x5";
    const time = "Tue";
    const a11y = `${title}, ${subtitle}, ${time}`;

    const { getByRole, getByA11yLabel } = render(
      <TimelineItem
        title={title}
        subtitle={subtitle}
        time={time}
        onPress={onPress}
      />,
    );

    const button = getByRole("button");
    expect(getByA11yLabel(a11y)).toBeTruthy();

    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("applies iconBackgroundColor to the icon circle container", () => {
    const DummyIcon: React.FC<any> = () => <View testID="timeline-icon" />;
    const bg = "#123456";

    const { toJSON } = render(
      <TimelineItem
        title="Swim"
        subtitle="1.2 km"
        time="Wed"
        icon={DummyIcon}
        iconBackgroundColor={bg}
      />,
    );

    const tree: any = toJSON();
    const column = tree.children[0];
    const circle = column.children[0]; // icon circle View
    const circleStyle = flattenStyle(circle.props.style);

    expect(circleStyle.backgroundColor).toBe(bg);
  });
});
