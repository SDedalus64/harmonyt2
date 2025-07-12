/**
 * Tariff Rules Configuration
 *
 * This module controls whether to use the new shared configuration approach
 * or fall back to the legacy hardcoded approach.
 *
 * To revert to the old behavior, simply set USE_SHARED_CONFIG to false.
 */

export const TARIFF_CONFIG = {
  // Master switch for the new architecture
  USE_SHARED_CONFIG: true,

  // Whether to load runtime rules from the shared config
  USE_RUNTIME_RULES: true,

  // Whether to trust preprocessed data for stable tariffs
  TRUST_PREPROCESSED_DATA: true,

  // Feature flags for specific tariff types
  FEATURES: {
    RECIPROCAL_FROM_CONFIG: true,
    IEEPA_FROM_CONFIG: true,
    SECTION_201_FROM_CONFIG: true,
  },

  // Fallback behavior when config is disabled
  FALLBACK: {
    // Use the hardcoded logic in tariffService.ts
    USE_LEGACY_CODE: true,
    // Log warnings when falling back
    LOG_FALLBACK: true,
  },
};

// Export a simple toggle function for easy testing
export function toggleSharedConfig(enable: boolean): void {
  TARIFF_CONFIG.USE_SHARED_CONFIG = enable;
  TARIFF_CONFIG.USE_RUNTIME_RULES = enable;

  if (!enable) {
    console.warn(
      "[TariffConfig] Shared configuration disabled. Using legacy hardcoded rules.",
    );
  } else {
    console.log("[TariffConfig] Shared configuration enabled.");
  }
}
