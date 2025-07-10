import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../navigation/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  BRAND_COLORS as COLORS,
  BRAND_TYPOGRAPHY,
} from "../config/brandColors";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// Storage key to track if user has previously signed in
const HAS_SIGNED_IN_KEY = "@HarmonyTi:hasSignedIn";

type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  companyName: string;
}

export default function RegistrationScreen() {
  const navigation = useNavigation<RegistrationScreenNavigationProp>();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    companyName: "",
  });

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      companyName: "",
    };

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    // Validate company name
    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name, companyName, receiveUpdates);
      // Mark that user has signed in
      await AsyncStorage.setItem(HAS_SIGNED_IN_KEY, "true");
      // After successful registration, navigate to login
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "Login", params: { email } }],
      });
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Registration Failed", "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardDismissMode="on-drag"
          extraScrollHeight={20}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Register to save your lookups and receive tariff insights
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.darkGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.darkGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.darkGray}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.darkGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.name ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.darkGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  autoCorrect={false}
                />
              </View>
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Company Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Company Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.companyName ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={COLORS.darkGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Enter your company name"
                  autoCorrect={false}
                />
              </View>
              {errors.companyName ? (
                <Text style={styles.errorText}>{errors.companyName}</Text>
              ) : null}
            </View>

            {/* Marketing Preferences */}
            <View style={styles.switchContainer}>
              <Switch
                value={receiveUpdates}
                onValueChange={setReceiveUpdates}
                trackColor={{
                  false: COLORS.mediumGray,
                  true: COLORS.lightBlue,
                }}
                thumbColor={receiveUpdates ? COLORS.white : COLORS.white}
              />
              <Text style={styles.switchLabel}>
                Yes, I'd like to receive updates and offers from Dedola Global
                Logistics.
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  form: {
    gap: 20,
  },
  header: {
    marginBottom: 32,
  },
  input: {
    color: COLORS.black,
    flex: 1,
    fontSize: 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.mediumGray,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    height: 56,
    paddingHorizontal: 16,
  },
  label: {
    color: COLORS.black,
    fontSize: 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    marginBottom: 8,
  },
  loginLink: {
    color: COLORS.lightBlue,
    fontSize: 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: 4,
  },
  loginLinkContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: COLORS.darkGray,
    fontSize: 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  registerButton: {
    alignItems: "center",
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    elevation: 8,
    height: 56,
    justifyContent: "center",
    marginTop: 16,
    shadowColor: COLORS.lightBlue,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  subtitle: {
    color: COLORS.darkGray,
    fontSize: 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  switchContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 8,
  },
  switchLabel: {
    color: COLORS.darkGray,
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  title: {
    color: COLORS.darkBlue,
    fontSize: 28,
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    marginBottom: 8,
  },
});
