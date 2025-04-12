/**
 * colors.js
 * 
 * Application color scheme for consistent styling across the app.
 * These colors are used for UI components, backgrounds, text, etc.
 */

const colors = {
    // Primary brand colors
    primary: '#2E7DF7',          // Bright blue - main app color
    primaryDark: '#1A59C5',      // Darker blue for hover/pressed states
    primaryLight: '#A7C8FF',     // Light blue for backgrounds, highlights
    
    // Secondary colors
    secondary: '#35C759',        // Green - for success states, tracking active
    secondaryDark: '#218D40',    // Darker green
    secondaryLight: '#D4F7DE',   // Light green for backgrounds
  
    // Accent colors
    accent: '#FF9500',           // Orange - for highlights, call to actions
    accentDark: '#D97B00',       // Darker orange
    accentLight: '#FFECCC',      // Light orange for subtle highlights
  
    // Semantic colors
    success: '#35C759',          // Green - successful operations
    warning: '#FFCC00',          // Yellow - warning states
    danger: '#FF3B30',           // Red - errors, delete actions
    info: '#5AC8FA',             // Light blue - information
  
    // Neutral colors
    dark: '#1C1C1E',             // Almost black - for main text
    medium: '#8E8E93',           // Medium gray - for secondary text
    light: '#F2F2F7',            // Light gray - for backgrounds
    ultraLight: '#F9F9FB',       // Very light gray - for card backgrounds
    white: '#FFFFFF',            // White - for cards, buttons
    black: '#000000',            // Pure black - for special elements
  
    // UI specific colors
    background: '#F9F9FB',       // App background
    card: '#FFFFFF',             // Card background
    border: '#E5E5EA',           // Border color
    disabled: '#C7C7CC',         // Disabled state
    shadow: 'rgba(0, 0, 0, 0.1)', // Shadow color
  
    // Transparency variants
    transparentPrimary: 'rgba(46, 125, 247, 0.9)', // Semi-transparent primary
    transparentDark: 'rgba(28, 28, 30, 0.7)',      // Semi-transparent dark
    overlay: 'rgba(0, 0, 0, 0.5)',                  // Modal overlays
  };
  
  export default colors;