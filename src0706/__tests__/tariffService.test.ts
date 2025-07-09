import { TariffService, TariffEntry } from "../services/tariffService";
import { tariffCacheService } from "../services/tariffCacheService";

// Mock the cache service to avoid file system access
jest.mock("../services/tariffCacheService", () => ({
  tariffCacheService: {
    getSegment: jest.fn().mockResolvedValue(null),
    setSegment: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock global fetch
global.fetch = jest.fn((url) => {
  const mockTariffData: Record<string, any> = {
    "72": {
      entries: [
        {
          hts8: "72011000",
          brief_description: "Pig Iron",
          mfn_ad_val_rate: 0,
          additive_duties: [
            {
              name: "Section 232",
              type: "Rate",
              label: "Section 232",
              countries: ["global"],
              rate: 50.0,
              exceptions: [{ countries: ["UK", "GB"], rate: 25.0 }],
            },
          ],
        },
      ],
    },
    "31": {
      entries: [
        {
          hts8: "31042000",
          brief_description: "Potash",
          mfn_ad_val_rate: 0,
          additive_duties: [
            {
              name: "IEEPA Tariff",
              type: "Rate",
              label: "IEEPA Tariff",
              countries: ["CA"],
              rate: 25.0,
              exceptions: [{ countries: ["CA"], rate: 10.0 }],
            },
          ],
        },
      ],
    },
    "84": {
      entries: [
        {
          hts8: "84713001",
          brief_description: "Laptop",
          mfn_ad_val_rate: 0,
          additive_duties: [],
        },
      ],
    },
  };

  const segmentId = (url.toString().match(/tariff-([a-zA-Z0-9]+)\.json/) ||
    [])[1];
  const data = mockTariffData[segmentId.substring(0, 2)];

  if (data) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    });
  } else {
    return Promise.resolve({ ok: false, status: 404 });
  }
}) as jest.Mock;

describe("TariffService calculateDuty", () => {
  let tariffService: TariffService;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    tariffService = TariffService.getInstance();
  });

  it("should apply the correct base Section 232 rate for a global country", async () => {
    const result = await tariffService.calculateDuty(
      "72011000",
      1000,
      "DE",
      false,
      false,
      false,
    );
    expect(result).not.toBeNull();
    if (!result) return;

    const section232Component = result.components.find(
      (c) => c.label === "Section 232",
    );
    expect(section232Component).toBeDefined();
    if (!section232Component) return;

    expect(section232Component.rate).toBe(50.0);
    expect(result.dutyOnly).toBe(500);
  });

  it("should apply the correct exception Section 232 rate for the UK", async () => {
    const result = await tariffService.calculateDuty(
      "72011000",
      1000,
      "GB",
      false,
      false,
      false,
    );
    expect(result).not.toBeNull();
    if (!result) return;

    const section232Component = result.components.find(
      (c) => c.label && c.label.includes("UK"),
    );
    expect(section232Component).toBeDefined();
    if (!section232Component) return;

    expect(section232Component.rate).toBe(25.0);
    expect(result.dutyOnly).toBe(250);
  });

  it("should apply the correct IEEPA exception rate for Canadian Potash", async () => {
    const result = await tariffService.calculateDuty(
      "31042000",
      1000,
      "CA",
      false,
      false,
      false,
    );
    expect(result).not.toBeNull();
    if (!result) return;

    const ieepaComponent = result.components.find(
      (c) => c.label && c.label.includes("Potash"),
    );
    expect(ieepaComponent).toBeDefined();
    if (!ieepaComponent) return;

    expect(ieepaComponent.rate).toBe(10.0);
    expect(result.dutyOnly).toBe(100);
  });

  it("should not apply any additive duties for a product with no rules", async () => {
    const result = await tariffService.calculateDuty(
      "84713001",
      1000,
      "JP",
      false,
      false,
      false,
    );
    expect(result).not.toBeNull();
    if (!result) return;

    // There should be only one component: the base MFN rate.
    expect(result.components.length).toBe(1);
    expect(result.components[0].type).toBe("MFN");
    expect(result.dutyOnly).toBe(0);
  });
});
