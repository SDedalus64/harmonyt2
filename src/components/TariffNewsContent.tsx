import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  url: string;
  image?: string;
}

interface Props {
  visible?: boolean;
}

const COLORS = {
  darkBlue: '#0B2953',
  lightBlue: '#4397EC',
  lightGray: '#F8F8F8',
  darkGray: '#666666',
  white: '#FFFFFF',
};

const DEDOLA_LOGO = 'https://dedola.com/wp-content/uploads/2025/04/DedolaLogo2025.png';

const TariffNewsContent: React.FC<Props> = ({ visible = true }) => {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const fetchRssFeed = async (label: string, rssUrl: string) => {
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
          rssUrl,
        )}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const json = await res.json();
          const items: NewsItem[] = json.items.slice(0, 10).map((i: any) => ({
            id: i.guid || i.link,
            title: i.title,
            excerpt: (i.description || '').replace(/<[^>]*>/g, '').substring(0, 140) + '...',
            date: new Date(i.pubDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            url: i.link,
            image: i.thumbnail || DEDOLA_LOGO,
          }));
          setPosts((prev) => [...prev, ...items]);
        }
      } catch (e) {
        console.error(`Error fetching ${label} feed`, e);
      }
    };

    // USITC HTS revision info (placeholder JSON endpoint)
    const fetchHtsRevision = async () => {
      try {
        const res = await fetch('https://hts.usitc.gov/static/revision.json');
        if (res.ok) {
          const json = await res.json(); // { revision: '15', date: '2025-06-15' }
          setPosts((prev) => [
            {
              id: 'hts-rev-' + json.revision,
              title: `HTS Revision ${json.revision} Released`,
              excerpt: 'Latest tariff schedule update published by USITC.',
              date: new Date(json.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              url: 'https://hts.usitc.gov',
              image: DEDOLA_LOGO,
            },
            ...prev,
          ]);
        }
      } catch {}
    };

    setLoading(true);
    setPosts([]);
    await Promise.all([
      // CBP Press Releases (Customs & Border Protection)
      fetchRssFeed('CBP', 'https://www.cbp.gov/rss/press-release'),
      // USTR Press Releases (United States Trade Representative)
      fetchRssFeed('USTR', 'https://ustr.gov/rss/press'),
    ]);
    await fetchHtsRevision();
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible]);

  const openExternal = (url: string) => Linking.openURL(url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Trade News</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.lightBlue} style={{ marginTop: 20 }} />
      ) : (
        posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.card}
            onPress={() => openExternal(post.url)}
          >
            <View style={styles.row}>
              <Image source={{ uri: post.image }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
                <Text style={styles.excerpt} numberOfLines={2}>{post.excerpt}</Text>
                <Text style={styles.date}>{post.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 12,
  },
  header: {
    fontSize: isTablet() ? 18 : 16,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: isTablet() ? 14 : 13,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  excerpt: {
    fontSize: isTablet() ? 12 : 11,
    color: COLORS.darkGray,
  },
  date: {
    fontSize: isTablet() ? 11 : 10,
    color: COLORS.darkGray,
    marginTop: 2,
  },
});

export default TariffNewsContent; 