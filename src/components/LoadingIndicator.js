import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Text,
  Modal
} from 'react-native';
import { colors } from '../config/colors';

/**
 * Loading Indicator component for displaying loading states
 * 
 * @param {boolean} visible - Whether the indicator is visible
 * @param {string} text - Optional text to display below the spinner
 * @param {string} size - Size of the spinner ('small', 'large')
 * @param {string} color - Color of the spinner
 * @param {boolean} overlay - Whether to show a full-screen overlay
 * @param {boolean} transparent - Whether the overlay should be transparent
 * @param {Object} style - Additional styles for the container
 * @param {Object} textStyle - Additional styles for the text
 */
const LoadingIndicator = ({ 
  visible = true, 
  text = 'Loading...', 
  size = 'large',
  color = colors.primary,
  overlay = false,
  transparent = false,
  style = {},
  textStyle = {},
}) => {
  // If not visible, don't render anything
  if (!visible) {
    return null;
  }

  // Content of the loading indicator
  const loadingContent = (
    <View style={[
      styles.container, 
      transparent && styles.transparentContainer,
      style
    ]}>
      <ActivityIndicator 
        size={size} 
        color={color} 
        animating={visible} 
      />
      {text && (
        <Text style={[styles.text, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );

  // If overlay is true, render in a modal
  if (overlay) {
    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={visible}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {loadingContent}
          </View>
        </View>
      </Modal>
    );
  }

  // Otherwise render inline
  return loadingContent;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    minHeight: 100,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    elevation: 0,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingIndicator;