import { btsService } from '../services/btsService';

describe('btsService', () => {
  beforeEach(() => {
    btsService.clearCache();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dwellDays: 6.5, lastUpdated: '2025-06-22' }) });
  });

  it('fetches port performance and caches', async () => {
    const data = await btsService.getPortPerformance('LALB');
    expect(data.dwellDays).toBe(6.5);

    const again = await btsService.getPortPerformance('LALB');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(again).toEqual(data);
  });

  it('handles 500 retry then success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Err' })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ dwell: 8, updated: '2025-06-23' }) });

    const data = await btsService.getPortPerformance('NYNJ');
    expect(data.dwellDays).toBe(8);
  });
});