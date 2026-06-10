import { NextRequest, NextResponse } from "next/server";
import { calculateSignals, getSignals } from "@/lib/indicators";
import { analyzeCandlePatterns } from "@/lib/candles";
import { ASSETS, Asset } from "@/lib/assets";

const RANGE: Record<string, string> = {
  "1m": "1d", "5m": "60d", "15m": "60d",
  "30m": "60d", "1h": "2y", "1d": "5y",
};
const YF_INTERVAL: Record<string, string> = { "1h": "60m" };

async function fetchAsset(asset: Asset, interval: string) {
  const range = RANGE[interval] ?? "60d";
  const yfi  = YF_INTERVAL[interval] ?? interval;
  const url  =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(asset.yahoo)}?interval=${yfi}&range=${range}&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("no data");

  const q = result.indicators.quote[0];

  const clean = (arr: (number | null)[]) =>
    (arr ?? []).map((v) => (v == null ? NaN : v));

  const closes = clean(q.close);
  const highs  = clean(q.high);
  const lows   = clean(q.low);
  const opens  = clean(q.open);

  const valid = closes
    .map((_, i) => i)
    .filter((i) => !isNaN(closes[i]) && !isNaN(highs[i]) && !isNaN(lows[i]) && !isNaN(opens[i]));

  if (valid.length < 60) throw new Error("insufficient data");

  const c = valid.map((i) => closes[i]);
  const h = valid.map((i) => highs[i]);
  const l = valid.map((i) => lows[i]);
  const o = valid.map((i) => opens[i]);

  const values  = calculateSignals(c, h, l);
  const signals = getSignals(values);
  const candles = analyzeCandlePatterns(o, h, l, c);

  return {
    id:       asset.id,
    label:    asset.label,
    category: asset.category,
    price:    result.meta.regularMarketPrice ?? c[c.length - 1],
    currency: result.meta.currency ?? "USD",
    signal:      signals.signal,
    buyCount:    signals.buyCount,
    sellCount:   signals.sellCount,
    totalCount:  signals.totalCount,
    indicators:  signals.indicators,
    candle:      candles.prediction,
    candleConf:  candles.confidence,
    patterns:    candles.patterns,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const interval = searchParams.get("interval") || "1h";
  const category = searchParams.get("category") || "all";

  const targets = category === "all"
    ? ASSETS
    : ASSETS.filter((a) => a.category === category);

  const results = await Promise.allSettled(
    targets.map((asset) => fetchAsset(asset, interval))
  );

  const data = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      id:       targets[i].id,
      label:    targets[i].label,
      category: targets[i].category,
      error:    true,
      signal:   "NEUTRAL" as const,
      buyCount: 0, sellCount: 0, totalCount: 5,
    };
  });

  const summary = {
    buy:     data.filter((d) => d.signal === "BUY").length,
    sell:    data.filter((d) => d.signal === "SELL").length,
    neutral: data.filter((d) => d.signal === "NEUTRAL").length,
  };

  return NextResponse.json({
    assets: data,
    summary,
    interval,
    timestamp: new Date().toISOString(),
  });
}
