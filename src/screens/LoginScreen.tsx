import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../navigation/contexts/AuthContext';
import { isTablet } from '../platform/deviceUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_COLORS, BRAND_TYPOGRAPHY, getTypographySize, getResponsiveValue } from '../config/brandColors';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Storage key to track if user has previously signed in
const HAS_SIGNED_IN_KEY = '@HarmonyTi:hasSignedIn';

// Brand colors
const COLORS = {
  darkBlue: '#023559',
  lightBlue: '#0A99F2',
  orange: '#E67E23',
  yellow: '#FFD800',
  white: '#FFFFFF',
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
  darkGray: '#666666',
  black: '#333333',
  error: '#FF3B30',
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSignedInBefore, setHasSignedInBefore] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Check if user has signed in before
    const checkPreviousSignIn = async () => {
      try {
        const hasSignedIn = await AsyncStorage.getItem(HAS_SIGNED_IN_KEY);
        setHasSignedInBefore(hasSignedIn === 'true');
      } catch (error) {
        console.error('Error checking previous sign in:', error);
      }
    };
    checkPreviousSignIn();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Mark that user has signed in
      await AsyncStorage.setItem(HAS_SIGNED_IN_KEY, 'true');
      // Navigation will be handled automatically by AppNavigator
      // when isAuthenticated becomes true
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Registration');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isTablet() ? (
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.contentContainer}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoContainer}
                >
                  <Image
                    source={require('../../assets/Harmony2x.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.welcomeText}>
                  {hasSignedInBefore ? 'Welcome Back' : 'Welcome'}
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.passwordWrapper}>
                  <TextInput
                      style={styles.passwordInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={COLORS.darkGray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>Log In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                >
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            extraScrollHeight={20}
          >
            <View style={styles.contentContainer}>
              <View style={[styles.logoContainer, styles.phoneLogoContainer]}>
                <LinearGradient
                  colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.logoContainer, styles.phoneLogoContainer]}
                >
                  <Image
                    source={require('../../assets/Harmony2x.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.welcomeText}>
                  {hasSignedInBefore ? 'Welcome Back' : 'Welcome'}
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.passwordWrapper}>
                  <TextInput
                      style={styles.passwordInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={COLORS.darkGray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>Log In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                >
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: isTablet() ? 1200 : screenWidth * 0.9,
    height: isTablet() ? 240 : 140,
  },
  phoneLogoContainer: {
    minHeight: 220,
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 3,
  },
  formContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  welcomeText: {
    fontSize: getResponsiveValue(getTypographySize('xl'), getTypographySize('xxxl')),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.darkNavy,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    width: isTablet() ? '50%' : '100%',
    alignSelf: isTablet() ? 'center' : 'stretch',
  },
  input: {
    fontSize: 16,
    color: COLORS.black,
  },
  loginButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    width: isTablet() ? '50%' : '100%',
    alignSelf: isTablet() ? 'center' : 'stretch',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  signUpButton: {
    marginTop: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: isTablet() ? '50%' : '100%',
    alignSelf: isTablet() ? 'center' : 'stretch',
  },
  signUpButtonText: {
    color: COLORS.lightBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  eyeIcon: {
    marginLeft: 8,
    marginRight: -8,
  },
});
