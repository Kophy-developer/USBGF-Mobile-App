import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import { Button } from '../components/Button';
import { Dots } from '../components/Dots';
import { setOnboardingSeen } from '../storage/flags';

type OnboardingCarouselNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingCarouselProps {
  navigation: OnboardingCarouselNavigationProp;
}

const { width: screenWidth } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    image: require('../assets/onboarding/1.png'),
    accessibilityLabel: 'Onboarding slide 1 - Welcome to USBGF',
  },
  {
    id: 2,
    image: require('../assets/onboarding/2.png'),
    accessibilityLabel: 'Onboarding slide 2 - Join our community',
  },
  {
    id: 3,
    image: require('../assets/onboarding/3.png'),
    accessibilityLabel: 'Onboarding slide 3 - Start your journey',
  },
];

// Separate component for each slide to avoid hook issues
const OnboardingSlide: React.FC<{ item: typeof onboardingData[0] }> = ({ item }) => {
  return (
    <View style={styles.slideContainer}>
      <Image
        source={item.image}
        style={styles.slideImage}
        resizeMode="contain"
        accessibilityLabel={item.accessibilityLabel}
      />
    </View>
  );
};

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  navigation,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleSkip = async () => {
    await setOnboardingSeen();
    navigation.replace('SignIn');
  };

  const handleContinue = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await setOnboardingSeen();
    navigation.replace('SignIn');
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    // Ensure index is within bounds
    const clampedIndex = Math.max(0, Math.min(index, onboardingData.length - 1));
    setCurrentIndex(clampedIndex);
  };

  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => {
    return <OnboardingSlide item={item} />;
  };

  const buttonTitle = currentIndex === onboardingData.length - 1 ? 'Get started' : 'Continue';

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            const contentOffsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffsetX / screenWidth);
            const clampedIndex = Math.max(0, Math.min(index, onboardingData.length - 1));
            setCurrentIndex(clampedIndex);
          }}
        />
      </View>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        <Dots count={onboardingData.length} activeIndex={currentIndex} />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={buttonTitle}
          onPress={handleContinue}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  skipContainer: {
    position: 'absolute',
    top: theme.spacing['2xl'],
    right: theme.spacing.lg,
    zIndex: 1,
  },
  skipButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  skipText: {
    ...theme.typography.body,
    color: theme.colors.textOnDark,
    fontWeight: '600',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['3xl'],
  },
  slideImage: {
    width: '100%',
    height: '80%',
  },
  dotsContainer: {
    paddingVertical: theme.spacing['2xl'],
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingBottom: theme.spacing['2xl'],
  },
});