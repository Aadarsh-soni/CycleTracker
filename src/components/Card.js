import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { colors } from '../config/colors';

/**
 * Card component for displaying content in a contained, styled container
 * 
 * @param {ReactNode} children - Content to display inside the card
 * @param {string} title - Optional card title 
 * @param {boolean} onPress - Function to call when card is pressed (makes card touchable)
 * @param {Object} style - Additional styles for the card
 * @param {string} titleStyle - Additional styles for the title
 * @param {boolean} shadow - Whether to show shadow (default: true)
 * @param {string} variant - Card style variant ('default', 'outlined', 'flat')
 * @param {ReactNode} rightContent - Optional content to display on the right side of the title
 * @param {ReactNode} footer - Optional footer content
 * @param {boolean} fullWidth - Whether card should take full width
 */
const Card = ({ 
  children, 
  title, 
  onPress, 
  style = {}, 
  titleStyle = {},
  shadow = true,
  variant = 'default',
  rightContent,
  footer,
  fullWidth = false,
}) => {
  // Animation value for press effect
  const scaleAnim = new Animated.Value(1);
  
  // Get screen width
  const screenWidth = Dimensions.get('window').width;
  
  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Get card styles based on variant
  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        };
      default:
        return {
          backgroundColor: colors.white,
        };
    }
  };

  // Create card content
  const cardContent = (
    <>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {rightContent && (
            <View style={styles.rightContent}>
              {rightContent}
            </View>
          )}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </>
  );

  // Calculate width style
  const widthStyle = fullWidth 
    ? { width: screenWidth - 32 } 
    : {};

  // Return either touchable or regular card
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View 
          style={[
            styles.card,
            getVariantStyle(),
            shadow && styles.shadow,
            widthStyle,
            { transform: [{ scale: scaleAnim }] },
            style
          ]}
        >
          {cardContent}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <View 
      style={[
        styles.card,
        getVariantStyle(),
        shadow && styles.shadow,
        widthStyle,
        style
      ]}
    >
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  }
});

export default Card;