import React from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

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

  const LoadingIndicatorView = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.lightBlue} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        startInLoadingState={true}
        renderLoading={() => <LoadingIndicatorView />}
        style={styles.webview}
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
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
