import { portFeedService } from '../services/portFeedService';

describe('portFeedService', () => {
  beforeEach(() => {
    portFeedService.clearCache();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dwell: 7.2, timestamp: '2025-06-22T12:00:00Z' }) });
  });

  it('fetches dwell data and caches', async () => {
    const data = await portFeedService.getDwell('LALB');
    expect(data.dwellDays).toBe(7.2);

    const again = await portFeedService.getDwell('LALB');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(again).toEqual(data);
  });

  it('throws if endpoint missing', async () => {
    //@ts-ignore
    await expect(portFeedService.getDwell('FOO')).rejects.toThrow('Port endpoint');
  });
});