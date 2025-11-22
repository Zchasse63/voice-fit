import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { tokens } from '../theme/tokens';
import { ScalePressable } from '../components/common/ScalePressable';
import { Trophy, ArrowRight } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function WorkoutCelebrationScreen() {
    const { isDark } = useTheme();
    const colors = isDark ? tokens.colors.dark : tokens.colors.light;
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { runId } = route.params || {};

    // Animation values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);

    useEffect(() => {
        // Sequence animations
        scale.value = withDelay(300, withSpring(1, { damping: 12 }));
        opacity.value = withDelay(600, withTiming(1, { duration: 800 }));
        translateY.value = withDelay(600, withSpring(0));
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const handleContinue = () => {
        navigation.replace('RunSummary', { runId });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <View style={styles.content}>
                {/* Animated Trophy Icon */}
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.accent.yellow + '20' }]}>
                        <Trophy
                            size={80}
                            color={colors.accent.yellow}
                            fill={colors.accent.yellow}
                        />
                    </View>
                </Animated.View>

                {/* Text Content */}
                <Animated.View style={[styles.textContainer, animatedContentStyle]}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        Workout Complete!
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                        Great job crushing your goals today.
                    </Text>
                </Animated.View>
            </View>

            {/* Bottom Action */}
            <Animated.View style={[styles.footer, animatedContentStyle]}>
                <ScalePressable
                    style={[styles.button, { backgroundColor: colors.accent.blue }]}
                    onPress={handleContinue}
                >
                    <Text style={styles.buttonText}>View Summary</Text>
                    <ArrowRight size={20} color="white" />
                </ScalePressable>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: tokens.spacing.xl,
    },
    iconContainer: {
        marginBottom: tokens.spacing['2xl'],
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: tokens.typography.fontSize['3xl'],
        fontWeight: tokens.typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: tokens.spacing.md,
    },
    subtitle: {
        fontSize: tokens.typography.fontSize.lg,
        textAlign: 'center',
        lineHeight: 28,
    },
    footer: {
        padding: tokens.spacing.xl,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: tokens.spacing.lg,
        borderRadius: tokens.borderRadius.xl,
        gap: tokens.spacing.sm,
        ...tokens.shadows.md,
    },
    buttonText: {
        color: 'white',
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.bold,
    },
});
