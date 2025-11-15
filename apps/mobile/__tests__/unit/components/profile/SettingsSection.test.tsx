import React from "react";
import { View, Pressable, Switch } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

// Component under test
import SettingsSection, {
  SettingItem,
} from "../../../../src/components/profile/SettingsSection";

// Mock ThemeContext to keep theme deterministic (light mode)
jest.mock("../../../../src/theme/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

describe("SettingsSection component", () => {
  const makeItems = (overrides: Partial<SettingItem>[] = []): SettingItem[] => {
    const base: SettingItem[] = [
      {
        id: "account",
        label: "Account",
        description: "Manage your account",
        icon: <View testID="icon-account" />,
        action: jest.fn(),
      },
      {
        id: "notifications",
        label: "Notifications",
        description: "Enable alerts",
        icon: <View testID="icon-notifs" />,
        hasToggle: true,
        toggleValue: true,
        onToggleChange: jest.fn(),
      },
      {
        id: "wearables",
        label: "Wearables",
        description: "Connected devices",
        icon: <View testID="icon-wearables" />,
        badge: "PRO",
      },
    ];

    // Apply overrides to corresponding items by index
    return base.map((item, idx) => ({
      ...item,
      ...(overrides[idx] || {}),
    }));
  };

  it("renders section title uppercased and all item labels/descriptions", () => {
    const items = makeItems();
    const { getByText } = render(
      <SettingsSection title="Account" items={items} />
    );

    // Title should be uppercased
    expect(getByText("ACCOUNT")).toBeTruthy();

    // Item labels and descriptions
    expect(getByText("Account")).toBeTruthy();
    expect(getByText("Manage your account")).toBeTruthy();

    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("Enable alerts")).toBeTruthy();

    expect(getByText("Wearables")).toBeTruthy();
    expect(getByText("Connected devices")).toBeTruthy();
  });

  it("invokes action when an actionable item is pressed, and does nothing for a disabled item", () => {
    const items = makeItems();
    const onAccountPress = items[0].action as jest.Mock;

    const { UNSAFE_getAllByType } = render(
      <SettingsSection title="Settings" items={items} />
    );

    // There should be one Pressable per item
    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables).toHaveLength(items.length);

    // First item is actionable; pressing should call its action
    fireEvent.press(pressables[0]);
    expect(onAccountPress).toHaveBeenCalledTimes(1);

    // Third item has no action and no toggle => should be disabled
    expect(pressables[2].props.disabled).toBe(true);
  });

  it("renders a Switch for toggle items and calls onToggleChange when toggled", () => {
    const items = makeItems();
    const onToggle = items[1].onToggleChange as jest.Mock;

    const { UNSAFE_getAllByType, getByText } = render(
      <SettingsSection title="Preferences" items={items} />
    );

    // Ensure the toggle item is present by label
    expect(getByText("Notifications")).toBeTruthy();

    // Find switch
    const switches = UNSAFE_getAllByType(Switch);
    expect(switches).toHaveLength(1);

    // Initial value comes from item.toggleValue (true)
    expect(switches[0].props.value).toBe(true);

    // Toggle to false
    fireEvent(switches[0], "valueChange", false);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("displays badge text for items with a badge", () => {
    const items = makeItems();
    const { getByText } = render(
      <SettingsSection title="Devices" items={items} />
    );

    // Badge is rendered as text inside a styled view
    expect(getByText("PRO")).toBeTruthy();
  });

  it("disables press when item has no action and no toggle, enables press when action exists", () => {
    const items = makeItems([
      // Force first item to have action
      { action: jest.fn() },
      // Force second item to be non-toggle and no action (disabled)
      { hasToggle: false, action: undefined },
      // Third remains as badge-only (disabled)
      {},
    ]);

    const { UNSAFE_getAllByType } = render(
      <SettingsSection title="Mixed" items={items} />
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    // First: actionable
    expect(pressables[0].props.disabled).toBe(false);
    // Second: no action and no toggle => disabled
    expect(pressables[1].props.disabled).toBe(true);
    // Third: no action and no toggle => disabled
    expect(pressables[2].props.disabled).toBe(true);
  });
});
