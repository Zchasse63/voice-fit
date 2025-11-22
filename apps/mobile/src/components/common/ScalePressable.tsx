import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import tokens from '../../theme/tokens';

interface ScalePressableProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    style?: PressableProps['style'];
    haptic?: boolean | keyof typeof tokens.haptics;
    scaleTo?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ScalePressable: React.FC<ScalePressableProps> = ({
    children,
    style,
    haptic = true,
    scaleTo = tokens.animation.scale.pressed,
    onPressIn,
    onPressOut,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = (event: any) => {
        scale.value = withSpring(scaleTo, tokens.animation.spring.bouncy);

        if (haptic) {
            const style = typeof haptic === 'string' ? haptic : 'light';
            switch (style) {
                case 'light':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'heavy':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case 'success':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'error':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                case 'warning':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
                case 'selection':
                    Haptics.selectionAsync();
                    break;
                default:
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }

        onPressIn?.(event);
    };

    const handlePressOut = (event: any) => {
        scale.value = withSpring(1, tokens.animation.spring.bouncy);
        onPressOut?.(event);
    };

    return (
        <AnimatedPressable
            style={[style, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};
