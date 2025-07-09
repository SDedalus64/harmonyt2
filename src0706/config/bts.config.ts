export const BTS_CONFIG = {
  baseUrl: process.env.BTS_API_BASE_URL || 'https://www.bts.gov/api',
  requestTimeout: 10000,
  retry: {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2
  },
  cacheDuration: 6 * 60 * 60 * 1000 // 6 hours
};

export const getBtsUrls = () => {
  const { baseUrl } = BTS_CONFIG;
  return {
    /** Example: port performance dataset (fictional endpoint) */
    portPerformance: (portCode: string) => `${baseUrl}/ports/performance?port=${portCode}`
  };
};