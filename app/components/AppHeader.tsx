import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { Platform } from 'react-native';

type MenuItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

interface AppHeaderProps {
  onSearchPress?: () => void;
  menuItems?: MenuItem[];
  onBackPress?: () => void;
  showSearch?: boolean;
  padTop?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onSearchPress,
  menuItems,
  onBackPress,
  showSearch,
  padTop = true,
}) => {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0;
  const shouldShowSearch = showSearch ?? Boolean(onSearchPress);
  const baseTopPadding = padTop ? Math.max(insets.top - theme.spacing.md, theme.spacing.xs) : 0;
  const androidExtraTop = Platform.OS === 'android' ? 10 : 0;
  const topPadding = baseTopPadding + androidExtraTop;

  const handleMenuPress = () => {
    if (!hasMenu) {
      return;
    }
    setMenuOpen((prev) => !prev);
  };

  const handleMenuItemPress = (item: MenuItem) => {
    setMenuOpen(false);
    item.onPress();
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: topPadding }]}>
        {onBackPress ? (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : hasMenu ? (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            disabled={!hasMenu}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <Text style={[styles.menuIcon, !hasMenu && styles.menuIconDisabled]}>☰</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButton} />
        )}

        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/USBGF_com_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="USBGF Logo"
          />
        </View>

        {shouldShowSearch && onSearchPress ? (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchPress}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Text style={styles.searchIcon}>⌕</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButton} />
        )}
      </View>

      {hasMenu && (
      <Modal
          visible={menuOpen && !onBackPress}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
          <View style={[styles.menuDropdown, { top: insets.top + 84 + (topPadding || 0) }]}>
              {(menuItems ?? []).map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <View style={styles.menuDivider} />}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.menuItemText, item.destructive && styles.destructive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['3xl'],
    paddingBottom: 0,
    backgroundColor: '#FFFFFF', // Explicitly set white to prevent gradient
    zIndex: 100,
    elevation: 100,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  menuIcon: {
    fontSize: 26,
    color: theme.colors.textPrimary,
  },
  backIcon: {
    fontSize: 26,
    color: theme.colors.textPrimary,
  },
  menuIconDisabled: {
    opacity: 0.3,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 70,
  },
  searchButton: {
    padding: theme.spacing.sm,
  },
  searchIcon: {
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuDropdown: {
    position: 'absolute',
    left: theme.spacing['3xl'],
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius?.md ?? 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    ...theme.typography.button,
    color: theme.colors.textPrimary,
  },
  destructive: {
    color: '#B91C1C',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});

