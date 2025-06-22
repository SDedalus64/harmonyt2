import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';
import {
  getResponsiveValue,
  getSpacing,
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_SHADOWS,
  getTypographySize,
  getBorderRadius
} from '../config/brandColors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { DiagonalSection } from '../components/shared/DiagonalSection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Diagonal Background Section with Logo */}
        <DiagonalSection height={getResponsiveValue(SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.25)} style={styles.heroSection}>
          <View style={styles.socialAndLogoRow}>
            {/* Left icons */}
            <View style={styles.socialIconsSide}>
              {recentSocialPosts.slice(0, Math.floor(recentSocialPosts.length / 2)).map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.socialIconButton}
                  onPress={() => handlePress(post.url)}
                  accessibilityLabel={post.title}
                >
                  <Ionicons
                    name={getPlatformIcon(post.platform) as any}
                    size={getResponsiveValue(28, 32)}
                    color={BRAND_COLORS.white}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {/* Center Logo */}
            <View style={styles.logoContainerHorizontal}>
              <Image
                source={require('../../assets/Dedola_White.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            {/* Right icons */}
            <View style={styles.socialIconsSide}>
              {recentSocialPosts.slice(Math.floor(recentSocialPosts.length / 2)).map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.socialIconButton}
                  onPress={() => handlePress(post.url)}
                  accessibilityLabel={post.title}
                >
                  <Ionicons
                    name={getPlatformIcon(post.platform) as any}
                    size={getResponsiveValue(28, 32)}
                    color={BRAND_COLORS.white}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </DiagonalSection>

        {/* Main Content Area */}
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Blog Section */}
          <View style={styles.blogSection}>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>2025 Blog Posts</Text>
              {blogPosts.length > 0 && (
                <View style={styles.dataSourceBadge}>
                  <Text style={styles.dataSourceText}>🔄 Live</Text>
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={BRAND_COLORS.electricBlue} />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color={BRAND_COLORS.darkGray} />
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
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={48} color={BRAND_COLORS.darkGray} />
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
                      <Image source={{ uri: image }} style={styles.blogImage} resizeMode="cover" />
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
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    zIndex: 1,
  },
  socialAndLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveValue(12, 16),
  },
  socialIconsSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveValue(12, 16),
  },
  logoContainerHorizontal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.6),
    height: getResponsiveValue((SCREEN_WIDTH * 0.6) * 0.3, (SCREEN_WIDTH * 0.6) * 0.3),
    maxWidth: getResponsiveValue(280, 600),
    maxHeight: getResponsiveValue(84, 180),
  },
  socialIconButton: {
    width: getResponsiveValue(44, 52),
    height: getResponsiveValue(44, 52),
    borderRadius: getResponsiveValue(22, 26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...BRAND_SHADOWS.small,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  blogSection: {
    flex: 1,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('md'),
    backgroundColor: BRAND_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.mediumGray,
  },
  sectionTitle: {
    fontSize: getTypographySize('xl'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.darkNavy,
  },
  dataSourceBadge: {
    backgroundColor: BRAND_COLORS.lightGray,
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
  },
  dataSourceText: {
    fontSize: getTypographySize('xs'),
    color: BRAND_COLORS.darkGray,
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing('xxl'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  errorText: {
    fontSize: getTypographySize('lg'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.error,
    marginTop: getSpacing('md'),
    marginBottom: getSpacing('sm'),
  },
  errorDetail: {
    fontSize: getTypographySize('md'),
    color: BRAND_COLORS.darkGray,
    textAlign: 'center',
    marginBottom: getSpacing('lg'),
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    paddingHorizontal: getSpacing('lg'),
    paddingVertical: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
    ...BRAND_SHADOWS.small,
  },
  retryText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  emptyText: {
    fontSize: getTypographySize('lg'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkGray,
    marginTop: getSpacing('md'),
    marginBottom: getSpacing('sm'),
  },
  emptyDetail: {
    fontSize: getTypographySize('md'),
    color: BRAND_COLORS.darkGray,
    textAlign: 'center',
  },
  blogListContainer: {
    padding: getSpacing('md'),
  },
  blogCard: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('md'),
    marginBottom: getSpacing('md'),
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: BRAND_COLORS.electricBlue,
    ...BRAND_SHADOWS.small,
  },
  blogImage: {
    width: getResponsiveValue(60, 80),
    height: getResponsiveValue(60, 80),
    borderRadius: getBorderRadius('sm'),
    backgroundColor: BRAND_COLORS.white,
  },
  blogTextContent: {
    flex: 1,
    paddingLeft: getSpacing('md'),
  },
  blogTitle: {
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing('xs'),
  },
  blogExcerpt: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
    lineHeight: getTypographySize('sm') * 1.5,
    marginBottom: getSpacing('xs'),
  },
  blogDate: {
    fontSize: getTypographySize('xs'),
    color: BRAND_COLORS.darkGray,
    opacity: 0.8,
  },
});

export default LinksScreen;
