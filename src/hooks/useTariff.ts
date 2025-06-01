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
        await tariffService.initialize();
        setService(tariffService);
        setLastUpdated(tariffService.getLastUpdated());
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize tariff service:', err);
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

  const calculateDuty = useCallback((
    htsCode: string,
    declaredValue: number,
    countryCode: string,
    isReciprocalAdditive: boolean = false
  ): DutyCalculation => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }
    return service.calculateDuty(htsCode, declaredValue, countryCode, isReciprocalAdditive);
  }, [service]);

  return {
    isLoading,
    error,
    lastUpdated,
    findTariffEntry,
    calculateDuty
  };
}
