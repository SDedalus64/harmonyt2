/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async function (context, req) {
  context.log("Trade News Feed function triggered");

  try {
    const newsItems = [];

    // 1. CBP Trade Bulletins & HTS Updates
    const cbpNews = await fetchCBPNews(context);
    newsItems.push(...cbpNews);

    // 2. USTR Trade Announcements
    const ustrNews = await fetchUSTRNews(context);
    newsItems.push(...ustrNews);

    // 3. Federal Register Trade Entries
    const federalRegisterNews = await fetchFederalRegisterTrade(context);
    newsItems.push(...federalRegisterNews);

    // 4. Census Bureau Trade Statistics
    const censusStats = await fetchCensusTradeStats(context);
    newsItems.push(...censusStats);

    // Sort by date (newest first) and limit to 50 items
    const sortedNews = newsItems
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50);

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: {
        success: true,
        count: sortedNews.length,
        lastUpdated: new Date().toISOString(),
        items: sortedNews,
      },
    };
  } catch (error) {
    context.log.error("Error fetching trade news:", error);
    context.res = {
      status: 500,
      body: {
        success: false,
        error: error.message,
      },
    };
  }
};

async function fetchCBPNews(context) {
  try {
    context.log("Fetching CBP news...");
    const response = await axios.get(
      "https://www.cbp.gov/newsroom/trade-bulletins",
      {
        timeout: 10000,
      },
    );

    const $ = cheerio.load(response.data);
    const items = [];

    $(".view-content .views-row").each((i, element) => {
      if (i >= 10) return; // Limit to 10 items

      const $elem = $(element);
      const title = $elem.find(".field-title a").text().trim();
      const link = $elem.find(".field-title a").attr("href");
      const date = $elem.find(".field-post-date").text().trim();
      const summary = $elem.find(".field-body").text().trim().substring(0, 200);

      if (title && link) {
        items.push({
          id: `cbp-${Date.now()}-${i}`,
          title,
          summary: summary || "CBP Trade Bulletin",
          url: link.startsWith("http") ? link : `https://www.cbp.gov${link}`,
          source: "CBP",
          category: "regulatory",
          date: parseDate(date) || new Date().toISOString(),
          priority: title.toLowerCase().includes("hts") ? "high" : "medium",
        });
      }
    });

    context.log(`Found ${items.length} CBP items`);
    return items;
  } catch (error) {
    context.log.warn("CBP fetch failed:", error.message);
    return [];
  }
}

async function fetchUSTRNews(context) {
  try {
    context.log("Fetching USTR news...");
    const response = await axios.get(
      "https://ustr.gov/about-us/policy-offices/press-office/press-releases",
      {
        timeout: 10000,
      },
    );

    const $ = cheerio.load(response.data);
    const items = [];

    $(".view-content .views-row").each((i, element) => {
      if (i >= 10) return;

      const $elem = $(element);
      const title = $elem.find("h3 a").text().trim();
      const link = $elem.find("h3 a").attr("href");
      const date = $elem.find(".date-display-single").text().trim();

      if (
        title &&
        link &&
        (title.toLowerCase().includes("china") ||
          title.toLowerCase().includes("tariff") ||
          title.toLowerCase().includes("trade"))
      ) {
        items.push({
          id: `ustr-${Date.now()}-${i}`,
          title,
          summary: "USTR Trade Announcement",
          url: link.startsWith("http") ? link : `https://ustr.gov${link}`,
          source: "USTR",
          category: "policy",
          date: parseDate(date) || new Date().toISOString(),
          priority: title.toLowerCase().includes("china") ? "high" : "medium",
        });
      }
    });

    context.log(`Found ${items.length} USTR items`);
    return items;
  } catch (error) {
    context.log.warn("USTR fetch failed:", error.message);
    return [];
  }
}

async function fetchFederalRegisterTrade(context) {
  try {
    context.log("Fetching Federal Register trade entries...");
    const response = await axios.get(
      "https://www.federalregister.gov/api/v1/articles.json",
      {
        params: {
          "fields[]": ["title", "html_url", "publication_date", "abstract"],
          "conditions[term]":
            'tariff OR "harmonized tariff schedule" OR "trade agreement"',
          "conditions[publication_date][gte]": new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0], // Last 30 days
          per_page: 10,
        },
        timeout: 10000,
      },
    );

    const items = response.data.results.map((article, i) => ({
      id: `fr-${Date.now()}-${i}`,
      title: article.title,
      summary: article.abstract || "Federal Register Trade Entry",
      url: article.html_url,
      source: "Federal Register",
      category: "regulatory",
      date: article.publication_date + "T00:00:00Z",
      priority: article.title.toLowerCase().includes("hts") ? "high" : "medium",
    }));

    context.log(`Found ${items.length} Federal Register items`);
    return items;
  } catch (error) {
    context.log.warn("Federal Register fetch failed:", error.message);
    return [];
  }
}

async function fetchCensusTradeStats(context) {
  try {
    context.log("Fetching Census trade statistics...");
    // Note: This is a simplified example - Census API requires more specific endpoints
    const items = [
      {
        id: `census-${Date.now()}`,
        title: "Monthly Trade Statistics Available",
        summary:
          "Latest U.S. international trade data and statistics from Census Bureau",
        url: "https://www.census.gov/foreign-trade/statistics/",
        source: "Census Bureau",
        category: "statistics",
        date: new Date().toISOString(),
        priority: "low",
      },
    ];

    context.log(`Added ${items.length} Census placeholder items`);
    return items;
  } catch (error) {
    context.log.warn("Census fetch failed:", error.message);
    return [];
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;

  // Handle various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
}
