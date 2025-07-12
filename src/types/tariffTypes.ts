// Trade Remedy Warning Types
export interface TradeRemedyFlags {
  has_trade_remedies: boolean;
  has_add: boolean;
  has_cvd: boolean;
  add_countries?: string[];
  cvd_countries?: string[];
  add_notice?: string;
  cvd_notice?: string;
  remedy_products?: string;
  trade_remedy_notice?: string;
}

// Add to TariffEntry interface:
// trade_remedy_flags?: TradeRemedyFlags;
