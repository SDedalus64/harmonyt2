import React, { useEffect, useState } from "react";
import { View, StyleSheet, AppState, AppStateStatus } from "react-native";
import { BlurView } from "expo-blur";

interface SecureViewProps {
  children: React.ReactNode;
  enabled?: boolean;
}

const SecureView: React.FC<SecureViewProps> = ({
  children,
  enabled = true,
}) => {
  const [appState, setAppState] = useState(AppState.currentState);
  const [shouldBlur, setShouldBlur] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (enabled) {
        // Blur when app goes to background
        if (
          appState.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          setShouldBlur(true);
        }
        // Unblur when app comes back to foreground
        else if (
          appState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          setShouldBlur(false);
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [appState, enabled]);

  return (
    <View style={styles.container}>
      {children}
      {shouldBlur && enabled && (
        <BlurView
          intensity={100}
          style={StyleSheet.absoluteFillObject}
          tint="dark"
        >
          <View style={styles.blurOverlay} />
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
  },
});

export default SecureView;
