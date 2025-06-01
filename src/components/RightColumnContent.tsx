import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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

const DEDOLA_LOGO = 'https://dedola.com/wp-content/uploads/2025/04/DedolaLogo2025.png';

interface SocialPost {
  id: string;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  title: string;
  preview: string;
  date: string;
  url: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  url: string;
  image?: string;
}

const recentSocialPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'linkedin',
    title: 'Dedola Global Logistics on LinkedIn',
    preview: 'Follow us for logistics news, insights, and company updates.',
    date: 'Now',
    url: 'https://www.linkedin.com/company/dedola-global-logistics/',
  },
  {
    id: '2',
    platform: 'twitter',
    title: 'Dedola Global on Twitter',
    preview: 'Real-time supply chain updates and industry news.',
    date: 'Now',
    url: 'https://twitter.com/dglsupplychain',
  },
  {
    id: '3',
    platform: 'instagram',
    title: 'Dedola Global on Instagram',
    preview: 'See our team and operations in action.',
    date: 'Now',
    url: 'https://www.instagram.com/dedola_global',
  },
  {
    id: '4',
    platform: 'facebook',
    title: 'Dedola Global on Facebook',
    preview: 'Connect with us for company news and events.',
    date: 'Now',
    url: 'https://www.facebook.com/DedolaGlobalLogistics',
  },
];

const recentBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Avoid Rolled Shipments This Peak Season',
    excerpt: "Learn how to avoid rolled shipments with proven strategies for 2025's peak season.",
    date: 'May 2025',
    url: 'https://dedola.com/2025/05/avoid-rolled-shipments-this-peak-season/',
    image: DEDOLA_LOGO,
  },
  {
    id: '2',
    title: 'FTZ vs Bonded Warehouse vs Bonded CFS Entry',
    excerpt: 'Section 301 tariffs remain high for China imports. Learn how FTZs, bonded warehouses, and CFS entries help U.S. importers defer duties and reduce costs.',
    date: 'May 2025',
    url: 'https://dedola.com/2025/05/ftz-vs-bonded-warehouse-vs-bonded-cfs-entry/',
    image: DEDOLA_LOGO,
  },
];

const RightColumnContent = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleInAppPress = (url: string, title?: string, platform?: string) => {
    navigation.navigate('InAppWebView', { url, title });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'logo-linkedin';
      case 'twitter':
        return 'logo-twitter';
      case 'instagram':
        return 'logo-instagram';
      case 'facebook':
        return 'logo-facebook';
      default:
        return 'globe-outline';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return '#0077B5';
      case 'twitter':
        return '#1DA1F2';
      case 'instagram':
        return '#E1306C';
      case 'facebook':
        return '#1877F3';
      default:
        return COLORS.lightBlue;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Dedola Logo at the top */}
      <View style={styles.logoContainer}>
        <Image source={{ uri: DEDOLA_LOGO }} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Call to Action Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Stay Updated with Dedola</Text>
        <Text style={styles.ctaText}>
          Follow us on social media and subscribe to our blog for the latest updates in international logistics and supply chain.
        </Text>
        <View style={styles.ctaButtons}>
          <TouchableOpacity
            style={[styles.ctaButton, styles.primaryButton]}
            onPress={() => handleInAppPress('https://dedola.com/blog/', 'Dedola Blog')}
          >
            <Text style={styles.primaryButtonText}>Visit Blog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButton, styles.secondaryButton]}
            onPress={() => handleInAppPress('https://dedola.com/contact/', 'Contact Dedola')}
          >
            <Text style={styles.secondaryButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Social Media Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media</Text>
        {recentSocialPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.socialCard}
            onPress={() => handleInAppPress(post.url, post.title, post.platform)}
          >
            <View style={styles.socialHeader}>
              <Ionicons
                name={getPlatformIcon(post.platform)}
                size={28}
                color={getPlatformColor(post.platform)}
                style={styles.socialIcon}
              />
              <Text style={styles.platformName} numberOfLines={1}>
                {post.title}
              </Text>
            </View>
            <Text style={styles.postPreview} numberOfLines={2}>
              {post.preview}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Blog Posts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest Blog Posts</Text>
        {recentBlogPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.blogCard}
            onPress={() => handleInAppPress(post.url, post.title)}
          >
            <View style={styles.blogHeader}>
              <Image source={{ uri: post.image || DEDOLA_LOGO }} style={styles.blogImage} />
              <Text style={styles.blogTitle} numberOfLines={2}>{post.title}</Text>
            </View>
            <Text style={styles.blogExcerpt} numberOfLines={2}>
              {post.excerpt}
            </Text>
            <Text style={styles.date}>{post.date}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 32,
  },
  logoImage: {
    width: 240,
    height: 80,
  },
  ctaSection: {
    padding: 12,
    backgroundColor: COLORS.lightBlue,
    marginBottom: 10,
    borderRadius: 8,
  },
  ctaTitle: {
    fontSize: isTablet() ? 18 : 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  ctaText: {
    fontSize: isTablet() ? 13 : 12,
    color: COLORS.white,
    marginBottom: 10,
    lineHeight: isTablet() ? 18 : 16,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ctaButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  primaryButtonText: {
    color: COLORS.lightBlue,
    fontSize: isTablet() ? 13 : 12,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: isTablet() ? 13 : 12,
    fontWeight: '600',
  },
  section: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  sectionTitle: {
    fontSize: isTablet() ? 15 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  socialCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  socialIcon: {
    marginRight: 8,
  },
  platformName: {
    fontSize: isTablet() ? 13 : 12,
    fontWeight: '600',
    color: COLORS.darkBlue,
    flex: 1,
  },
  postPreview: {
    fontSize: isTablet() ? 12 : 11,
    color: COLORS.darkGray,
    lineHeight: isTablet() ? 16 : 14,
  },
  blogCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  blogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  blogImage: {
    width: 28,
    height: 28,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  blogTitle: {
    fontSize: isTablet() ? 13 : 12,
    fontWeight: '600',
    color: COLORS.darkBlue,
    flex: 1,
  },
  blogExcerpt: {
    fontSize: isTablet() ? 12 : 11,
    color: COLORS.darkGray,
    lineHeight: isTablet() ? 16 : 14,
    marginBottom: 4,
  },
  date: {
    fontSize: isTablet() ? 11 : 10,
    color: COLORS.darkGray,
  },
});

export default RightColumnContent;
