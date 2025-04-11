import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';
import { colors } from '../config/colors';

/**
 * Custom Button component for the cycling tracker app
 * 
 * @param {string} title - Button text
 * @param {function} onPress - Function to call when button is pressed
 * @param {string} type - Button type ('primary', 'secondary', 'danger', 'success', 'outline')
 * @param {boolean} isLoading - Whether to show loading indicator
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} icon - Icon component to show before text
 * @param {Object} style - Additional styles for the button
 * @param {Object} textStyle - Additional styles for the button text
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {string} size - Button size ('small', 'medium', 'large')
 */
const Button = ({ 
  title, 
  onPress, 
  type = 'primary', 
  isLoading = false, 
  disabled = false, 
  icon = null,
  style = {},
  textStyle = {},
  fullWidth = false,
  size = 'medium',
}) => {
  // Determine button styles based on type
  const getButtonStyle = () => {
    switch (type) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 1,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          borderWidth: 1,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 1,
        };
    }
  };

  // Determine text color based on button type
  const getTextStyle = () => {
    switch (type) {
      case 'outline':
        return { color: colors.primary };
      default:
        return { color: colors.white };
    }
  };

  // Determine button size
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          minWidth: 80,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          minWidth: 160,
        };
      default: // medium
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          minWidth: 120,
        };
    }
  };

  // Set opacity when button is disabled
  const opacity = disabled || isLoading ? 0.6 : 1;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getSizeStyle(),
        { opacity },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {isLoading ? (
          <ActivityIndicator 
            color={type === 'outline' ? colors.primary : colors.white} 
            size="small"
            style={styles.loader}
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
              styles.text, 
              getTextStyle(), 
              size === 'small' && { fontSize: 14 },
              size === 'large' && { fontSize: 18 },
              textStyle
            ]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconContainer: {
    marginRight: 8,
  },
  loader: {
    marginHorizontal: 8,
  }
});

export default Button;