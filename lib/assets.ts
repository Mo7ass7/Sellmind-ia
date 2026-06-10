export interface Asset {
  id: string;
  label: string;
  yahoo: string;
  category: "forex" | "crypto" | "commodity" | "index";
}

export const ASSETS: Asset[] = [
  // ── Forex ─────────────────────────────────────────────────────────────────
  { id: "EURUSD", label: "EUR/USD", yahoo: "EURUSD=X", category: "forex" },
  { id: "GBPUSD", label: "GBP/USD", yahoo: "GBPUSD=X", category: "forex" },
  { id: "USDJPY", label: "USD/JPY", yahoo: "USDJPY=X", category: "forex" },
  { id: "AUDUSD", label: "AUD/USD", yahoo: "AUDUSD=X", category: "forex" },
  { id: "USDCAD", label: "USD/CAD", yahoo: "USDCAD=X", category: "forex" },
  { id: "USDCHF", label: "USD/CHF", yahoo: "USDCHF=X", category: "forex" },
  { id: "NZDUSD", label: "NZD/USD", yahoo: "NZDUSD=X", category: "forex" },
  { id: "EURGBP", label: "EUR/GBP", yahoo: "EURGBP=X", category: "forex" },
  { id: "EURJPY", label: "EUR/JPY", yahoo: "EURJPY=X", category: "forex" },
  { id: "GBPJPY", label: "GBP/JPY", yahoo: "GBPJPY=X", category: "forex" },

  // ── Crypto — Layer 1 ──────────────────────────────────────────────────────
  { id: "BTCUSD",  label: "BTC",   yahoo: "BTC-USD",   category: "crypto" },
  { id: "ETHUSD",  label: "ETH",   yahoo: "ETH-USD",   category: "crypto" },
  { id: "BNBUSD",  label: "BNB",   yahoo: "BNB-USD",   category: "crypto" },
  { id: "XRPUSD",  label: "XRP",   yahoo: "XRP-USD",   category: "crypto" },
  { id: "SOLUSD",  label: "SOL",   yahoo: "SOL-USD",   category: "crypto" },
  { id: "ADAUSD",  label: "ADA",   yahoo: "ADA-USD",   category: "crypto" },
  { id: "AVAXUSD", label: "AVAX",  yahoo: "AVAX-USD",  category: "crypto" },
  { id: "DOTUSD",  label: "DOT",   yahoo: "DOT-USD",   category: "crypto" },
  { id: "MATICUSD",label: "MATIC", yahoo: "MATIC-USD", category: "crypto" },
  { id: "LTCUSD",  label: "LTC",   yahoo: "LTC-USD",   category: "crypto" },
  { id: "TRXUSD",  label: "TRX",   yahoo: "TRX-USD",   category: "crypto" },
  { id: "NEARUSD", label: "NEAR",  yahoo: "NEAR-USD",  category: "crypto" },
  { id: "ATOMUSD", label: "ATOM",  yahoo: "ATOM-USD",  category: "crypto" },
  { id: "XLMUSD",  label: "XLM",   yahoo: "XLM-USD",   category: "crypto" },
  { id: "ALGOUSD", label: "ALGO",  yahoo: "ALGO-USD",  category: "crypto" },
  { id: "VETUSD",  label: "VET",   yahoo: "VET-USD",   category: "crypto" },
  { id: "ETCUSD",  label: "ETC",   yahoo: "ETC-USD",   category: "crypto" },
  { id: "BCHUSD",  label: "BCH",   yahoo: "BCH-USD",   category: "crypto" },
  { id: "XTZUSD",  label: "XTZ",   yahoo: "XTZ-USD",   category: "crypto" },
  { id: "EOSUSD",  label: "EOS",   yahoo: "EOS-USD",   category: "crypto" },
  { id: "FLOWUSD", label: "FLOW",  yahoo: "FLOW-USD",  category: "crypto" },
  { id: "HBARUSD", label: "HBAR",  yahoo: "HBAR-USD",  category: "crypto" },
  { id: "XMRUSD",  label: "XMR",   yahoo: "XMR-USD",   category: "crypto" },
  { id: "DASHUSD", label: "DASH",  yahoo: "DASH-USD",  category: "crypto" },
  { id: "ZECUSD",  label: "ZEC",   yahoo: "ZEC-USD",   category: "crypto" },

  // ── Crypto — Meme ─────────────────────────────────────────────────────────
  { id: "DOGEUSD", label: "DOGE",  yahoo: "DOGE-USD",  category: "crypto" },
  { id: "SHIBUSD", label: "SHIB",  yahoo: "SHIB-USD",  category: "crypto" },
  { id: "PEPEUSD", label: "PEPE",  yahoo: "PEPE-USD",  category: "crypto" },
  { id: "BONKUSD", label: "BONK",  yahoo: "BONK-USD",  category: "crypto" },

  // ── Crypto — DeFi ─────────────────────────────────────────────────────────
  { id: "LINKUSD", label: "LINK",  yahoo: "LINK-USD",  category: "crypto" },
  { id: "UNIUSD",  label: "UNI",   yahoo: "UNI-USD",   category: "crypto" },
  { id: "AAVEUSD", label: "AAVE",  yahoo: "AAVE-USD",  category: "crypto" },
  { id: "MKRUSD",  label: "MKR",   yahoo: "MKR-USD",   category: "crypto" },
  { id: "CRVUSD",  label: "CRV",   yahoo: "CRV-USD",   category: "crypto" },
  { id: "SNXUSD",  label: "SNX",   yahoo: "SNX-USD",   category: "crypto" },
  { id: "COMPUSD", label: "COMP",  yahoo: "COMP-USD",  category: "crypto" },
  { id: "SUSHIUSD",label: "SUSHI", yahoo: "SUSHI-USD", category: "crypto" },

  // ── Crypto — Layer 2 & New ────────────────────────────────────────────────
  { id: "OPUSD",   label: "OP",    yahoo: "OP-USD",    category: "crypto" },
  { id: "ARBUSD",  label: "ARB",   yahoo: "ARB-USD",   category: "crypto" },
  { id: "APTUSD",  label: "APT",   yahoo: "APT-USD",   category: "crypto" },
  { id: "SUIUSD",  label: "SUI",   yahoo: "SUI-USD",   category: "crypto" },
  { id: "INJUSD",  label: "INJ",   yahoo: "INJ-USD",   category: "crypto" },
  { id: "RNDRUSD", label: "RNDR",  yahoo: "RNDR-USD",  category: "crypto" },
  { id: "IMXUSD",  label: "IMX",   yahoo: "IMX-USD",   category: "crypto" },
  { id: "GRTUSD",  label: "GRT",   yahoo: "GRT-USD",   category: "crypto" },
  { id: "FILUSD",  label: "FIL",   yahoo: "FIL-USD",   category: "crypto" },
  { id: "SANDUSD", label: "SAND",  yahoo: "SAND-USD",  category: "crypto" },
  { id: "MANAUSD", label: "MANA",  yahoo: "MANA-USD",  category: "crypto" },
  { id: "AXSUSD",  label: "AXS",   yahoo: "AXS-USD",   category: "crypto" },

  // ── Commodities ───────────────────────────────────────────────────────────
  { id: "GOLD",   label: "ذهب",   yahoo: "GC=F",  category: "commodity" },
  { id: "SILVER", label: "فضة",   yahoo: "SI=F",  category: "commodity" },
  { id: "OIL",    label: "نفط",   yahoo: "CL=F",  category: "commodity" },

  // ── Indices ───────────────────────────────────────────────────────────────
  { id: "SPX", label: "S&P 500", yahoo: "^GSPC", category: "index" },
  { id: "NDX", label: "NASDAQ",  yahoo: "^IXIC", category: "index" },
];

export const CATEGORY_LABEL: Record<Asset["category"], string> = {
  forex:     "فوركس",
  crypto:    "عملات رقمية",
  commodity: "سلع",
  index:     "مؤشرات",
};
