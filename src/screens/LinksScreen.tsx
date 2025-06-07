import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';
import { getResponsiveValue, getSpacing } from '../config/brandColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const DEDOLA_LOGO = 'https://dedola.com/wp-content/uploads/2025/04/DedolaLogo2025.png';

// RSS feed URL for reference
const BLOG_FEED_URL = 'https://dedola.com/blog/feed/';

const recentSocialPosts = [
  {
    id: '1',
    platform: 'linkedin',
    title: 'Dedola Global Logistics on LinkedIn',
    preview: 'Follow us for logistics news, insights, and company updates.',
    url: 'https://www.linkedin.com/company/dedola-global-logistics/',
  },
  {
    id: '2',
    platform: 'twitter',
    title: 'Dedola Global on Twitter',
    preview: 'Real-time supply chain updates and industry news.',
    url: 'https://twitter.com/dglsupplychain',
  },
  {
    id: '3',
    platform: 'instagram',
    title: 'Dedola Global on Instagram',
    preview: 'See our team and operations in action.',
    url: 'https://www.instagram.com/dedola_global',
  },
  {
    id: '4',
    platform: 'facebook',
    title: 'Dedola Global on Facebook',
    preview: 'Connect with us for company news and events.',
    url: 'https://www.facebook.com/DedolaGlobalLogistics',
  },
];

type LinksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LinksScreen = () => {
  const navigation = useNavigation<LinksScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const logoMarginTop = isTablet() ? 32 : insets.top + 32;

  // Start with empty posts array
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        console.log('Attempting to fetch from WordPress REST API...');
        setError(null);
        setLoading(true);

        // Try WordPress REST API
        const response = await fetch('https://dedola.com/wp-json/wp/v2/posts?per_page=10&after=2025-01-01T00:00:00&_embed');

        console.log('Response status:', response.status);

        if (response.ok) {
          const posts = await response.json();
          console.log('Successfully fetched', posts.length, 'posts from WordPress API');

          // Transform WordPress posts to our format
          const transformedPosts = posts.map((post: any, index: number) => {
            // Try to get featured image from embedded data
            let featuredImage = DEDOLA_LOGO; // Default fallback

            try {
              // Check for featured media in _embedded
              if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
                const media = post._embedded['wp:featuredmedia'][0];
                if (media.media_details && media.media_details.sizes) {
                  // Try to get medium size first, then thumbnail, then full
                  featuredImage = media.media_details.sizes.medium?.source_url ||
                                media.media_details.sizes.thumbnail?.source_url ||
                                media.media_details.sizes.full?.source_url ||
                                media.source_url ||
                                DEDOLA_LOGO;
                } else if (media.source_url) {
                  featuredImage = media.source_url;
                }
              }
            } catch (e) {
              console.log('Error extracting featured image for post:', post.title.rendered);
            }

            return {
              id: String(post.id),
              title: post.title.rendered,
              description: post.excerpt.rendered.replace(/<[^>]*>/g, ''), // Strip HTML
              links: [{ url: post.link }],
              published: post.date,
              enclosures: [],
              featuredImage: featuredImage
            };
          });

          setBlogPosts(transformedPosts);
        } else {
          console.log('WordPress API returned error:', response.status);
          setError('Unable to load blog posts. Please check your connection.');
        }
      } catch (e) {
        console.error('Error fetching from WordPress API:', e);
        setError('Failed to connect to blog. Please try again later.');
      }
      setLoading(false);
    };

    fetchBlogs();
  }, []);

  const handlePress = (url: string) => {
    if (Platform.OS === 'ios' && !isTablet()) {
      Linking.openURL(url);
    } else {
      Linking.openURL(url);
    }
  };

  // Open blog in in-app browser
  const handleBlogPress = (url: string, title: string) => {
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
        return '#217DB2';
    }
  };

  const retry = () => {
    setBlogPosts([]);
    setError(null);
    setLoading(true);

    // Re-fetch blogs
    const fetchBlogs = async () => {
      try {
        console.log('Retrying fetch from WordPress REST API...');
        const response = await fetch('https://dedola.com/wp-json/wp/v2/posts?per_page=10&after=2025-01-01T00:00:00&_embed');

        if (response.ok) {
          const posts = await response.json();
          console.log('Successfully fetched', posts.length, 'posts from WordPress API');

          const transformedPosts = posts.map((post: any, index: number) => {
            // Try to get featured image from embedded data
            let featuredImage = DEDOLA_LOGO; // Default fallback

            try {
              // Check for featured media in _embedded
              if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
                const media = post._embedded['wp:featuredmedia'][0];
                if (media.media_details && media.media_details.sizes) {
                  // Try to get medium size first, then thumbnail, then full
                  featuredImage = media.media_details.sizes.medium?.source_url ||
                                media.media_details.sizes.thumbnail?.source_url ||
                                media.media_details.sizes.full?.source_url ||
                                media.source_url ||
                                DEDOLA_LOGO;
                } else if (media.source_url) {
                  featuredImage = media.source_url;
                }
              }
            } catch (e) {
              console.log('Error extracting featured image for post:', post.title.rendered);
            }

            return {
              id: String(post.id),
              title: post.title.rendered,
              description: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
              links: [{ url: post.link }],
              published: post.date,
              enclosures: [],
              featuredImage: featuredImage
            };
          });

          setBlogPosts(transformedPosts);
        } else {
          setError('Unable to load blog posts. Please check your connection.');
        }
      } catch (e) {
        console.error('Error fetching from WordPress API:', e);
        setError('Failed to connect to blog. Please try again later.');
      }
      setLoading(false);
    };

    fetchBlogs();
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content with Logo and Social Icons at Top */}
      <ScrollView
        style={styles.blogScrollView}
        contentContainerStyle={styles.blogScrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Logo and Social Icons at Top of Content */}
        <View style={styles.topContent}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: DEDOLA_LOGO }} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={styles.socialIconsRow}>
            {recentSocialPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.socialIconButton}
                onPress={() => handlePress(post.url)}
                accessibilityLabel={post.title}
              >
                <Ionicons
                  name={getPlatformIcon(post.platform)}
                  size={32}
                  color={getPlatformColor(post.platform)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Blog Section Header */}
        <View style={styles.blogSectionHeader}>
          <Text style={styles.sectionTitle}>2025 Blog Posts</Text>
          {blogPosts.length > 0 && (
            <View style={styles.dataSourceBadge}>
              <Text style={styles.dataSourceText}>🔄 Live</Text>
            </View>
          )}
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#217DB2" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#999" />
            <Text style={styles.errorText}>Unable to Load Posts</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retry}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : blogPosts.length === 0 ? (
          <View style={[styles.emptyContainer, { paddingHorizontal: getResponsiveValue(20, 28) }]}>
            <Ionicons name="newspaper-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No blog posts available</Text>
            <Text style={styles.emptyDetail}>Check back later for updates</Text>
          </View>
        ) : (
          <View style={styles.blogListContainer}>
            {blogPosts.map((post) => {
              // Use featured image or fallback to logo
              let image = post.featuredImage || DEDOLA_LOGO;
              return (
                <TouchableOpacity
                  key={post.id}
                  style={styles.blogCard}
                  onPress={() => handleBlogPress(post.links[0]?.url || post.id, post.title)}
                  accessibilityLabel={post.title}
                >
                  <Image source={{ uri: image }} style={styles.blogImageLarge} resizeMode="cover" />
                  <View style={styles.blogTextContent}>
                    <Text style={styles.blogTitle}>{post.title}</Text>
                    <Text style={styles.blogExcerpt} numberOfLines={2}>
                      {post.description}
                    </Text>
                    <Text style={styles.blogDate}>
                      {new Date(post.published).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                                    </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topContent: {
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveValue(20, 28), // Increased horizontal padding
    paddingTop: getResponsiveValue(60, 80), // Extra top padding for full screen (safe area)
    paddingBottom: getResponsiveValue(20, 24), // Increased bottom padding
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(24, 32), // Increased margin for better spacing
  },
  logoImage: {
    width: 180,
    height: 60,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#217DB2',
  },
  blogSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveValue(20, 28), // Increased horizontal padding
    paddingVertical: getResponsiveValue(16, 20), // Increased vertical padding
    backgroundColor: '#F8F8F8',
    marginBottom: getResponsiveValue(20, 24), // Increased margin
  },
  blogScrollView: {
    flex: 1,
  },
  blogScrollContent: {
    paddingBottom: getResponsiveValue(80, 100), // Adequate bottom padding for full screen
  },
  socialCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#217DB2',
    flex: 1,
  },
  postPreview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  blogCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: getResponsiveValue(8, 12), // Responsive border radius
    padding: getResponsiveValue(16, 20), // Increased padding
    marginBottom: getResponsiveValue(14, 18), // Increased margin between cards
    flexDirection: 'row',
    alignItems: 'center',
  },

  blogContent: {
    flex: 1,
  },
  blogTextContent: {
    flex: 1,
    paddingLeft: getResponsiveValue(16, 20), // Increased left padding for better spacing
  },
  blogImageLarge: {
    width: isTablet() ? 80 : 60,
    height: isTablet() ? 80 : 60,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  blogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  blogImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  blogTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#217DB2',
    flex: 1,
  },
  blogDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  cachedIndicator: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  blogExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveValue(28, 36), // Increased margin for better spacing
    gap: getResponsiveValue(18, 24), // Increased gap between icons
  },
  socialIconButton: {
    marginHorizontal: getResponsiveValue(8, 12), // Increased horizontal margin
    padding: getResponsiveValue(10, 14), // Increased padding for better touch targets
    borderRadius: getResponsiveValue(24, 28), // Responsive border radius
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogListContainer: {
    paddingHorizontal: getResponsiveValue(20, 28), // Increased horizontal padding
    marginBottom: getResponsiveValue(32, 40), // Increased bottom margin for more space
  },
  loader: {
    marginVertical: getResponsiveValue(24, 32), // Increased margin for better spacing
  },
  errorContainer: {
    padding: getResponsiveValue(24, 32), // Increased padding
    paddingHorizontal: getResponsiveValue(20, 28), // Increased horizontal padding
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#217DB2',
    paddingHorizontal: getResponsiveValue(24, 32), // Increased horizontal padding
    paddingVertical: getResponsiveValue(12, 16), // Increased vertical padding
    borderRadius: getResponsiveValue(8, 12), // Responsive border radius
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  dataSourceBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: getResponsiveValue(12, 16), // Increased horizontal padding
    paddingVertical: getResponsiveValue(6, 8), // Increased vertical padding
    borderRadius: getResponsiveValue(12, 16), // Responsive border radius
  },
  dataSourceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  emptyContainer: {
    minHeight: getResponsiveValue(200, 300), // Use minHeight instead of flex: 1
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveValue(40, 60),
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  emptyDetail: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default LinksScreen;
