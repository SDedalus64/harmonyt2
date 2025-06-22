export const USITC_CONFIG = {
  /** Base URL for USITC HTS API */
  baseUrl: process.env.USITC_API_BASE_URL || 'https://hts.usitc.gov/tariff/api/v1',
  /** Timeout for outbound requests (ms) */
  requestTimeout: 10000,
  /** Retry strategy */
  retry: {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2
  },
  /** Cache duration for downloaded data (ms) */
  cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
};

export const getUsitcUrls = () => {
  const { baseUrl } = USITC_CONFIG;
  return {
    /** Full HTS chapter listing as of today */
    chapters: `${baseUrl}/chapter?as_of=today`,
    /** Retrieve a specific HTS code */
    getCode: (code: string) => `${baseUrl}/classification/${code}?as_of=today`
  };
};
