import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface MetricSparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    style?: ViewStyle;
    trend?: 'up' | 'down' | 'neutral';
}

export const MetricSparkline: React.FC<MetricSparklineProps> = ({
    data,
    width = 100,
    height = 40,
    color,
    style,
    trend,
}) => {
    const { colors } = useTheme();

    // Default color based on trend if not provided
    const getTrendColor = () => {
        if (color) return color;
        switch (trend) {
            case 'up': return colors.accent.green;
            case 'down': return colors.accent.red;
            default: return colors.accent.blue;
        }
    };

    const strokeColor = getTrendColor();

    if (!data || data.length < 2) {
        return <View style={[styles.container, { width, height }, style]} />;
    }

    // Normalize data to fit in width/height
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    // Create area path (close the loop)
    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
        <View style={[styles.container, style]}>
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={strokeColor} stopOpacity="0.2" />
                        <Stop offset="1" stopColor={strokeColor} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>

                {/* Area Fill */}
                <Path
                    d={`M${areaPoints}Z`}
                    fill="url(#sparklineGradient)"
                />

                {/* Line Stroke */}
                <Path
                    d={`M${points}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
