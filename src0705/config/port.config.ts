export const PORT_CONFIG = {
  requestTimeout: 8000,
  retry: {
    maxAttempts: 3,
    delayMs: 400,
    backoffMultiplier: 2
  },
  cacheDuration: 15 * 60 * 1000, // 15 minutes
  // Mapping of port codes to open-data endpoints (examples)
  endpoints: {
    LALB:
      process.env.PORT_LALB_ENDPOINT ||
      'https://app.portoptimizer.com/api/dwelltime/latest',
    NYNJ:
      process.env.PORT_NYNJ_ENDPOINT ||
      'https://data.panynj.gov/resource/9ivb-iced.json?$limit=1&$order=report_date DESC'
  }
};