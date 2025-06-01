import { useState, useEffect, useCallback } from 'react';
import { TariffService, TariffEntry } from '../services/tariffService';
import tariffData from '../data/tariffnew.json';

export interface DutyCalculation {
  amount: number;
  dutyOnly: number;
  totalRate: number;
  components: Array<{
    type: string;
    rate: number;
    amount: number;
  }>;
  breakdown: string[];
  fees: {
    mpf: { rate: number; amount: number };
    hmf: { rate: number; amount: number };
  };
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
    countryCode: string
  ): DutyCalculation => {
    if (!service) {
      throw new Error('Tariff service not initialized');
    }
    return service.calculateDuty(htsCode, declaredValue, countryCode);
  }, [service]);

  const useTariffData = () => {
    const findTariffEntryData = (htsCode: string) => {
      return tariffData.find(entry => entry.hts8 === parseInt(htsCode, 10));
    };

    const calculateDutyData = (htsCode: string, declaredValue: number, countryCode: string) => {
      const entry = findTariffEntryData(htsCode);
      if (!entry) return null;

      let dutyRate = entry.mfn_ad_val_rate || 0;
      let specialProgram = null;

      const specialPrograms = {
        CA: entry.usmca_ad_val_rate,
        MX: entry.usmca_ad_val_rate,
        AU: entry.australia_ad_val_rate,
        SG: entry.singapore_ad_val_rate,
        KR: entry.korea_ad_val_rate,
        // Add other countries/programs as needed
      };

      if (specialPrograms[countryCode] !== undefined && specialPrograms[countryCode] !== null) {
        dutyRate = specialPrograms[countryCode];
        specialProgram = countryCode;
      }

      const dutyAmount = declaredValue * dutyRate;
      const mpf = declaredValue * MPF_RATE;
      const hmf = declaredValue * HMF_RATE;

      const breakdown = [
        specialProgram
          ? `Special Rate (${specialProgram}): ${(dutyRate * 100).toFixed(2)}%`
          : `MFN Rate: ${(dutyRate * 100).toFixed(2)}%`,
        `MPF: $${mpf.toFixed(2)}`,
        `HMF: $${hmf.toFixed(2)}`,
      ];

      return {
        totalRate: dutyRate,
        amount: dutyAmount + mpf + hmf,
        components: [
          {
            type: specialProgram ? 'special' : 'general',
            rate: dutyRate * 100,
            amount: dutyAmount,
            label: specialProgram ? `${specialProgram} Special Rate` : 'MFN Rate',
          },
        ],
        fees: {
          mpf: { rate: MPF_RATE, amount: mpf },
          hmf: { rate: HMF_RATE, amount: hmf },
        },
        breakdown,
      };
    };

    return { findTariffEntryData, calculateDutyData };
  };

  return {
    isLoading,
    error,
    lastUpdated,
    findTariffEntry,
    calculateDuty,
    useTariffData
  };
}
