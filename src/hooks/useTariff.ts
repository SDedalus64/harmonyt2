import { useState, useEffect, useCallback } from 'react';
import { TariffService, TariffEntry } from '../services/tariffService';

export interface DutyCalculation {
  amount: number;
  dutyOnly: number;
  totalRate: number;
  components: Array<{
    type: string;
    rate: number;
    amount: number;
    label?: string;
  }>;
  breakdown: string[];
  fees: {
    mpf: { rate: number; amount: number };
    hmf: { rate: number; amount: number };
  };
  htsCode: string;
  description: string;
  effectiveDate: string;
  expirationDate: string;
}

const MPF_RATE = 0.003464; // Merchandise Processing Fee
const HMF_RATE = 0.00125;  // Harbor Maintenance Fee

export function useTariff() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [service, setService] = useState<TariffService | null>(null);

  useEffect(() => {
    const initializeTariff = async () => {
      try {
        const tariffService = TariffService.getInstance();

        // Check if already initialized (no preloading anymore)
        if (tariffService.isInitialized()) {
          console.log('📦 Tariff data already loaded and cached');
          setService(tariffService);
          setLastUpdated(tariffService.getLastUpdated());
          setIsLoading(false);
          return;
        }

        // If not initialized, the App.tsx is already loading it in the background
        // Just wait for it to complete
        console.log('⏳ Waiting for tariff data to load...');

        // Set the service reference even if not fully loaded
        // The actual methods will wait for initialization
        setService(tariffService);
        setIsLoading(false);

        // Check periodically if the service has been initialized
        const checkInterval = setInterval(() => {
          if (tariffService.isInitialized()) {
            console.log('✅ Tariff data now available');
            setLastUpdated(tariffService.getLastUpdated());
            clearInterval(checkInterval);
          }
        }, 500);

        // Clean up interval after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);

      } catch (err) {
        console.error('❌ Failed to initialize tariff service:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize tariff service'));
        setIsLoading(false);
      }
    };

    initializeTariff();
  }, []);

  const findTariffEntry = useCallback((htsCode: string): TariffEntry | undefined => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }
    return service.findTariffEntry(htsCode);
  }, [service]);

  const findTariffEntryAsync = useCallback(async (htsCode: string): Promise<TariffEntry | undefined> => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }

    // Wait for initialization if needed
    if (!service.isInitialized()) {
      console.log('⏳ Waiting for tariff data to complete loading...');
      await service.initialize();
    }

    return service.findTariffEntryOptimized(htsCode);
  }, [service]);

  const searchByPrefix = useCallback(async (prefix: string, limit: number = 15): Promise<Array<{ code: string; description: string }>> => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }

    // Wait for initialization if needed
    if (!service.isInitialized()) {
      console.log('⏳ Waiting for tariff data to complete loading...');
      await service.initialize();
    }

    return service.searchByPrefix(prefix, limit);
  }, [service]);

  const searchTariffEntries = useCallback((searchTerm: string): TariffEntry[] => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }

    const results: TariffEntry[] = [];

    const exactMatch = service.findTariffEntry(searchTerm);
    if (exactMatch) {
      results.push(exactMatch);
    }

    return results;
  }, [service]);

  const calculateDuty = useCallback((
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isReciprocalAdditive: boolean = true,  // Always treat reciprocal tariffs as additive
    excludeReciprocalTariff: boolean = false,
    isUSMCAOrigin: boolean = false
  ): DutyCalculation => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }
    return service.calculateDuty(htsCode, declaredValue, countryCode, isReciprocalAdditive, excludeReciprocalTariff, isUSMCAOrigin);
  }, [service]);

  return {
    isLoading,
    error,
    lastUpdated,
    findTariffEntry,
    findTariffEntryAsync,
    searchTariffEntries,
    searchByPrefix,
    calculateDuty
  };
}
