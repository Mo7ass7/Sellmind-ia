export interface Asset {
  id: string;
  label: string;
  name: string;
  yahoo: string;
  deriv?: string;
  category: "forex" | "crypto" | "commodity" | "index" | "synthetic";
  sub?: "layer1" | "meme" | "defi" | "layer2";
}

export const ASSETS: Asset[] = [
  // ── Forex — Major ─────────────────────────────────────────────────────────
  { id: "EURUSD", label: "EUR/USD", name: "يورو/دولار",       yahoo: "EURUSD=X", deriv: "frxEURUSD", category: "forex" },
  { id: "GBPUSD", label: "GBP/USD", name: "جنيه/دولار",      yahoo: "GBPUSD=X", deriv: "frxGBPUSD", category: "forex" },
  { id: "USDJPY", label: "USD/JPY", name: "دولار/ين",         yahoo: "USDJPY=X", deriv: "frxUSDJPY", category: "forex" },
  { id: "AUDUSD", label: "AUD/USD", name: "أسترالي/دولار",    yahoo: "AUDUSD=X", deriv: "frxAUDUSD", category: "forex" },
  { id: "USDCAD", label: "USD/CAD", name: "دولار/كندي",       yahoo: "USDCAD=X", deriv: "frxUSDCAD", category: "forex" },
  { id: "USDCHF", label: "USD/CHF", name: "دولار/فرنك",       yahoo: "USDCHF=X", deriv: "frxUSDCHF", category: "forex" },
  { id: "NZDUSD", label: "NZD/USD", name: "نيوزيلندي/دولار",  yahoo: "NZDUSD=X", deriv: "frxNZDUSD", category: "forex" },

  // ── Forex — Minor EUR ──────────────────────────────────────────────────────
  { id: "EURGBP", label: "EUR/GBP", name: "يورو/جنيه",        yahoo: "EURGBP=X", deriv: "frxEURGBP", category: "forex" },
  { id: "EURJPY", label: "EUR/JPY", name: "يورو/ين",          yahoo: "EURJPY=X", deriv: "frxEURJPY", category: "forex" },
  { id: "EURAUD", label: "EUR/AUD", name: "يورو/أسترالي",     yahoo: "EURAUD=X", deriv: "frxEURAUD", category: "forex" },
  { id: "EURCAD", label: "EUR/CAD", name: "يورو/كندي",        yahoo: "EURCAD=X", deriv: "frxEURCAD", category: "forex" },
  { id: "EURCHF", label: "EUR/CHF", name: "يورو/فرنك",        yahoo: "EURCHF=X", deriv: "frxEURCHF", category: "forex" },
  { id: "EURNZD", label: "EUR/NZD", name: "يورو/نيوزيلندي",   yahoo: "EURNZD=X",                    category: "forex" },

  // ── Forex — Minor GBP ──────────────────────────────────────────────────────
  { id: "GBPJPY", label: "GBP/JPY", name: "جنيه/ين",         yahoo: "GBPJPY=X", deriv: "frxGBPJPY", category: "forex" },
  { id: "GBPAUD", label: "GBP/AUD", name: "جنيه/أسترالي",    yahoo: "GBPAUD=X", deriv: "frxGBPAUD", category: "forex" },
  { id: "GBPCAD", label: "GBP/CAD", name: "جنيه/كندي",       yahoo: "GBPCAD=X", deriv: "frxGBPCAD", category: "forex" },
  { id: "GBPCHF", label: "GBP/CHF", name: "جنيه/فرنك",       yahoo: "GBPCHF=X", deriv: "frxGBPCHF", category: "forex" },
  { id: "GBPNZD", label: "GBP/NZD", name: "جنيه/نيوزيلندي",  yahoo: "GBPNZD=X",                    category: "forex" },

  // ── Forex — Minor AUD ──────────────────────────────────────────────────────
  { id: "AUDJPY", label: "AUD/JPY", name: "أسترالي/ين",       yahoo: "AUDJPY=X", deriv: "frxAUDJPY", category: "forex" },
  { id: "AUDCAD", label: "AUD/CAD", name: "أسترالي/كندي",     yahoo: "AUDCAD=X",                    category: "forex" },
  { id: "AUDCHF", label: "AUD/CHF", name: "أسترالي/فرنك",     yahoo: "AUDCHF=X",                    category: "forex" },
  { id: "AUDNZD", label: "AUD/NZD", name: "أسترالي/نيوزيلندي",yahoo: "AUDNZD=X",                    category: "forex" },

  // ── Forex — Minor Others ───────────────────────────────────────────────────
  { id: "CADJPY", label: "CAD/JPY", name: "كندي/ين",          yahoo: "CADJPY=X",                    category: "forex" },
  { id: "CADCHF", label: "CAD/CHF", name: "كندي/فرنك",        yahoo: "CADCHF=X",                    category: "forex" },
  { id: "CHFJPY", label: "CHF/JPY", name: "فرنك/ين",          yahoo: "CHFJPY=X",                    category: "forex" },
  { id: "NZDJPY", label: "NZD/JPY", name: "نيوزيلندي/ين",     yahoo: "NZDJPY=X",                    category: "forex" },
  { id: "NZDCAD", label: "NZD/CAD", name: "نيوزيلندي/كندي",   yahoo: "NZDCAD=X",                    category: "forex" },
  { id: "NZDCHF", label: "NZD/CHF", name: "نيوزيلندي/فرنك",   yahoo: "NZDCHF=X",                    category: "forex" },

  // ── Forex — Exotic ─────────────────────────────────────────────────────────
  { id: "USDMXN", label: "USD/MXN", name: "دولار/بيسو",       yahoo: "USDMXN=X",                    category: "forex" },
  { id: "USDTRY", label: "USD/TRY", name: "دولار/ليرة",       yahoo: "USDTRY=X",                    category: "forex" },
  { id: "USDZAR", label: "USD/ZAR", name: "دولار/راند",        yahoo: "USDZAR=X",                    category: "forex" },
  { id: "USDSGD", label: "USD/SGD", name: "دولار/سنغافوري",    yahoo: "USDSGD=X",                    category: "forex" },
  { id: "USDHKD", label: "USD/HKD", name: "دولار/هونج كونج",   yahoo: "USDHKD=X",                    category: "forex" },
  { id: "USDNOK", label: "USD/NOK", name: "دولار/كرون نرويجي", yahoo: "USDNOK=X",                    category: "forex" },
  { id: "USDSEK", label: "USD/SEK", name: "دولار/كرون سويدي",  yahoo: "USDSEK=X",                    category: "forex" },
  { id: "USDPLN", label: "USD/PLN", name: "دولار/زلوتي",       yahoo: "USDPLN=X",                    category: "forex" },

  // ── Crypto — Layer 1 ──────────────────────────────────────────────────────
  { id: "BTCUSD",   label: "BTC",   name: "Bitcoin",          yahoo: "BTC-USD",   deriv: "cryBTCUSD",  category: "crypto", sub: "layer1" },
  { id: "ETHUSD",   label: "ETH",   name: "Ethereum",         yahoo: "ETH-USD",   deriv: "cryETHUSD",  category: "crypto", sub: "layer1" },
  { id: "BNBUSD",   label: "BNB",   name: "BNB",              yahoo: "BNB-USD",                        category: "crypto", sub: "layer1" },
  { id: "XRPUSD",   label: "XRP",   name: "Ripple",           yahoo: "XRP-USD",   deriv: "cryXRPUSD",  category: "crypto", sub: "layer1" },
  { id: "SOLUSD",   label: "SOL",   name: "Solana",           yahoo: "SOL-USD",                        category: "crypto", sub: "layer1" },
  { id: "ADAUSD",   label: "ADA",   name: "Cardano",          yahoo: "ADA-USD",                        category: "crypto", sub: "layer1" },
  { id: "AVAXUSD",  label: "AVAX",  name: "Avalanche",        yahoo: "AVAX-USD",                       category: "crypto", sub: "layer1" },
  { id: "DOTUSD",   label: "DOT",   name: "Polkadot",         yahoo: "DOT-USD",                        category: "crypto", sub: "layer1" },
  { id: "MATICUSD", label: "MATIC", name: "Polygon",          yahoo: "MATIC-USD",                      category: "crypto", sub: "layer1" },
  { id: "LTCUSD",   label: "LTC",   name: "Litecoin",         yahoo: "LTC-USD",   deriv: "cryLTCUSD",  category: "crypto", sub: "layer1" },
  { id: "TRXUSD",   label: "TRX",   name: "TRON",             yahoo: "TRX-USD",                        category: "crypto", sub: "layer1" },
  { id: "NEARUSD",  label: "NEAR",  name: "NEAR Protocol",    yahoo: "NEAR-USD",                       category: "crypto", sub: "layer1" },
  { id: "ATOMUSD",  label: "ATOM",  name: "Cosmos",           yahoo: "ATOM-USD",                       category: "crypto", sub: "layer1" },
  { id: "XLMUSD",   label: "XLM",   name: "Stellar",          yahoo: "XLM-USD",                        category: "crypto", sub: "layer1" },
  { id: "ALGOUSD",  label: "ALGO",  name: "Algorand",         yahoo: "ALGO-USD",                       category: "crypto", sub: "layer1" },
  { id: "VETUSD",   label: "VET",   name: "VeChain",          yahoo: "VET-USD",                        category: "crypto", sub: "layer1" },
  { id: "ETCUSD",   label: "ETC",   name: "Ethereum Classic", yahoo: "ETC-USD",                        category: "crypto", sub: "layer1" },
  { id: "BCHUSD",   label: "BCH",   name: "Bitcoin Cash",     yahoo: "BCH-USD",                        category: "crypto", sub: "layer1" },
  { id: "XTZUSD",   label: "XTZ",   name: "Tezos",            yahoo: "XTZ-USD",                        category: "crypto", sub: "layer1" },
  { id: "EOSUSD",   label: "EOS",   name: "EOS",              yahoo: "EOS-USD",                        category: "crypto", sub: "layer1" },
  { id: "FLOWUSD",  label: "FLOW",  name: "Flow",             yahoo: "FLOW-USD",                       category: "crypto", sub: "layer1" },
  { id: "HBARUSD",  label: "HBAR",  name: "Hedera",           yahoo: "HBAR-USD",                       category: "crypto", sub: "layer1" },
  { id: "XMRUSD",   label: "XMR",   name: "Monero",           yahoo: "XMR-USD",                        category: "crypto", sub: "layer1" },
  { id: "DASHUSD",  label: "DASH",  name: "Dash",             yahoo: "DASH-USD",                       category: "crypto", sub: "layer1" },
  { id: "ZECUSD",   label: "ZEC",   name: "Zcash",            yahoo: "ZEC-USD",                        category: "crypto", sub: "layer1" },

  // ── Crypto — Meme ─────────────────────────────────────────────────────────
  { id: "DOGEUSD",  label: "DOGE",  name: "Dogecoin",         yahoo: "DOGE-USD",                       category: "crypto", sub: "meme" },
  { id: "SHIBUSD",  label: "SHIB",  name: "Shiba Inu",        yahoo: "SHIB-USD",                       category: "crypto", sub: "meme" },
  { id: "PEPEUSD",  label: "PEPE",  name: "Pepe",             yahoo: "PEPE-USD",                       category: "crypto", sub: "meme" },
  { id: "BONKUSD",  label: "BONK",  name: "Bonk",             yahoo: "BONK-USD",                       category: "crypto", sub: "meme" },

  // ── Crypto — DeFi ─────────────────────────────────────────────────────────
  { id: "LINKUSD",  label: "LINK",  name: "Chainlink",        yahoo: "LINK-USD",                       category: "crypto", sub: "defi" },
  { id: "UNIUSD",   label: "UNI",   name: "Uniswap",          yahoo: "UNI-USD",                        category: "crypto", sub: "defi" },
  { id: "AAVEUSD",  label: "AAVE",  name: "Aave",             yahoo: "AAVE-USD",                       category: "crypto", sub: "defi" },
  { id: "MKRUSD",   label: "MKR",   name: "Maker",            yahoo: "MKR-USD",                        category: "crypto", sub: "defi" },
  { id: "CRVUSD",   label: "CRV",   name: "Curve DAO",        yahoo: "CRV-USD",                        category: "crypto", sub: "defi" },
  { id: "SNXUSD",   label: "SNX",   name: "Synthetix",        yahoo: "SNX-USD",                        category: "crypto", sub: "defi" },
  { id: "COMPUSD",  label: "COMP",  name: "Compound",         yahoo: "COMP-USD",                       category: "crypto", sub: "defi" },
  { id: "SUSHIUSD", label: "SUSHI", name: "SushiSwap",        yahoo: "SUSHI-USD",                      category: "crypto", sub: "defi" },

  // ── Crypto — Layer 2 ──────────────────────────────────────────────────────
  { id: "OPUSD",    label: "OP",    name: "Optimism",         yahoo: "OP-USD",                         category: "crypto", sub: "layer2" },
  { id: "ARBUSD",   label: "ARB",   name: "Arbitrum",         yahoo: "ARB-USD",                        category: "crypto", sub: "layer2" },
  { id: "APTUSD",   label: "APT",   name: "Aptos",            yahoo: "APT-USD",                        category: "crypto", sub: "layer2" },
  { id: "SUIUSD",   label: "SUI",   name: "Sui",              yahoo: "SUI-USD",                        category: "crypto", sub: "layer2" },
  { id: "INJUSD",   label: "INJ",   name: "Injective",        yahoo: "INJ-USD",                        category: "crypto", sub: "layer2" },
  { id: "RNDRUSD",  label: "RNDR",  name: "Render",           yahoo: "RNDR-USD",                       category: "crypto", sub: "layer2" },
  { id: "IMXUSD",   label: "IMX",   name: "Immutable",        yahoo: "IMX-USD",                        category: "crypto", sub: "layer2" },
  { id: "GRTUSD",   label: "GRT",   name: "The Graph",        yahoo: "GRT-USD",                        category: "crypto", sub: "layer2" },
  { id: "FILUSD",   label: "FIL",   name: "Filecoin",         yahoo: "FIL-USD",                        category: "crypto", sub: "layer2" },
  { id: "SANDUSD",  label: "SAND",  name: "The Sandbox",      yahoo: "SAND-USD",                       category: "crypto", sub: "layer2" },
  { id: "MANAUSD",  label: "MANA",  name: "Decentraland",     yahoo: "MANA-USD",                       category: "crypto", sub: "layer2" },
  { id: "AXSUSD",   label: "AXS",   name: "Axie Infinity",    yahoo: "AXS-USD",                        category: "crypto", sub: "layer2" },

  // ── Synthetic OTC (Deriv only — always open 24/7) ─────────────────────────

  // Volatility Indices
  { id: "V10",    label: "V10",     name: "Volatility 10",      yahoo: "BTC-USD", deriv: "R_10",         category: "synthetic" },
  { id: "V25",    label: "V25",     name: "Volatility 25",      yahoo: "BTC-USD", deriv: "R_25",         category: "synthetic" },
  { id: "V50",    label: "V50",     name: "Volatility 50",      yahoo: "BTC-USD", deriv: "R_50",         category: "synthetic" },
  { id: "V75",    label: "V75",     name: "Volatility 75",      yahoo: "BTC-USD", deriv: "R_75",         category: "synthetic" },
  { id: "V100",   label: "V100",    name: "Volatility 100",     yahoo: "BTC-USD", deriv: "R_100",        category: "synthetic" },
  { id: "V10S",   label: "V10(s)",  name: "Volatility 10 (1s)", yahoo: "BTC-USD", deriv: "1HZ10V",       category: "synthetic" },
  { id: "V25S",   label: "V25(s)",  name: "Volatility 25 (1s)", yahoo: "BTC-USD", deriv: "1HZ25V",       category: "synthetic" },
  { id: "V50S",   label: "V50(s)",  name: "Volatility 50 (1s)", yahoo: "BTC-USD", deriv: "1HZ50V",       category: "synthetic" },
  { id: "V75S",   label: "V75(s)",  name: "Volatility 75 (1s)", yahoo: "BTC-USD", deriv: "1HZ75V",       category: "synthetic" },
  { id: "V100S",  label: "V100(s)", name: "Volatility 100 (1s)",yahoo: "BTC-USD", deriv: "1HZ100V",      category: "synthetic" },

  // Crash & Boom Indices
  { id: "BOOM300",   label: "Boom 300",   name: "Boom 300",   yahoo: "BTC-USD", deriv: "BOOM300N",   category: "synthetic" },
  { id: "BOOM500",   label: "Boom 500",   name: "Boom 500",   yahoo: "BTC-USD", deriv: "BOOM500",    category: "synthetic" },
  { id: "BOOM1000",  label: "Boom 1000",  name: "Boom 1000",  yahoo: "BTC-USD", deriv: "BOOM1000",   category: "synthetic" },
  { id: "CRASH300",  label: "Crash 300",  name: "Crash 300",  yahoo: "BTC-USD", deriv: "CRASH300N",  category: "synthetic" },
  { id: "CRASH500",  label: "Crash 500",  name: "Crash 500",  yahoo: "BTC-USD", deriv: "CRASH500",   category: "synthetic" },
  { id: "CRASH1000", label: "Crash 1000", name: "Crash 1000", yahoo: "BTC-USD", deriv: "CRASH1000",  category: "synthetic" },

  // Jump Indices
  { id: "JMP10",  label: "Jump 10",  name: "Jump 10",  yahoo: "BTC-USD", deriv: "JD10",  category: "synthetic" },
  { id: "JMP25",  label: "Jump 25",  name: "Jump 25",  yahoo: "BTC-USD", deriv: "JD25",  category: "synthetic" },
  { id: "JMP50",  label: "Jump 50",  name: "Jump 50",  yahoo: "BTC-USD", deriv: "JD50",  category: "synthetic" },
  { id: "JMP75",  label: "Jump 75",  name: "Jump 75",  yahoo: "BTC-USD", deriv: "JD75",  category: "synthetic" },
  { id: "JMP100", label: "Jump 100", name: "Jump 100", yahoo: "BTC-USD", deriv: "JD100", category: "synthetic" },

  // Step Index
  { id: "STEP",   label: "Step",     name: "Step Index",  yahoo: "BTC-USD", deriv: "STPRIDX", category: "synthetic" },

  // Range Break
  { id: "RB200",  label: "RB 200",  name: "Range Break 200", yahoo: "BTC-USD", deriv: "RNGBR200",  category: "synthetic" },
  { id: "RB100",  label: "RB 100",  name: "Range Break 100", yahoo: "BTC-USD", deriv: "RNGBR100",  category: "synthetic" },

  // ── Commodities ───────────────────────────────────────────────────────────
  { id: "GOLD",   label: "XAU", name: "ذهب",  yahoo: "GC=F", deriv: "frxXAUUSD", category: "commodity" },
  { id: "SILVER", label: "XAG", name: "فضة",  yahoo: "SI=F",                     category: "commodity" },
  { id: "OIL",    label: "OIL", name: "نفط",  yahoo: "CL=F",                     category: "commodity" },

  // ── Indices ───────────────────────────────────────────────────────────────
  { id: "SPX", label: "S&P 500", name: "مؤشر S&P", yahoo: "^GSPC", category: "index" },
  { id: "NDX", label: "NASDAQ",  name: "ناسداك",   yahoo: "^IXIC", category: "index" },
];

export const CATEGORY_LABEL: Record<Asset["category"], string> = {
  forex:     "فوركس",
  crypto:    "عملات رقمية",
  commodity: "سلع",
  index:     "مؤشرات",
  synthetic: "OTC اصطناعية",
};

export const SUB_LABEL: Record<string, string> = {
  layer1: "Layer 1",
  meme:   "Meme",
  defi:   "DeFi",
  layer2: "Layer 2",
};
