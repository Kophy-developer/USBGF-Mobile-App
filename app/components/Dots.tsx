import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme/tokens';

interface DotsProps {
  count: number;
  activeIndex: number;
}

export const Dots: React.FC<DotsProps> = ({ count, activeIndex }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.4,
  },
});
