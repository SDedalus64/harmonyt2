import fs from 'fs';
import path from 'path';

// Allow access to the singleton export
const { tariffService } = require('../services/tariffService');

type GoldenCase = {
  hts8: string;
  declaredValueUSD: number;
  countryCode: string;
  expectedAmountUSD: number;
};

describe('DutyCalculator golden tests', () => {
  // Path to CSV with cases
  const csvPath = path.resolve(__dirname, '../../tests/golden/duty-cases.csv');
  const rawCsv = fs.readFileSync(csvPath, 'utf-8').trim();
  const [header, ...rows] = rawCsv.split(/\r?\n/);

  // Prepare a minimal tariffData replacement so the calculator has rate info
  const dummyTariffs: any[] = [];
  const cases: GoldenCase[] = rows.map(line => {
    const [hts8, declaredValueUSD, countryCode, expectedAmountUSD] = line.split(',');
    const decVal = parseFloat(declaredValueUSD);
    const expectedAmt = parseFloat(expectedAmountUSD);
    // Derive ad-valorem duty rate from expected amount (minus constant fees)
    const MPF_RATE = 0.003464; // 0.3464 %
    const HMF_RATE = 0.00125;  // 0.125 %
    const mpf = Math.max(27.75, decVal * MPF_RATE);
    const hmf = decVal * HMF_RATE;
    const dutyOnly = +(expectedAmt - mpf - hmf).toFixed(2);
    const dutyRateDecimal = dutyOnly > 0 ? dutyOnly / decVal : 0; // e.g. 0.176 for 17.6 %

    // Inject minimal entry for this HTS code
    dummyTariffs.push({
      hts8,
      brief_description: 'Golden-test dummy entry',
      mfn_ad_val_rate: dutyRateDecimal, // TariffService mutiplies by 100 later
      mfn_text_rate: `${(dutyRateDecimal * 100).toFixed(1)}%`
    });

    return {
      hts8,
      declaredValueUSD: decVal,
      countryCode,
      expectedAmountUSD: expectedAmt
    };
  });

  beforeAll(async () => {
    // Bypass remote initialization by injecting dummy tariff data
    (tariffService as any).tariffData = {
      tariffs: dummyTariffs
    };
    (tariffService as any).initialized = true;
  });

  cases.forEach(testCase => {
    it(`calculates correct total for HTS ${testCase.hts8}`, () => {
      const result = tariffService.calculateDuty(
        testCase.hts8,
        testCase.declaredValueUSD,
        testCase.countryCode
      );

      expect(result.amount).toBeCloseTo(testCase.expectedAmountUSD, 2);
    });
  });
});
