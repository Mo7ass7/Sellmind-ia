import { NextRequest, NextResponse } from "next/server";
import { calculateSignals, getSignals } from "@/lib/indicators";
import { analyzeCandlePatterns } from "@/lib/candles";

const RANGE: Record<string, string> = {
  "1m": "1d",
  "5m": "60d",
  "15m": "60d",
  "30m": "60d",
  "1h": "2y",
  "1d": "5y",
};

// yfinance uses 60m not 1h
const YF_INTERVAL: Record<string, string> = { "1h": "60m" };

function clean(arr: (number | null)[]): number[] {
  return (arr ?? []).map((v) => v ?? NaN);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "BTC-USD").toUpperCase();
  const interval = searchParams.get("interval") || "1h";

  const range = RANGE[interval] ?? "60d";
  const yfInterval = YF_INTERVAL[interval] ?? interval;

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}?interval=${yfInterval}&range=${range}&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`خطأ من Yahoo Finance: ${res.status}`);

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error("لم يتم العثور على بيانات لهذا الرمز");

    const q = result.indicators.quote[0];
    const closes = clean(q.close);
    const highs  = clean(q.high);
    const lows   = clean(q.low);
    const opens  = clean(q.open);

    // Remove NaN candles
    const valid = closes.map((_, i) => i).filter(
      (i) => !isNaN(closes[i]) && !isNaN(highs[i]) && !isNaN(lows[i]) && !isNaN(opens[i])
    );

    const c = valid.map((i) => closes[i]);
    const h = valid.map((i) => highs[i]);
    const l = valid.map((i) => lows[i]);
    const o = valid.map((i) => opens[i]);

    if (c.length < 60) throw new Error("البيانات غير كافية لحساب المؤشرات");

    const values  = calculateSignals(c, h, l);
    const signals = getSignals(values);
    const candles = analyzeCandlePatterns(o, h, l, c);

    return NextResponse.json({
      ...signals,
      candles,
      symbol: result.meta.symbol,
      currency: result.meta.currency ?? "USD",
      price: result.meta.regularMarketPrice ?? c[c.length - 1],
      interval,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
