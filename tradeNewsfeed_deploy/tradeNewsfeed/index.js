const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function (context, req) {
    context.log('Trade News Feed function processed a request.');

    try {
        const newsItems = [];

        // CBP Trade Bulletins & HTS Updates
        try {
            const cbpData = await fetchCBPNews();
            newsItems.push(...cbpData);
        } catch (error) {
            context.log('CBP fetch failed:', error.message);
        }

        // USTR Trade Announcements
        try {
            const ustrData = await fetchUSTRNews();
            newsItems.push(...ustrData);
        } catch (error) {
            context.log('USTR fetch failed:', error.message);
        }

        // Federal Register Trade Entries
        try {
            const federalRegisterData = await fetchFederalRegisterNews();
            newsItems.push(...federalRegisterData);
        } catch (error) {
            context.log('Federal Register fetch failed:', error.message);
        }

        // Census Bureau Trade Statistics
        try {
            const censusData = await fetchCensusBureauNews();
            newsItems.push(...censusData);
        } catch (error) {
            context.log('Census Bureau fetch failed:', error.message);
        }

        // Sort by priority and date
        const sortedItems = newsItems.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            return new Date(b.date) - new Date(a.date);
        });

  context.res = {
    status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: {
                success: true,
                items: sortedItems,
                timestamp: new Date().toISOString(),
                count: sortedItems.length
            }
        };

    } catch (error) {
        context.log('Error in trade news function:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: 'Failed to fetch trade news',
                timestamp: new Date().toISOString()
            }
        };
    }
};

async function fetchCBPNews() {
    const items = [];
    
    try {
        // CBP Trade Bulletins
        const response = await axios.get('https://www.cbp.gov/newsroom/trade-bulletins', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        $('.view-content .views-row').slice(0, 5).each((i, element) => {
            const titleElement = $(element).find('h3 a, .field-title a').first();
            const title = titleElement.text().trim();
            const relativeUrl = titleElement.attr('href');
            const url = relativeUrl ? `https://www.cbp.gov${relativeUrl}` : '';
            
            const summaryElement = $(element).find('.field-body, .body, .field-content').first();
            const summary = summaryElement.text().trim().substring(0, 200) + '...';
            
            const dateElement = $(element).find('.date-display-single, .field-date').first();
            const dateText = dateElement.text().trim();
            
            if (title && url) {
                items.push({
                    id: `cbp-${Date.now()}-${i}`,
                    title: title,
                    summary: summary || 'CBP trade bulletin update',
                    date: parseDate(dateText) || new Date().toISOString(),
                    url: url,
                    source: 'CBP',
                    category: 'regulatory',
                    priority: title.toLowerCase().includes('hts') || title.toLowerCase().includes('tariff') ? 'high' : 'medium'
                });
            }
        });
    } catch (error) {
        console.log('CBP scraping failed, using fallback data');
        // Fallback CBP data
        items.push({
            id: 'cbp-fallback-1',
            title: 'CBP Trade Bulletin Updates',
            summary: 'Latest Customs and Border Protection bulletins on HTS code changes, trade regulations, and enforcement updates.',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.cbp.gov/newsroom/trade-bulletins',
            source: 'CBP',
            category: 'regulatory',
            priority: 'high'
        });
    }
    
    return items;
}

async function fetchUSTRNews() {
    const items = [];
    
    try {
        const response = await axios.get('https://ustr.gov/about-us/policy-offices/press-office/press-releases', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        $('.view-content .views-row').slice(0, 3).each((i, element) => {
            const titleElement = $(element).find('h3 a, .field-title a').first();
            const title = titleElement.text().trim();
            const relativeUrl = titleElement.attr('href');
            const url = relativeUrl ? `https://ustr.gov${relativeUrl}` : '';
            
            const summaryElement = $(element).find('.field-body, .body').first();
            const summary = summaryElement.text().trim().substring(0, 200) + '...';
            
            const dateElement = $(element).find('.date-display-single, .field-date').first();
            const dateText = dateElement.text().trim();
            
            if (title && url) {
                items.push({
                    id: `ustr-${Date.now()}-${i}`,
                    title: title,
                    summary: summary || 'USTR trade policy announcement',
                    date: parseDate(dateText) || new Date().toISOString(),
                    url: url,
                    source: 'USTR',
                    category: 'policy',
                    priority: 'medium'
                });
            }
        });
    } catch (error) {
        console.log('USTR scraping failed, using fallback data');
        items.push({
            id: 'ustr-fallback-1',
            title: 'USTR Trade Policy Announcements',
            summary: 'Current trade negotiations, policy updates, and international trade agreement developments.',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
            source: 'USTR',
            category: 'policy',
            priority: 'medium'
        });
    }
    
    return items;
}

async function fetchFederalRegisterNews() {
    const items = [];
    
    try {
        const response = await axios.get('https://www.federalregister.gov/api/v1/articles.json?conditions[term]=tariff&per_page=5', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.data && response.data.results) {
            response.data.results.forEach((article, i) => {
                items.push({
                    id: `federal-register-${article.document_number}`,
                    title: article.title,
                    summary: (article.abstract || article.summary || '').substring(0, 200) + '...',
                    date: new Date(article.publication_date).toISOString(),
                    url: article.html_url,
                    source: 'Federal Register',
                    category: 'regulatory',
                    priority: 'medium'
                });
            });
        }
    } catch (error) {
        console.log('Federal Register API failed, using fallback data');
        items.push({
            id: 'federal-register-fallback-1',
            title: 'Federal Register Trade Entries',
            summary: 'Recent tariff schedule modifications, trade rule changes, and regulatory updates.',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=tariff',
            source: 'Federal Register',
            category: 'regulatory',
            priority: 'medium'
        });
    }
    
    return items;
}

async function fetchCensusBureauNews() {
    const items = [];
    
    try {
        const response = await axios.get('https://www.census.gov/newsroom/releases/archives/foreign_trade.html', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        $('.uscb-layout-row').slice(0, 3).each((i, element) => {
            const titleElement = $(element).find('h3 a, .field-title a').first();
            const title = titleElement.text().trim();
            const url = titleElement.attr('href');
            
            const summaryElement = $(element).find('p, .summary').first();
            const summary = summaryElement.text().trim().substring(0, 200) + '...';
            
            if (title && url) {
                items.push({
                    id: `census-${Date.now()}-${i}`,
                    title: title,
                    summary: summary || 'Census Bureau trade statistics update',
                    date: new Date().toISOString(),
                    url: url.startsWith('http') ? url : `https://www.census.gov${url}`,
                    source: 'Census Bureau',
                    category: 'statistics',
                    priority: 'medium',
                    visualType: 'chart',
                    chartData: { type: 'trade-statistics' }
                });
            }
        });
    } catch (error) {
        console.log('Census Bureau scraping failed, using fallback data');
        items.push({
            id: 'census-fallback-1',
            title: 'U.S. International Trade Statistics',
            summary: 'Monthly trade statistics, import/export data, and economic indicators from the Census Bureau.',
            date: new Date().toISOString(),
            url: 'https://www.census.gov/foreign-trade/statistics/',
            source: 'Census Bureau',
            category: 'statistics',
            priority: 'medium',
            visualType: 'chart',
            chartData: { type: 'trade-statistics' }
        });
    }
    
    return items;
}

function parseDate(dateString) {
    if (!dateString) return null;
    
    // Try various date formats
    const formats = [
        /(\w+)\s+(\d{1,2}),\s+(\d{4})/,  // "January 15, 2025"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // "01/15/2025"
        /(\d{4})-(\d{2})-(\d{2})/         // "2025-01-15"
    ];
    
    for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
    }
    
    return null;
} 