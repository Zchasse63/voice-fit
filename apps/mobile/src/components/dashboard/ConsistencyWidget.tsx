import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../common/StatusBadge';
import { Flame } from 'lucide-react-native';

interface ConsistencyWidgetProps {
    streak: number;
    history: boolean[]; // Last 7 days, true if worked out
    style?: ViewStyle;
}

export const ConsistencyWidget: React.FC<ConsistencyWidgetProps> = ({
    streak,
    history,
    style,
}) => {
    const { isDark } = useTheme();
    const colors = isDark ? tokens.colors.dark : tokens.colors.light;

    return (
        <View style={[styles.container, { backgroundColor: colors.background.secondary }, style]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Flame size={20} color={colors.accent.orange} fill={colors.accent.orange} />
                    <Text style={[styles.title, { color: colors.text.primary }]}>Consistency</Text>
                </View>
                <StatusBadge
                    status="warning"
                    label={`${streak} Day Streak`}
                    showDot={false}
                />
            </View>

            <View style={styles.grid}>
                {history.map((workedOut, index) => (
                    <View key={index} style={styles.dayContainer}>
                        <View
                            style={[
                                styles.dayDot,
                                {
                                    backgroundColor: workedOut ? colors.accent.green : colors.background.tertiary,
                                    borderColor: workedOut ? colors.accent.green : colors.border.light,
                                },
                            ]}
                        />
                        <Text style={[styles.dayLabel, { color: colors.text.tertiary }]}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: tokens.spacing.md,
        borderRadius: tokens.borderRadius.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: tokens.spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.xs,
    },
    title: {
        fontSize: tokens.typography.fontSize.md,
        fontWeight: tokens.typography.fontWeight.bold,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayContainer: {
        alignItems: 'center',
        gap: tokens.spacing.xs,
    },
    dayDot: {
        width: 24,
        height: 24,
        borderRadius: 4, // Rounded squares
        borderWidth: 1,
    },
    dayLabel: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
    },
});
