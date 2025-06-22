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
    LALB: process.env.PORT_LALB_ENDPOINT || 'https://api.portoflosangeles.org/dwell-time',
    NYNJ: process.env.PORT_NYNJ_ENDPOINT || 'https://opendata.panynj.gov/api/dwell-time'
  }
};