// Azure Blob Storage Configuration
export const AZURE_CONFIG = {
  // Base URL for the Azure Blob Storage
  baseUrl: 'https://cs410033fffad325ccb.blob.core.windows.net/$web/TCalc/data',

  // Main tariff data file
  mainDataFile: 'tariff_processed_06062025.json',

  // Segment files directory
  segmentsPath: 'tariff-segments',

  // Index file
  indexFile: 'segment-index.json',

  // Cache duration in milliseconds (24 hours)
  cacheDuration: 24 * 60 * 60 * 1000,

  // Request timeout in milliseconds (30 seconds)
  requestTimeout: 30000,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  }
};

// Helper function to get full URLs
export const getAzureUrls = () => ({
  mainData: `${AZURE_CONFIG.baseUrl}/${AZURE_CONFIG.mainDataFile}`,
  segmentIndex: `${AZURE_CONFIG.baseUrl}/${AZURE_CONFIG.segmentsPath}/${AZURE_CONFIG.indexFile}`,
  getSegmentUrl: (segmentId: string) =>
    `${AZURE_CONFIG.baseUrl}/${AZURE_CONFIG.segmentsPath}/tariff-${segmentId}.json`
});
