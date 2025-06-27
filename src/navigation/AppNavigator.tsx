import React, { useState } from "react";
import {
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerNavigationOptions,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";
import { isTablet } from "../platform/deviceUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from "./types";

// Import screens
import LookupScreen from "../screens/LookupScreen";
import HistoryScreen from "../screens/HistoryScreen";
import SettingsScreen from "../screens/SettingsScreen";
import LoginScreen from "../screens/LoginScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import LinksScreen from "../screens/LinksScreen";
import InAppWebViewScreen from "../screens/InAppWebViewScreen";
import CountrySelectionScreen from "../screens/CountrySelectionScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Brand colors
const COLORS = {
  darkBlue: "#0B2953",
  lightBlue: "#4397EC",
  orange: "#E67E23",
  white: "#FFFFFF",
  lightGray: "#F8F8F8",
  mediumGray: "#E1E1E1",
  darkGray: "#666666",
};

// Create navigators with proper typing
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const Drawer = createDrawerNavigator<MainTabParamList>();

interface DrawerIconProps {
  color: string;
  size: number;
  focused: boolean;
}

// Custom drawer content component for iPad
const CustomDrawerContent = (props: any) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const drawerStateRef = React.useRef(isDrawerOpen);

  // Update ref when state changes
  React.useEffect(() => {
    drawerStateRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  const handleDrawerToggle = () => {
    const newState = !drawerStateRef.current;
    setIsDrawerOpen(newState);
    drawerStateRef.current = newState;
  };

  return (
    <Drawer.Navigator
      {...props}
      drawerContent={(drawerProps: DrawerContentComponentProps) => {
        const currentRoute = drawerProps.state.routes[drawerProps.state.index];

        return (
          <View style={styles.drawerContainer}>
            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {drawerProps.state.routes.map((route: any, index: number) => {
                const focused = drawerProps.state.index === index;
                const { options } = drawerProps.descriptors[route.key];
                const label =
                  options.drawerLabel ?? options.title ?? route.name;
                const icon = options.drawerIcon as
                  | ((props: DrawerIconProps) => React.ReactNode)
                  | undefined;

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={() => {
                      drawerProps.navigation.navigate(route.name);
                      if (!drawerStateRef.current) {
                        handleDrawerToggle();
                      }
                    }}
                    style={[
                      styles.drawerItem,
                      focused && styles.drawerItemFocused,
                    ]}
                  >
                    {icon &&
                      icon({
                        color: focused ? COLORS.lightBlue : COLORS.darkGray,
                        size: 24,
                        focused,
                      })}
                    {drawerStateRef.current && (
                      <Text
                        style={[
                          styles.drawerLabel,
                          focused && styles.drawerLabelFocused,
                        ]}
                      >
                        {typeof label === "string" ? label : route.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      }}
      screenOptions={
        {
          drawerStyle: {
            width: isTablet() ? (drawerStateRef.current ? 280 : 60) : 240,
          },
          drawerType: isTablet() ? "permanent" : "front",
          headerStyle: {
            backgroundColor: "#0A99F2",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerLeft: isTablet()
            ? () => (
                <TouchableOpacity
                  onPress={handleDrawerToggle}
                  style={{ marginLeft: 16 }}
                >
                  <Ionicons
                    name={
                      drawerStateRef.current
                        ? "chevron-back"
                        : "chevron-forward"
                    }
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              )
            : undefined,
        } as DrawerNavigationOptions
      }
    >
      <Drawer.Screen
        name="Lookup"
        component={LookupScreen}
        options={{
          drawerIcon: ({ color, size, focused }: DrawerIconProps) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{
          drawerIcon: ({ color, size, focused }: DrawerIconProps) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size, focused }: DrawerIconProps) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

function MainStack() {
  const MainStackNavigator = createNativeStackNavigator<MainTabParamList>();

  return (
    <MainStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStackNavigator.Screen name="Lookup" component={LookupScreen} />
      <MainStackNavigator.Screen name="History" component={HistoryScreen} />
      <MainStackNavigator.Screen name="Settings" component={SettingsScreen} />
      <MainStackNavigator.Screen name="Links" component={LinksScreen} />
    </MainStackNavigator.Navigator>
  );
}

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={
        {
          headerStyle: {
            backgroundColor: "#217DB2",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        } as NativeStackNavigationOptions
      }
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerBackVisible: false, headerShown: false }}
      />
      <AuthStack.Screen name="Registration" component={RegistrationScreen} />
    </AuthStack.Navigator>
  );
}

// Main navigation component that adapts based on device
export function AppNavigator({
  isAuthenticated,
  isFirstLaunch,
}: {
  isAuthenticated: boolean;
  isFirstLaunch: boolean;
}) {
  // Use MainStack with floating navigation
  const MainNavigator = MainStack;

  // Show loading state while auth is being initialized
  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animation: "none" }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ animation: "none" }}
          />
          <Stack.Screen
            name="InAppWebView"
            component={InAppWebViewScreen}
            options={({ route }: any) => ({
              headerShown: true,
              title: route.params?.title || "Web View",
              headerStyle: {
                backgroundColor: COLORS.lightBlue,
              },
              headerTintColor: COLORS.white,
              headerTitleStyle: {
                fontWeight: "600",
              },
            })}
          />
          <Stack.Screen
            name="CountrySelection"
            component={CountrySelectionScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: COLORS.white,
    flex: 1,
    flexDirection: "column",
  },
  drawerItem: {
    alignItems: "center",
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  drawerItemFocused: {
    backgroundColor: COLORS.lightGray,
  },
  drawerLabel: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 16 : 14,
    marginLeft: 16,
  },
  drawerLabelFocused: {
    color: COLORS.lightBlue,
    fontWeight: "600",
  },
  menuContainer: {
    flex: 1,
  },
});
