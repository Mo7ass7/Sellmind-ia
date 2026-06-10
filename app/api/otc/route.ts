import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";
import { analyzeSynthetic, detectSyntheticType } from "@/lib/synthetic";

export const runtime = "nodejs";

const DERIV_WS = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

const GRANULARITY: Record<string, number> = {
  "1m": 60, "5m": 300, "15m": 900,
  "30m": 1800, "1h": 3600, "1d": 86400,
};

interface DerivCandle {
  open: number; high: number; low: number;
  close: number; epoch: number;
}

function fetchDerivCandles(symbol: string, granularity: number): Promise<DerivCandle[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(DERIV_WS);
    const timer = setTimeout(() => { ws.terminate(); reject(new Error("Deriv timeout")); }, 9000);

    ws.once("open", () => {
      ws.send(JSON.stringify({
        ticks_history: symbol,
        end: "latest",
        count: 500,          // more candles for better spike detection
        granularity,
        style: "candles",
        subscribe: 0,
      }));
    });

    ws.once("message", (raw) => {
      clearTimeout(timer);
      ws.terminate();
      try {
        const data = JSON.parse(raw.toString());
        if (data.error) return reject(new Error(data.error.message));
        resolve(data.candles as DerivCandle[]);
      } catch (e) {
        reject(e);
      }
    });

    ws.once("error", (err) => { clearTimeout(timer); reject(err); });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const derivSymbol = searchParams.get("symbol") || "BOOM1000";
  const interval    = searchParams.get("interval") || "1m";
  const granularity = GRANULARITY[interval] ?? 60;

  try {
    const candles = await fetchDerivCandles(derivSymbol, granularity);

    if (!candles || candles.length < 50)
      throw new Error("بيانات OTC غير كافية");

    const o = candles.map((c) => c.open);
    const h = candles.map((c) => c.high);
    const l = candles.map((c) => c.low);
    const c = candles.map((c) => c.close);

    const analysis = analyzeSynthetic(o, h, l, c, derivSymbol);
    const syntheticType = detectSyntheticType(derivSymbol);
    const last = candles[candles.length - 1];

    return NextResponse.json({
      source:        "otc_engine",
      derivSymbol,
      price:         last.close,
      interval,
      signal:        analysis.signal,
      confidence:    analysis.confidence,
      syntheticType,
      spike:         analysis.spike ?? null,
      reason:        analysis.reason,
      pattern:       analysis.pattern,
      indicators:    analysis.indicators,
      candleCount:   candles.length,
      timestamp:     new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطأ OTC" },
      { status: 500 }
    );
  }
}
