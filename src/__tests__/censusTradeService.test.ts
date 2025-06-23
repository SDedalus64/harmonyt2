import { censusTradeService } from '../services/censusTradeService';

// Mock global fetch before imports in Node
const sampleResponse = [
  ['CTY_CODE', 'E_COMMODITY', 'GEN_VAL_YEP', 'time'],
  ['570', '8504404010', '123456', '2024-05'],
  ['484', '8504404010', '98765', '2024-05']
];

describe('censusTradeService', () => {
  beforeEach(() => {
    censusTradeService.clearCache();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sampleResponse });
  });

  it('fetches and caches monthly imports', async () => {
    const data = await censusTradeService.fetchMonthlyImports('8504404010', '2024-05');
    expect(data.length).toBe(2);
    expect(data[0].E_COMMODITY).toBe('8504404010');

    // Second call should hit cache → fetch not invoked again
    const data2 = await censusTradeService.fetchMonthlyImports('8504404010', '2024-05');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(data2).toEqual(data);
  });

  it('handles 404 gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(censusTradeService.fetchMonthlyImports('0000000000', '2024-05')).rejects.toThrow('Census imports fetch failed');
  });
});