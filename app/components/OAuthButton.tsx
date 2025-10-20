import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../theme/tokens';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type OAuthProvider = 'apple' | 'google';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onPress: () => void;
  style?: ViewStyle;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onPress,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const providerConfig = {
    apple: {
      backgroundColor: theme.colors.apple,
      textColor: theme.colors.textOnDark,
      title: 'Continue with Apple',
      icon: '🍎',
    },
    google: {
      backgroundColor: theme.colors.google,
      textColor: theme.colors.textOnDark,
      title: 'Continue with Google',
      icon: 'G',
    },
  };

  const config = providerConfig[provider];

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.backgroundColor },
        style,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.title}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.radius.xl,
    minHeight: 48,
    ...theme.shadows.button,
  },
  icon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  text: {
    ...theme.typography.button,
    textAlign: 'center',
  },
});
