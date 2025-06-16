import path from 'path';

// Sample data paths
const indexPath = path.resolve(__dirname, 'data/segment-index.json');
const seg01Path = path.resolve(__dirname, 'data/tariff-01.json');
const indexData = require(indexPath);
const seg01Data = require(seg01Path);

describe('tariffSearchService', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('searches by prefix and returns expected results', async () => {
    global.fetch = jest
      .fn()
      // First call: fetch segment index
      .mockResolvedValueOnce({ ok: true, json: async () => indexData })
      // Second call: fetch segment 01
      .mockResolvedValueOnce({ ok: true, json: async () => seg01Data });

    const { tariffSearchService } = require('../services/tariffSearchService');

    const results = await tariffSearchService.searchByPrefix('01');

    expect(results).toEqual([
      { code: '01010000', description: 'Animals 1' },
      { code: '01020000', description: 'Animals 2' }
    ]);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
  });

  test('returns empty array when prefix not found', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => indexData });

    const { tariffSearchService } = require('../services/tariffSearchService');

    const results = await tariffSearchService.searchByPrefix('99');
    expect(results).toEqual([]);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  test('throws when segment index fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });

    const { tariffSearchService } = require('../services/tariffSearchService');

    await expect(tariffSearchService.searchByPrefix('01')).rejects.toThrow('Failed to fetch segment index');
  });

  test('returns empty when segment fetch is 404', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => indexData })
      .mockResolvedValueOnce({ ok: false, status: 404 });

    const { tariffSearchService } = require('../services/tariffSearchService');

    const results = await tariffSearchService.searchByPrefix('01');
    expect(results).toEqual([]);
  });
});
