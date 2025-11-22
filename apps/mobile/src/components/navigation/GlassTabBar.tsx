import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ScalePressable } from '../common/ScalePressable';

const TAB_HEIGHT = 60;

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const colors = isDark ? tokens.colors.dark : tokens.colors.light;

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
            <View
                style={[
                    styles.blurContainer,
                    {
                        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                    }
                ]}
            >
                <View style={styles.tabRow}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        return (
                            <TabItem
                                key={route.key}
                                label={label as string}
                                isFocused={isFocused}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                options={options}
                                colors={colors}
                            />
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

interface TabItemProps {
    label: string;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    options: any;
    colors: any;
}

const TabItem: React.FC<TabItemProps> = ({
    label,
    isFocused,
    onPress,
    onLongPress,
    options,
    colors,
}) => {
    const scale = useSharedValue(1);

    React.useEffect(() => {
        scale.value = withSpring(isFocused ? 1.05 : 1, {
            damping: 15,
            stiffness: 200,
        });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    // Render the icon provided by the navigator options
    const renderIcon = () => {
        if (options.tabBarIcon) {
            return options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? colors.accent.blue : colors.text.tertiary,
                size: 24,
            });
        }
        return null;
    };

    return (
        <ScalePressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            haptic="selection"
        >
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                {renderIcon()}
            </Animated.View>
            {isFocused && (
                <Animated.Text
                    entering={FadeIn.duration(200)}
                    style={[
                        styles.label,
                        { color: isFocused ? colors.accent.blue : colors.text.tertiary }
                    ]}
                >
                    {label}
                </Animated.Text>
            )}
        </ScalePressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    blurContainer: {
        flexDirection: 'row',
        width: '100%',
        height: TAB_HEIGHT,
        borderTopWidth: 1,
    },
    tabRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 3,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
