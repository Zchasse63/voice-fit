import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface StatusBadgeProps {
    status: 'success' | 'warning' | 'error' | 'neutral' | 'info';
    label: string;
    showDot?: boolean;
    style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status = 'neutral',
    label,
    showDot = true,
    style
}) => {
    const { colors } = useTheme();

    const getStatusColors = () => {
        switch (status) {
            case 'success':
                return {
                    bg: colors.backgroundSoft.success,
                    text: colors.accent.green,
                    dot: colors.accent.green,
                };
            case 'warning':
                return {
                    bg: colors.backgroundSoft.warning,
                    text: colors.accent.orange,
                    dot: colors.accent.orange,
                };
            case 'error':
                return {
                    bg: colors.backgroundSoft.danger,
                    text: colors.accent.red,
                    dot: colors.accent.red,
                };
            case 'info':
                return {
                    bg: colors.backgroundSoft.info,
                    text: colors.accent.blue,
                    dot: colors.accent.blue,
                };
            case 'neutral':
            default:
                return {
                    bg: colors.background.tertiary,
                    text: colors.text.secondary,
                    dot: colors.text.tertiary,
                };
        }
    };

    const themeColors = getStatusColors();

    return (
        <View style={[
            styles.container,
            { backgroundColor: themeColors.bg, borderColor: 'transparent' }, // Could add border if needed
            style
        ]}>
            {showDot && (
                <View style={[styles.dot, { backgroundColor: themeColors.dot }]} />
            )}
            <Text style={[styles.label, { color: themeColors.text }]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tokens.spacing.sm,
        paddingVertical: tokens.spacing.xs,
        borderRadius: tokens.borderRadius.full,
        alignSelf: 'flex-start',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: tokens.spacing.xs,
    },
    label: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: 16,
    },
});
