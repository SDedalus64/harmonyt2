// InAppWebViewScreen.tsx //
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text } from "../components/Text";
import { WebView } from "react-native-webview";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { BRAND_COLORS as COLORS } from "../config/brandColors";

type InAppWebViewScreenRouteProp = RouteProp<
  RootStackParamList,
  "InAppWebView"
>;

interface Props {
  route: InAppWebViewScreenRouteProp;
}

export default function InAppWebViewScreen({ route }: Props) {
  const { url, title } = route.params;
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const LoadingIndicatorView = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.lightBlue} />
      </View>
    );
  };

  const handleBack = () => {
    if (webViewRef.current && canGoBack) {
      (webViewRef.current as any).goBack();
    }
  };

  const handleForward = () => {
    if (webViewRef.current && canGoForward) {
      (webViewRef.current as any).goForward();
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Bar (with back and forward buttons) */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={!canGoBack}
          style={[styles.navButton, !canGoBack && styles.disabledButton]}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleForward}
          disabled={!canGoForward}
          style={[styles.navButton, !canGoForward && styles.disabledButton]}
        >
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* In‑App WebView (below the navigation bar) */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        startInLoadingState={true}
        renderLoading={() => <LoadingIndicatorView />}
        style={styles.webview}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        // Smooth scrolling optimizations
        decelerationRate="normal"
        scrollEnabled={true}
        bounces={true}
        contentInsetAdjustmentBehavior="automatic"
        // Android-specific smooth scrolling
        overScrollMode="always"
        nestedScrollEnabled={true}
        // iOS-specific optimizations
        pullToRefreshEnabled={false}
        allowsInlineMediaPlayback={true}
        // Performance optimizations
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // Hardware acceleration for Android
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        // Viewport and content sizing
        scalesPageToFit={Platform.OS === "android"}
        automaticallyAdjustContentInsets={true}
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
          meta.setAttribute('name', 'viewport');
          document.getElementsByTagName('head')[0].appendChild(meta);
          true;
        `}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error: ", nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  disabledButton: { opacity: 0.5 },
  loadingContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    flex: 1,
    justifyContent: "center",
  },
  navBar: {
    backgroundColor: COLORS.lightGray,
    borderBottomColor: COLORS.mediumGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 4,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  webview: {
    backgroundColor: "transparent",
    flex: 1,
  },
});
