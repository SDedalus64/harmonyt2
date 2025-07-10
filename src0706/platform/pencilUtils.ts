import React from 'react';
import { Platform } from 'react-native';

/**
 * Apple Pencil Utilities
 *
 * Note: This module provides basic Apple Pencil detection and simulation.
 * For full Apple Pencil support, native modules would need to be implemented.
 *
 * Current implementation:
 * - Detects iPad devices where Apple Pencil could be available
 * - Provides simulation for development purposes
 * - Documents what native implementation would require
 */

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

/**
 * Custom hook for Apple Pencil interactions
 *
 * Note: This currently provides simulation only.
 * For real Apple Pencil support, you would need:
 * 1. Native iOS module to handle UIPencilInteraction
 * 2. Native event emitter for pencil events
 * 3. Proper pressure and angle detection
 *
 * @param onInteraction Callback for pencil interactions
 * @param enabled Whether pencil interaction is enabled
 */
export const usePencilInteraction = (
  onInteraction: (event: PencilInteractionEvent) => void,
  enabled: boolean = true
) => {
  React.useEffect(() => {
    if (!isApplePencilAvailable() || !enabled) {
      return;
    }

    console.log('Apple Pencil interaction simulation enabled (native module required for real functionality)');

    // Simulation for development purposes
    // In a real implementation, this would connect to a native module
    let simulationInterval: NodeJS.Timeout | null = null;

    if (__DEV__) {
      // Simulate pencil events every 10 seconds in development
      simulationInterval = setInterval(() => {
        const simulatedEvent: PencilInteractionEvent = {
          type: 'tap',
          x: Math.random() * 100,
          y: Math.random() * 100,
          pressure: Math.random(),
          altitude: Math.random() * Math.PI * 2,
          azimuth: Math.random() * Math.PI * 2,
        };
        console.log('Simulated Apple Pencil interaction:', simulatedEvent);
        onInteraction(simulatedEvent);
      }, 10000);
    }

    // Cleanup
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
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
} as const;
