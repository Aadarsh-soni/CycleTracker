import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';

/**
 * StatsCard - A component to display cycling statistics in a card format
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the stat card
 * @param {string} props.value - Main value to display
 * @param {string} props.unit - Unit for the value (km, min, etc.)
 * @param {string} props.icon - Ionicon name for the stat
 * @param {string} props.iconColor - Color for the icon
 * @param {boolean} props.isHighlighted - Whether to highlight this card
 * @param {function} props.onPress - Function to call when card is pressed
 */
const StatsCard = ({ 
  title, 
  value, 
  unit, 
  icon, 
  iconColor = colors.primary, 
  isHighlighted = false,
  onPress 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isHighlighted && styles.highlightedContainer
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={icon || 'stats-chart'} 
          size={24} 
          color={iconColor} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  highlightedContainer: {
    backgroundColor: colors.primary + '10', // Adding 10% opacity to primary color
    borderColor: colors.primary,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: colors.medium,
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  unit: {
    fontSize: 14,
    color: colors.medium,
    marginLeft: 4,
  },
});

export default StatsCard;