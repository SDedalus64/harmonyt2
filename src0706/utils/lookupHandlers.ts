// src/utils/lookupHandlers.ts

import { Alert } from "react-native";
import { LookupResult } from "../types"; // Make sure this type exists or update path

interface LookupParams {
  htsCode: string;
  selectedCountry: string;
  declaredValue: number;
  setResult: (res: LookupResult) => void;
  setPendingHistoryLookup?: (val: boolean) => void;
  showError: (msg: string) => void;
  log: (label: string, payload?: any) => void;
}

export async function handleLookup({
  htsCode,
  selectedCountry,
  declaredValue,
  setResult,
  showError,
  log,
}: LookupParams) {
  try {
    log("[handleLookup] Starting lookup with", {
      htsCode,
      selectedCountry,
      declaredValue,
    });

    // Simulated result. Replace with actual API call or logic
    const lookupResult: LookupResult = {
      htsCode,
      description: "Sample description",
      totalAmount: 100.0,
      dutyRate: 5.5,
      breakdown: [],
      components: [],
      fees: [],
      unitCalculations: [],
    };

    setResult(lookupResult);
    log("[handleLookup] Result set:", lookupResult);
  } catch (error) {
    console.error("Lookup error:", error);
    showError("An error occurred during lookup. Please try again.");
  }
}

export function handleNewLookup({
  log,
}: {
  log: (label: string, payload?: any) => void;
}) {
  log("[handleNewLookup] Triggered");
  Alert.alert(
    "Unsaved Lookup",
    "You have an unsaved lookup. Do you want to save it before starting a new one?",
  );
}

export function handleRepeatLookup({ log }: { log: (label: string) => void }) {
  log("[handleRepeatLookup] Triggered");
  // Extend with logic if needed
}
