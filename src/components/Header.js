import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../config/colors';

/**
 * Header component for the cycling tracker app
 * 
 * @param {string} title - Header title
 * @param {boolean} showBack - Whether to show back button
 * @param {function} onBackPress - Custom function to call on back button press
 * @param {ReactNode} rightContent - Optional content to display on the right side
 * @param {Object} style - Additional styles for the header
 * @param {boolean} transparent - Whether header should be transparent
 * @param {string} titleAlign - Alignment of title ('left', 'center', 'right')
 * @param {Object} titleStyle - Additional styles for the title
 * @param {boolean} large - Whether to show a large header
 */
const Header = ({
  title,
  showBack = false,
  onBackPress,
  rightContent,
  style = {},
  transparent = false,
  titleAlign = 'center',
  titleStyle = {},
  large = false,
}) => {
  const navigation = useNavigation();

  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Get alignment style for title
  const getTitleAlignStyle = () => {
    switch (titleAlign) {
      case 'left':
        return { textAlign: 'left', marginLeft: showBack ? 32 : 16 };
      case 'right':
        return { textAlign: 'right', marginRight: rightContent ? 32 : 16 };
      default:
        return { textAlign: 'center' };
    }
  };

  return (
    <SafeAreaView 
      style={[
        styles.safeArea,
        transparent && styles.transparentSafeArea
      ]}
    >
      <StatusBar
        barStyle={transparent ? "light-content" : "dark-content"}
        backgroundColor={transparent ? "transparent" : colors.headerBackground}
        translucent={transparent}
      />
      <View 
        style={[
          styles.header,
          transparent && styles.transparentHeader,
          large && styles.largeHeader,
          style
        ]}
      >
        {showBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            hitSlop={{ top: 15, left: 15, bottom: 15, right: 15 }}
            activeOpacity={0.7}
          >
            {/* Simple back arrow using View (alternatively use an icon library) */}
            <View style={styles.backArrow}>
              <View style={styles.backArrowLine} />
              <View style={[styles.backArrowLine, styles.backArrowLineBottom]} />
            </View>
          </TouchableOpacity>
        )}

        <View 
          style={[
            styles.titleContainer,
            titleAlign === 'center' && styles.titleContainerCenter,
            (showBack || rightContent) && styles.titleWithControls
          ]}
        >
          <Text 
            style={[
              styles.title, 
              getTitleAlignStyle(), 
              large && styles.largeTitle,
              titleStyle
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {rightContent && (
          <View style={styles.rightContent}>
            {rightContent}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.headerBackground,
    width: '100%',
  },
  transparentSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    width: '100%',
    backgroundColor: colors.headerBackground,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  largeHeader: {
    height: 72,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleContainerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  titleWithControls: {
    paddingHorizontal: 40, // Make space for back button and right content
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  largeTitle: {
    fontSize: 22,
  },
  backButton: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    height: 16,
    width: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowLine: {
    position: 'absolute',
    height: 2,
    width: 10,
    backgroundColor: colors.text,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
    top: 4,
    left: 2,
  },
  backArrowLineBottom: {
    transform: [{ rotate: '45deg' }],
    top: 10,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Header;