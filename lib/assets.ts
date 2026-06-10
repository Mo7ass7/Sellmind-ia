export interface Asset {
  id: string;
  label: string;
  yahoo: string;
  category: "forex" | "crypto" | "commodity" | "index";
}

export const ASSETS: Asset[] = [
  // Forex
  { id: "EURUSD", label: "EUR/USD", yahoo: "EURUSD=X",  category: "forex" },
  { id: "GBPUSD", label: "GBP/USD", yahoo: "GBPUSD=X",  category: "forex" },
  { id: "USDJPY", label: "USD/JPY", yahoo: "USDJPY=X",  category: "forex" },
  { id: "AUDUSD", label: "AUD/USD", yahoo: "AUDUSD=X",  category: "forex" },
  { id: "USDCAD", label: "USD/CAD", yahoo: "USDCAD=X",  category: "forex" },
  { id: "USDCHF", label: "USD/CHF", yahoo: "USDCHF=X",  category: "forex" },
  { id: "NZDUSD", label: "NZD/USD", yahoo: "NZDUSD=X",  category: "forex" },
  { id: "EURGBP", label: "EUR/GBP", yahoo: "EURGBP=X",  category: "forex" },
  { id: "EURJPY", label: "EUR/JPY", yahoo: "EURJPY=X",  category: "forex" },
  { id: "GBPJPY", label: "GBP/JPY", yahoo: "GBPJPY=X",  category: "forex" },

  // Crypto
  { id: "BTCUSD", label: "BTC/USD", yahoo: "BTC-USD",   category: "crypto" },
  { id: "ETHUSD", label: "ETH/USD", yahoo: "ETH-USD",   category: "crypto" },
  { id: "BNBUSD", label: "BNB/USD", yahoo: "BNB-USD",   category: "crypto" },
  { id: "LTCUSD", label: "LTC/USD", yahoo: "LTC-USD",   category: "crypto" },
  { id: "XRPUSD", label: "XRP/USD", yahoo: "XRP-USD",   category: "crypto" },

  // Commodities
  { id: "GOLD",   label: "ذهب",    yahoo: "GC=F",       category: "commodity" },
  { id: "SILVER", label: "فضة",    yahoo: "SI=F",       category: "commodity" },
  { id: "OIL",    label: "نفط",    yahoo: "CL=F",       category: "commodity" },

  // Indices
  { id: "SPX",    label: "S&P 500",  yahoo: "^GSPC",    category: "index" },
  { id: "NDX",    label: "NASDAQ",   yahoo: "^IXIC",    category: "index" },
];

export const CATEGORY_LABEL: Record<Asset["category"], string> = {
  forex:     "فوركس",
  crypto:    "عملات رقمية",
  commodity: "سلع",
  index:     "مؤشرات",
};
