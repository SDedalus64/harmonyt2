// InAppWebViewScreen.tsx //
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

// Brand colors
const COLORS = {
  darkBlue: '#0B2953',
  lightBlue: '#4397EC',
  orange: '#E67E23',
  white: '#FFFFFF',
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
  darkGray: '#666666',
};

type InAppWebViewScreenRouteProp = RouteProp<RootStackParamList, 'InAppWebView'>;

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
         onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
         }}
         onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
         }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  navBar: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.mediumGray, backgroundColor: COLORS.lightGray },
  navButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginHorizontal: 4, backgroundColor: COLORS.lightBlue },
  disabledButton: { opacity: 0.5 },
  navButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
