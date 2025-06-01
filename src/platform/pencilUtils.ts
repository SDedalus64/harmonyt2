import React from 'react';
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

// Check if Apple Pencil is available
export const isApplePencilAvailable = (): boolean => {
  return Platform.OS === 'ios' && Platform.isPad;
};

// Pencil interaction types
export type PencilInteractionType = 'hover' | 'tap' | 'doubleTap' | 'longPress';

interface PencilInteractionEvent {
  type: PencilInteractionType;
  x: number;
  y: number;
  pressure: number;
  altitude: number;
  azimuth: number;
}

// Create a custom hook for Apple Pencil interactions
export const usePencilInteraction = (
  onInteraction: (event: PencilInteractionEvent) => void,
  enabled: boolean = true
) => {
  React.useEffect(() => {
    if (!isApplePencilAvailable() || !enabled) {
      return;
    }

    // In a real implementation, we would use the native module to handle pencil events
    // For now, we'll simulate the events for development
    const simulatePencilEvent = (type: PencilInteractionType) => {
      onInteraction({
        type,
        x: Math.random() * 100,
        y: Math.random() * 100,
        pressure: Math.random(),
        altitude: Math.random() * Math.PI * 2,
        azimuth: Math.random() * Math.PI * 2,
      });
    };

    // Add event listeners for pencil interactions
    const eventEmitter = new NativeEventEmitter(NativeModules.PencilManager);
    const subscription = eventEmitter.addListener(
      'pencilInteraction',
      (event: PencilInteractionEvent) => {
        onInteraction(event);
      }
    );

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [onInteraction, enabled]);
};

// Utility function to determine if an interaction is precise enough for Apple Pencil
export const isPreciseInteraction = (pressure: number, altitude: number): boolean => {
  return pressure > 0.5 && altitude < Math.PI / 4;
};

// Constants for pencil interaction
export const PENCIL_CONSTANTS = {
  PRESSURE_THRESHOLD: 0.5,
  ALTITUDE_THRESHOLD: Math.PI / 4,
  DOUBLE_TAP_TIMEOUT: 300,
  LONG_PRESS_TIMEOUT: 500,
};
