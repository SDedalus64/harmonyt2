import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';

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

interface SocialPost {
  id: string;
  platform: 'linkedin' | 'twitter' | 'instagram';
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
}

// Sample data - replace with actual API calls
const recentSocialPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'linkedin',
    title: 'New Trade Agreement Updates',
    preview: 'Stay informed about the latest changes in international trade agreements...',
    date: '2 days ago',
    url: 'https://linkedin.com/company/ratecast',
  },
  {
    id: '2',
    platform: 'twitter',
    title: 'Tariff Rate Changes',
    preview: 'Breaking: New tariff rates announced for multiple product categories...',
    date: '1 day ago',
    url: 'https://twitter.com/ratecast',
  },
  {
    id: '3',
    platform: 'instagram',
    title: 'Behind the Scenes',
    preview: 'Take a look at how our team analyzes trade data...',
    date: '3 days ago',
    url: 'https://instagram.com/ratecast',
  },
];

const recentBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Understanding HTS Codes',
    excerpt: 'A comprehensive guide to navigating the Harmonized Tariff Schedule...',
    date: '1 week ago',
    url: 'https://ratecast.com/blog/hts-codes',
  },
  {
    id: '2',
    title: 'Trade Compliance Best Practices',
    excerpt: 'Essential tips for maintaining compliance in international trade...',
    date: '2 weeks ago',
    url: 'https://ratecast.com/blog/compliance',
  },
];

// Memoize the component to prevent unnecessary re-renders
const DrawerSocialContent = memo(() => {
  const handleSocialPress = (url: string) => {
    // Open URL in new tab/window to prevent navigation state issues
    Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'logo-linkedin';
      case 'twitter':
        return 'logo-twitter';
      case 'instagram':
        return 'logo-instagram';
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
      default:
        return COLORS.lightBlue;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Social Media Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Updates</Text>
        {recentSocialPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.socialCard}
            onPress={() => handleSocialPress(post.url)}
          >
            <View style={styles.socialHeader}>
              <Ionicons
                name={getPlatformIcon(post.platform)}
                size={20}
                color={getPlatformColor(post.platform)}
              />
              <Text style={styles.platformName}>
                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
              </Text>
              <Text style={styles.date}>{post.date}</Text>
            </View>
            <Text style={styles.postTitle}>{post.title}</Text>
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
            onPress={() => handleSocialPress(post.url)}
          >
            <Text style={styles.blogTitle}>{post.title}</Text>
            <Text style={styles.blogExcerpt} numberOfLines={2}>
              {post.excerpt}
            </Text>
            <Text style={styles.date}>{post.date}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
});

// Add display name for debugging
DrawerSocialContent.displayName = 'DrawerSocialContent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  sectionTitle: {
    fontSize: isTablet() ? 18 : 16,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 12,
  },
  socialCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: isTablet() ? 15 : 13,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginLeft: 8,
    flex: 1,
  },
  date: {
    fontSize: isTablet() ? 13 : 11,
    color: COLORS.darkGray,
  },
  postTitle: {
    fontSize: isTablet() ? 16 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  postPreview: {
    fontSize: isTablet() ? 14 : 12,
    color: COLORS.darkGray,
    lineHeight: isTablet() ? 20 : 18,
  },
  blogCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  blogTitle: {
    fontSize: isTablet() ? 16 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  blogExcerpt: {
    fontSize: isTablet() ? 14 : 12,
    color: COLORS.darkGray,
    lineHeight: isTablet() ? 20 : 18,
    marginBottom: 8,
  },
});

export default DrawerSocialContent;
