import { TariffService } from "../services/tariffService";

// Helper to create a fresh TariffService with injected data
const createServiceWithEntry = (entry: any) => {
  const svc = TariffService.getInstance();
  // Inject minimal tariff data
  (svc as any).tariffData = {
    tariffs: [entry],
  };
  return svc;
};

describe("Section 232 additive duty behaviour", () => {
  afterEach(() => {
    // Clear singleton state between tests
    const svc = TariffService.getInstance();
    (svc as any).tariffData = null;
  });

  it("applies Section 232 duty even when rule_name contains IEEPA", () => {
    const entry = {
      hts8: "72072000",
      brief_description: "Test steel product",
      mfn_ad_val_rate: 0,
      additive_duties: [
        {
          type: "section_232",
          name: "Section 232 – Steel",
          rule_name: "section-232-steel-ieepa-test", // contains ieepa
          rate: 25,
          countries: "all",
          label: "Section 232 Steel (25%)",
        },
      ],
    };

    const svc = createServiceWithEntry(entry);
    const res = svc.calculateDuty("72072000", 1000, "CN");

    expect(res).not.toBeNull();
    expect(res!.components.some((c) => c.type === "section_232")).toBe(true);
  });

  it("does not double-apply IEEPA when Section 232 present", () => {
    const entry = {
      hts8: "72073000",
      brief_description: "Steel with 232 and ieepa",
      mfn_ad_val_rate: 0,
      additive_duties: [
        {
          type: "section_232",
          name: "Section 232 – Steel",
          rule_name: "section-232-steel-ieepa-test",
          rate: 25,
          countries: "all",
          label: "Section 232 Steel (25%)",
        },
      ],
      ieepa_tariffs: [
        {
          country: "CN",
          rate: 25,
          label: "IEEPA Steel 25%",
        },
      ],
    };
    const svc = createServiceWithEntry(entry);
    const res = svc.calculateDuty("72073000", 1000, "CN");

    expect(res).not.toBeNull();
    const types = res!.components.map((c) => c.type);
    expect(types).toContain("section_232");
    expect(types).not.toContain("ieepa_tariff");
  });

  it("applies IEEPA duty when no Section 232 present", () => {
    const entry = {
      hts8: "72074000",
      brief_description: "Steel with only ieepa",
      mfn_ad_val_rate: 0,
      ieepa_tariffs: [
        {
          country: "CN",
          rate: 25,
          label: "IEEPA Steel 25%",
        },
      ],
    };
    const svc = createServiceWithEntry(entry);
    const res = svc.calculateDuty("72074000", 1000, "CN");
    expect(res).not.toBeNull();
    const types = res!.components.map((c) => c.type);
    expect(types).toContain("ieepa_tariff");
  });
});