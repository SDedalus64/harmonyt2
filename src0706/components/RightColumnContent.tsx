import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isTablet } from "../platform/deviceUtils";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/types";

import { BRAND_TYPOGRAPHY } from "../config/brandColors";
import { blogService, BlogPost } from "../services/blogService";

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

// Using local Dedola logo from assets
const DEDOLA_LOGO = require("../../assets/Dedola_Colorful.png");

interface SocialPost {
  id: string;
  platform: "linkedin" | "twitter" | "instagram" | "facebook";
  title: string;
  preview: string;
  date: string;
  url: string;
}

const recentSocialPosts: SocialPost[] = [
  {
    id: "1",
    platform: "linkedin",
    title: "Dedola Global Logistics on LinkedIn",
    preview: "Follow us for logistics news, insights, and company updates.",
    date: "Now",
    url: "https://www.linkedin.com/company/dedola-global-logistics/",
  },
  {
    id: "2",
    platform: "twitter",
    title: "Dedola Global on Twitter",
    preview: "Real-time supply chain updates and industry news.",
    date: "Now",
    url: "https://twitter.com/dglsupplychain",
  },
  {
    id: "3",
    platform: "instagram",
    title: "Dedola Global on Instagram",
    preview: "See our team and operations in action.",
    date: "Now",
    url: "https://www.instagram.com/dedola_global",
  },
  {
    id: "4",
    platform: "facebook",
    title: "Dedola Global on Facebook",
    preview: "Connect with us for company news and events.",
    date: "Now",
    url: "https://www.facebook.com/DedolaGlobalLogistics",
  },
];

const RightColumnContent = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  // Handle app state changes to refresh when returning from external links
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        // App has come to the foreground, refresh data if needed
        console.log("App returned to foreground, refreshing data...");
        fetchBlogs();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [appState]);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will run when the screen comes into focus
      if (blogPosts.length === 0) {
        fetchBlogs();
      }
    }, [blogPosts.length]),
  );

  const fetchBlogs = async () => {
    try {
      setLoading(true);

      // First check if we have cached posts
      const cachedPosts = blogService.getCachedPosts();
      if (cachedPosts.length > 0) {
        setBlogPosts(cachedPosts);
        setLoading(false);
      }

      // Then fetch fresh data (which will update the cache)
      const posts = await blogService.fetchBlogs();
      setBlogPosts(posts);
    } catch (e) {
      console.error("Error fetching blog posts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleInAppPress = (url: string, title?: string) => {
    navigation.navigate("InAppWebView", { url, title });
  };

  const handleExternalPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
        // Fallback to in-app browser
        navigation.navigate("InAppWebView", { url, title: "External Link" });
      }
    } catch (error) {
      console.error("Error opening external link:", error);
      // Fallback to in-app browser
      navigation.navigate("InAppWebView", { url, title: "External Link" });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return "logo-linkedin";
      case "twitter":
        return "logo-twitter";
      case "instagram":
        return "logo-instagram";
      case "facebook":
        return "logo-facebook";
      default:
        return "globe-outline";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return "#0077B5";
      case "twitter":
        return "#1DA1F2";
      case "instagram":
        return "#E1306C";
      case "facebook":
        return "#1877F3";
      default:
        return COLORS.lightBlue;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Dedola Logo at the top */}
      <View style={styles.logoContainer}>
        <Image
          source={DEDOLA_LOGO}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Social Icons Row */}
        <View style={styles.socialIconsRow}>
          {recentSocialPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.socialIconButton}
              onPress={() => handleExternalPress(post.url)}
            >
              <Ionicons
                name={getPlatformIcon(post.platform)}
                size={28}
                color={getPlatformColor(post.platform)}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Call to Action Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Stay Updated with Dedola</Text>
        <Text style={styles.ctaText}>
          Follow us on social media and subscribe to our blog for the latest
          updates in international logistics and supply chain.
        </Text>
        <View style={styles.ctaButtons}>
          <TouchableOpacity
            style={[styles.ctaButton, styles.primaryButton]}
            onPress={() =>
              handleInAppPress("https://dedola.com/blog/", "Dedola Blog")
            }
          >
            <Text style={styles.primaryButtonText}>Visit Blog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButton, styles.secondaryButton]}
            onPress={() =>
              handleInAppPress("https://dedola.com/contact/", "Contact Dedola")
            }
          >
            <Text style={styles.secondaryButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Blog Posts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest Blog Posts</Text>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.lightBlue}
            style={{ marginVertical: 20 }}
          />
        ) : (
          blogPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.blogCard}
              onPress={() => handleInAppPress(post.url, post.title)}
            >
              <View style={styles.blogHeader}>
                <Image
                  source={post.image ? { uri: post.image } : DEDOLA_LOGO}
                  style={styles.blogImage}
                />
                <Text style={styles.blogTitle} numberOfLines={2}>
                  {post.title}
                </Text>
              </View>
              <Text style={styles.blogExcerpt} numberOfLines={2}>
                {post.excerpt}
              </Text>
              <Text style={styles.date}>{post.date}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  blogCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 8,
    padding: 8,
  },
  blogExcerpt: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 18 : 16.5,
    lineHeight: isTablet() ? 24 : 21,
    marginBottom: 4,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  blogHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 4,
  },
  blogImage: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    height: 28,
    marginRight: 8,
    width: 28,
  },
  blogTitle: {
    fontSize: isTablet() ? 19.5 : 18,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: COLORS.darkBlue,
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  ctaButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    padding: 8,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 8,
  },
  ctaSection: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: isTablet() ? 13 : 12,
    lineHeight: isTablet() ? 18 : 16,
    marginBottom: 10,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  ctaTitle: {
    fontSize: isTablet() ? 18 : 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: COLORS.white,
    marginBottom: 4,
  },
  date: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 16.5 : 15,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
    marginTop: 32,
  },
  logoImage: {
    height: 160,
    width: 480,
  },
  platformName: {
    fontSize: isTablet() ? 13 : 12,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: COLORS.darkBlue,
    flex: 1,
  },
  postPreview: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 12 : 11,
    lineHeight: isTablet() ? 16 : 14,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  primaryButton: {
    backgroundColor: COLORS.white,
  },
  primaryButtonText: {
    color: COLORS.lightBlue,
    fontSize: isTablet() ? 13 : 12,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: COLORS.white,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: isTablet() ? 13 : 12,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  },
  section: {
    borderBottomColor: COLORS.mediumGray,
    borderBottomWidth: 1,
    padding: 8,
  },
  sectionTitle: {
    fontSize: isTablet() ? 22.5 : 21,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  socialCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 8,
    padding: 8,
  },
  socialHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 4,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialIconButton: {
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    justifyContent: "center",
    padding: 6,
  },
  socialIconsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 12,
  },
});

export default RightColumnContent;
