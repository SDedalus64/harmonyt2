export const CENSUS_CONFIG = {
  /** Base endpoint for the timeseries international trade datasets */
  baseUrl: process.env.CENSUS_TRADE_API_BASE_URL ||
    'https://api.census.gov/data/timeseries/intltrade',
  /** Census API key – optional but raises quota */
  apiKey: process.env.CENSUS_API_KEY,

  requestTimeout: 10000,
  retry: {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2
  },
  /** Default cache duration (ms) */
  cacheDuration: 6 * 60 * 60 * 1000 // 6 hours
};

export const getCensusUrls = () => {
  const { baseUrl } = CENSUS_CONFIG;
  return {
    /** Build a URL for monthly imports for a given HS10 and year-month (YYYY-MM) */
    monthlyImports: (hs10: string, yearMonth: string) =>
      `${baseUrl}/imports?get=CTY_CODE,E_COMMODITY,GEN_VAL_YEP&COMM_LVL=HS10&COMM_CODE=${hs10}&time=${yearMonth}`,

    /** Build URL for monthly exports similarly */
    monthlyExports: (hs10: string, yearMonth: string) =>
      `${baseUrl}/exports?get=CTY_CODE,E_COMMODITY,GEN_VAL_YEP&COMM_LVL=HS10&COMM_CODE=${hs10}&time=${yearMonth}`
  };
};