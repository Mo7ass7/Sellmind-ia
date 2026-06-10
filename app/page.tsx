"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type SignalType = "BUY" | "SELL" | "NEUTRAL";

type Direction = "UP" | "DOWN" | "NEUTRAL";

interface CandlePattern {
  name: string;
  nameAr: string;
  direction: Direction;
  strength: 1 | 2 | 3;
  emoji: string;
}

interface CandleAnalysis {
  patterns: CandlePattern[];
  prediction: Direction;
  confidence: number;
  label: string;
  upCount: number;
  downCount: number;
}

interface Result {
  signal: SignalType;
  indicators: Record<string, SignalType>;
  values: {
    rsi: number;
    macd: number;
    macdSignal: number;
    macdHist: number;
    bbUpper: number;
    bbLower: number;
    ema20: number;
    ema50: number;
    stochK: number;
    stochD: number;
    close: number;
  };
  candles: CandleAnalysis;
  buyCount: number;
  sellCount: number;
  totalCount: number;
  symbol: string;
  currency: string;
  price: number;
  interval: string;
  timestamp: string;
  error?: string;
}

const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "1d"];

const INTERVAL_LABELS: Record<string, string> = {
  "1m": "1 دقيقة",
  "5m": "5 دقائق",
  "15m": "15 دقيقة",
  "30m": "30 دقيقة",
  "1h": "ساعة",
  "1d": "يومي",
};

const POPULAR_SYMBOLS = [
  "BTC-USD", "ETH-USD", "BNB-USD",
  "EURUSD=X", "GBPUSD=X", "USDJPY=X",
  "GC=F", "CL=F", "AAPL",
];

const SIG = {
  BUY:     { label: "شراء",  emoji: "✅", text: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-500/50", glow: "glow-green" },
  SELL:    { label: "بيع",   emoji: "🔴", bg: "bg-red-950/60 border-red-500/50",     text: "text-red-400",     glow: "glow-red" },
  NEUTRAL: { label: "انتظر", emoji: "⏳", bg: "bg-yellow-950/60 border-yellow-500/50", text: "text-yellow-400", glow: "glow-yellow" },
};

function Badge({ sig }: { sig: SignalType }) {
  const c = SIG[sig];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${c.text} ${c.bg}`}>
      {c.emoji} {c.label}
    </span>
  );
}

function IndicatorRow({ name, sig, detail }: { name: string; sig: SignalType; detail: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
      <div className="flex items-center gap-3">
        <Badge sig={sig} />
        <span className="text-slate-400 text-sm">{detail}</span>
      </div>
      <span className="text-slate-200 font-semibold text-sm">{name}</span>
    </div>
  );
}

function RSIBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const color = value < 30 ? "bg-emerald-500" : value > 70 ? "bg-red-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-[#1e1e30] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8">{pct.toFixed(0)}</span>
    </div>
  );
}

const CANDLE_SIG = {
  UP:      { label: "إغلاق أخضر",  color: "text-emerald-400", bg: "bg-emerald-950/50 border-emerald-500/50", icon: "🟢", arrow: "↑" },
  DOWN:    { label: "إغلاق أحمر",  color: "text-red-400",     bg: "bg-red-950/50 border-red-500/50",         icon: "🔴", arrow: "↓" },
  NEUTRAL: { label: "غير محدد",    color: "text-slate-400",   bg: "bg-[#13131f] border-[#1e1e30]",           icon: "⚪", arrow: "→" },
};

const STR_LABEL: Record<number, string> = { 1: "ضعيف", 2: "متوسط", 3: "قوي" };
const STR_COLOR: Record<number, string> = { 1: "text-slate-500", 2: "text-yellow-400", 3: "text-emerald-400" };

function CandleSection({ candles }: { candles: CandleAnalysis }) {
  const cs = CANDLE_SIG[candles.prediction];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-4">
      <h2 className="text-slate-300 font-bold mb-3 text-sm flex items-center gap-2">
        🕯️ تحليل الشمعة الحالية
        <span className="text-slate-600 text-xs font-normal">(OTC)</span>
      </h2>

      {/* Prediction banner */}
      <div className={`border rounded-xl p-4 mb-3 flex items-center justify-between ${cs.bg}`}>
        <div>
          <div className={`text-2xl font-black ${cs.color}`}>
            {cs.arrow} {cs.label}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            {candles.patterns.length > 0
              ? `${candles.patterns.length} نمط محدد · ثقة ${candles.confidence}%`
              : "لم يُكتشف نمط واضح"}
          </div>
        </div>
        <span className="text-4xl">{cs.icon}</span>
      </div>

      {/* Confidence bar */}
      {candles.confidence > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>قوة الإشارة</span>
            <span>{candles.confidence}%</span>
          </div>
          <div className="h-2 bg-[#0d0d14] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                candles.prediction === "UP" ? "bg-emerald-500" :
                candles.prediction === "DOWN" ? "bg-red-500" : "bg-slate-500"
              }`}
              style={{ width: `${candles.confidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Patterns list */}
      {candles.patterns.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs text-slate-500 hover:text-slate-300 text-right transition-colors mb-2"
          >
            {expanded ? "▲ إخفاء الأنماط" : `▼ عرض ${candles.patterns.length} نمط مكتشف`}
          </button>

          {expanded && (
            <div className="space-y-1.5">
              {candles.patterns.map((p, i) => {
                const dir = p.direction === "UP"
                  ? "text-emerald-400" : p.direction === "DOWN"
                  ? "text-red-400" : "text-slate-400";
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1e1e30] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${STR_COLOR[p.strength]}`}>
                        {"★".repeat(p.strength)}
                      </span>
                      <span className={`text-xs ${dir}`}>
                        {p.direction === "UP" ? "↑" : p.direction === "DOWN" ? "↓" : "→"}
                        {" "}{STR_LABEL[p.strength]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-200 text-sm">{p.emoji} {p.nameAr}</span>
                      <span className="text-slate-600 text-xs mr-1">({p.name})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {candles.patterns.length === 0 && (
        <p className="text-slate-600 text-xs text-center py-2">
          لا توجد أنماط شمعيات واضحة في الوقت الحالي
        </p>
      )}
    </div>
  );
}

export default function Page() {
  const [symbol, setSymbol]     = useState("BTC-USD");
  const [interval, setInterval] = useState("1h");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<Result | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/signal?symbol=${encodeURIComponent(symbol.trim())}&interval=${interval}`);
      const data: Result = await res.json();

      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  const v = result?.values;
  const sig = result ? SIG[result.signal] : null;

  const indicatorDetails: Record<string, string> = v
    ? {
        "RSI (14)":          `RSI = ${v.rsi.toFixed(1)}`,
        "MACD (12/26/9)":    `Hist = ${v.macdHist.toFixed(4)}`,
        "Bollinger Bands":   `السعر: ${v.close.toFixed(4)} | نطاق: ${v.bbLower.toFixed(4)} – ${v.bbUpper.toFixed(4)}`,
        "EMA (20/50)":       `EMA20 = ${v.ema20.toFixed(4)} | EMA50 = ${v.ema50.toFixed(4)}`,
        "Stochastic (14/3)": `K = ${v.stochK.toFixed(1)} | D = ${v.stochD.toFixed(1)}`,
      }
    : {};

  return (
    <main className="min-h-screen bg-[#0d0d14] px-4 py-8">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-1">
            📊 Sellmind <span className="text-indigo-400">IA</span>
          </h1>
          <p className="text-slate-400 text-sm">
            إشارة شراء أو بيع فقط عند تطابق جميع المؤشرات
          </p>
          <Link
            href="/scanner"
            className="mt-3 inline-block px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs rounded-full hover:bg-indigo-600/40 transition-colors"
          >
            🔭 ماسح جميع الأسواق (Quotex)
          </Link>
        </div>

        {/* Form */}
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-5 mb-5">

          {/* Symbol input */}
          <label className="block text-slate-300 text-sm mb-1.5 font-semibold">رمز العملة أو الزوج</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="مثال: BTC-USD, EURUSD=X, AAPL"
            className="w-full bg-[#0d0d14] border border-[#1e1e30] text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 mb-3"
            dir="ltr"
          />

          {/* Quick symbols */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {POPULAR_SYMBOLS.map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  symbol === s
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-[#0d0d14] border-[#1e1e30] text-slate-400 hover:border-indigo-500/50 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Interval */}
          <label className="block text-slate-300 text-sm mb-1.5 font-semibold">الإطار الزمني</label>
          <div className="grid grid-cols-6 gap-1.5 mb-5">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  interval === iv
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-[#0d0d14] border-[#1e1e30] text-slate-400 hover:border-indigo-500/50 hover:text-white"
                }`}
              >
                {iv}
              </button>
            ))}
          </div>

          <button
            onClick={analyze}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {loading ? "⏳ جاري التحليل..." : "🔍 تحليل الآن"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-4 mb-5 text-red-300 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && sig && (
          <>
            {/* Main signal banner */}
            <div className={`border rounded-2xl p-6 mb-4 text-center ${sig.bg} ${sig.glow}`}>
              <div className="text-5xl mb-2">{sig.emoji}</div>
              <div className={`text-3xl font-black mb-1 ${sig.text}`}>{sig.label}</div>
              <div className="text-slate-400 text-sm">
                {result.symbol} · {INTERVAL_LABELS[result.interval] || result.interval}
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {result.price.toLocaleString("en-US", { maximumFractionDigits: 5 })}
                <span className="text-slate-400 text-sm mr-1">{result.currency}</span>
              </div>
            </div>

            {/* Indicator count */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-emerald-400">{result.buyCount}</div>
                <div className="text-xs text-slate-400">مؤشرات شراء</div>
              </div>
              <div className="flex-1 bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-red-400">{result.sellCount}</div>
                <div className="text-xs text-slate-400">مؤشرات بيع</div>
              </div>
              <div className="flex-1 bg-[#13131f] border border-[#1e1e30] rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-slate-300">
                  {result.totalCount - result.buyCount - result.sellCount}
                </div>
                <div className="text-xs text-slate-400">محايدة</div>
              </div>
            </div>

            {/* Indicators breakdown */}
            <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-4">
              <h2 className="text-slate-300 font-bold mb-3 text-sm">تفاصيل المؤشرات</h2>
              {Object.entries(result.indicators).map(([name, s]) => (
                <IndicatorRow key={name} name={name} sig={s} detail={indicatorDetails[name] ?? ""} />
              ))}

              {v && (
                <div className="mt-3 pt-3 border-t border-[#1e1e30]">
                  <div className="text-xs text-slate-500 mb-1">RSI ({v.rsi.toFixed(1)})</div>
                  <RSIBar value={v.rsi} />
                </div>
              )}
            </div>

            {/* Candle patterns */}
            {result.candles && (
              <CandleSection candles={result.candles} />
            )}

            {/* Timestamp */}
            <p className="text-center text-xs text-slate-600 mt-2">
              آخر تحديث:{" "}
              {new Date(result.timestamp).toLocaleTimeString("ar-SA")}
            </p>
          </>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-700 mt-6">
          ⚠️ للأغراض التعليمية فقط — ليست نصيحة مالية
        </p>
      </div>
    </main>
  );
}
