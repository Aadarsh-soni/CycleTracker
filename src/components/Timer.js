import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';

/**
 * Timer - A component for tracking and displaying elapsed time
 * 
 * @param {Object} props
 * @param {boolean} props.isRunning - Whether the timer is currently running
 * @param {function} props.onStart - Function to call when timer starts
 * @param {function} props.onPause - Function to call when timer pauses
 * @param {function} props.onReset - Function to call when timer resets
 * @param {function} props.onStop - Function to call when timer stops completely
 * @param {number} props.initialTime - Initial time in milliseconds (for resuming)
 * @param {boolean} props.showControls - Whether to show control buttons
 */
const Timer = ({
  isRunning: externalIsRunning,
  onStart,
  onPause,
  onReset,
  onStop,
  initialTime = 0,
  showControls = true,
}) => {
  // Use internal state if no external control is provided
  const [internalIsRunning, setInternalIsRunning] = useState(false);
  const isRunning = externalIsRunning !== undefined ? externalIsRunning : internalIsRunning;
  
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const startTimeRef = useRef(Date.now() - initialTime);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime;
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // Format time as HH:MM:SS
  const formatTime = (timeInMs) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const handleStart = () => {
    if (onStart) onStart();
    setInternalIsRunning(true);
  };

  const handlePause = () => {
    if (onPause) onPause(elapsedTime);
    setInternalIsRunning(false);
  };

  const handleReset = () => {
    if (onReset) onReset();
    setElapsedTime(0);
    startTimeRef.current = Date.now();
  };

  const handleStop = () => {
    if (onStop) onStop(elapsedTime);
    setInternalIsRunning(false);
    setElapsedTime(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
      </View>

      {showControls && (
        <View style={styles.controlsContainer}>
          {!isRunning ? (
            <TouchableOpacity style={styles.button} onPress={handleStart}>
              <Ionicons name="play" size={24} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePause}>
              <Ionicons name="pause" size={24} color={colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, styles.resetButton]} 
            onPress={handleReset}
            disabled={elapsedTime === 0}
          >
            <Ionicons name="refresh" size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.stopButton]} 
            onPress={handleStop}
            disabled={elapsedTime === 0 && !isRunning}
          >
            <Ionicons name="stop" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.light,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    color: colors.dark,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pauseButton: {
    backgroundColor: colors.secondary,
  },
  resetButton: {
    backgroundColor: colors.medium,
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
});

export default Timer;