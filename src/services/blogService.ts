interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  url: string;
  image?: string;
}

class BlogService {
  private static instance: BlogService;
  private blogPosts: BlogPost[] = [];
  private isLoading: boolean = false;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly DEDOLA_LOGO = require("../../assets/Dedola_Colorful.png");

  private constructor() {}

  static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  async fetchBlogs(forceRefresh: boolean = false): Promise<BlogPost[]> {
    const now = Date.now();

    // Return cached data if available and not expired
    if (
      !forceRefresh &&
      this.blogPosts.length > 0 &&
      now - this.lastFetchTime < this.CACHE_DURATION
    ) {
      console.log("📰 Returning cached blog posts");
      return this.blogPosts;
    }

    // Prevent multiple simultaneous fetches
    if (this.isLoading) {
      console.log("📰 Blog fetch already in progress");
      return this.blogPosts;
    }

    this.isLoading = true;
    console.log("📰 Fetching blog posts from API...");

    try {
      const response = await fetch(
        "https://dedola.com/wp-json/wp/v2/posts?per_page=15&_embed",
      );

      if (response.ok) {
        const posts = await response.json();

        this.blogPosts = posts.map((post: any) => {
          let featuredImage = null; // Use null for local logo fallback

          try {
            if (
              post._embedded &&
              post._embedded["wp:featuredmedia"] &&
              post._embedded["wp:featuredmedia"][0]
            ) {
              const media = post._embedded["wp:featuredmedia"][0];
              if (media.media_details && media.media_details.sizes) {
                featuredImage =
                  media.media_details.sizes.medium?.source_url ||
                  media.media_details.sizes.thumbnail?.source_url ||
                  media.media_details.sizes.full?.source_url ||
                  media.source_url ||
                  null;
              } else if (media.source_url) {
                featuredImage = media.source_url;
              }
            }
          } catch (e) {
            console.log("Error extracting featured image");
          }

          return {
            id: String(post.id),
            title: post.title.rendered,
            excerpt:
              post.excerpt.rendered.replace(/<[^>]*>/g, "").substring(0, 150) +
              "...",
            date: new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            url: post.link,
            image: featuredImage,
          };
        });

        this.lastFetchTime = now;
        console.log(
          `📰 Successfully fetched ${this.blogPosts.length} blog posts`,
        );
      }
    } catch (error) {
      console.error("📰 Error fetching blog posts:", error);
    } finally {
      this.isLoading = false;
    }

    return this.blogPosts;
  }

  getCachedPosts(): BlogPost[] {
    return this.blogPosts;
  }

  preloadBlogs(): void {
    // Fire and forget - preload blogs in the background
    this.fetchBlogs().catch((error) => {
      console.error("📰 Error preloading blog posts:", error);
    });
  }
}

export const blogService = BlogService.getInstance();
export type { BlogPost };
