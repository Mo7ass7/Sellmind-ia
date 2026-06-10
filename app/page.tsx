"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ASSETS, CATEGORY_LABEL, SUB_LABEL, Asset } from "@/lib/assets";

// ── Types ────────────────────────────────────────────────────────────────────
type SignalType = "BUY" | "SELL" | "NEUTRAL";
type Direction  = "UP" | "DOWN" | "NEUTRAL";

interface CandlePattern { name: string; nameAr: string; direction: Direction; strength: 1|2|3; emoji: string }
interface CandleAnalysis { patterns: CandlePattern[]; prediction: Direction; confidence: number; label: string; upCount: number; downCount: number }

interface Result {
  source?: string;
  signal: SignalType;
  indicators: Record<string, SignalType>;
  values: { rsi: number; macd: number; macdSignal: number; macdHist: number; bbUpper: number; bbLower: number; ema20: number; ema50: number; stochK: number; stochD: number; close: number };
  candles: CandleAnalysis;
  buyCount: number; sellCount: number; totalCount: number;
  price: number; interval: string; timestamp: string;
  error?: string;
}

interface SpikeState {
  lastSpikeIdx: number; candlesSince: number;
  expectedInterval: number; proximity: number;
  direction: "UP" | "DOWN";
}

interface OtcData {
  source: string; derivSymbol: string; price: number;
  interval: string; signal: SignalType; confidence: number;
  syntheticType: string; spike: SpikeState | null;
  reason: string; pattern: string;
  indicators: Record<string, number>;
  candleCount: number; timestamp: string;
  error?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const INTERVALS = ["1m","5m","15m","30m","1h","1d"];
const INTERVAL_AR: Record<string,string> = { "1m":"1 دقيقة","5m":"5 دقائق","15m":"15 دقيقة","30m":"30 دقيقة","1h":"ساعة","1d":"يومي" };
const PAYOUT = 85;

const SIG = {
  BUY:     { label:"شراء",  emoji:"✅", text:"text-emerald-400", bg:"bg-emerald-950/60 border-emerald-500/50" },
  SELL:    { label:"بيع",   emoji:"🔴", text:"text-red-400",     bg:"bg-red-950/60 border-red-500/50" },
  NEUTRAL: { label:"انتظر", emoji:"⏳", text:"text-yellow-400",  bg:"bg-yellow-950/60 border-yellow-500/50" },
};

const CANDLE_SIG = {
  UP:      { label:"إغلاق أخضر ↑", color:"text-emerald-400", bg:"bg-emerald-950/40 border-emerald-500/30" },
  DOWN:    { label:"إغلاق أحمر ↓", color:"text-red-400",     bg:"bg-red-950/40 border-red-500/30" },
  NEUTRAL: { label:"غير محدد",     color:"text-slate-400",   bg:"bg-[#13131f] border-[#1e1e30]" },
};

// ── Asset Selector Modal ──────────────────────────────────────────────────────
const ALL_SELECTABLE = ASSETS.filter(a => a.category !== "index");
const SUB_TABS = ["all","synthetic","forex","layer1","meme","defi","layer2"] as const;
const SUB_LABELS: Record<string,string> = {
  all:"الكل", synthetic:"⚡ OTC", forex:"فوركس", layer1:"Layer 1",
  meme:"Meme", defi:"DeFi", layer2:"Layer 2",
};

function AssetModal({ onSelect, onClose }: { onSelect:(a:Asset)=>void; onClose:()=>void }) {
  const [q, setQ]     = useState("");
  const [tab, setTab] = useState<string>("all");

  const filtered = ALL_SELECTABLE.filter(a => {
    let matchTab = false;
    if (tab === "all")       matchTab = true;
    else if (tab === "forex") matchTab = a.category === "forex";
    else if (tab === "synthetic") matchTab = a.category === "synthetic";
    else matchTab = a.sub === tab;
    const matchQ = q === "" || a.label.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase());
    return matchTab && matchQ;
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#1e1e30]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold">اختر أصل للتحليل</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
          </div>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="ابحث... BTC, ETH, EUR/USD, Boom"
            className="w-full bg-[#0d0d14] border border-[#1e1e30] rounded-xl px-4 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            dir="ltr" />
        </div>

        <div className="flex gap-1 px-3 pt-2 overflow-x-auto pb-1">
          {SUB_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors ${
                tab === t
                  ? t === "synthetic"
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-indigo-600 border-indigo-500 text-white"
                  : t === "synthetic"
                    ? "bg-purple-950/40 border-purple-700/50 text-purple-300"
                    : "bg-[#0d0d14] border-[#1e1e30] text-slate-400"
              }`}>
              {SUB_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-3 grid grid-cols-2 gap-2">
          {filtered.map(a => (
            <button key={a.id} onClick={() => { onSelect(a); onClose(); }}
              className={`flex items-center gap-2 border rounded-xl p-2.5 transition-colors text-left ${
                a.category === "synthetic"
                  ? "bg-purple-950/20 border-purple-700/40 hover:border-purple-500/70 hover:bg-purple-950/40"
                  : "bg-[#0d0d14] border-[#1e1e30] hover:border-indigo-500/50 hover:bg-indigo-950/20"
              }`}>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black ${
                a.category === "synthetic"
                  ? "bg-purple-900/40 border-purple-500/30 text-purple-300"
                  : "bg-indigo-900/40 border-indigo-500/30 text-indigo-300"
              }`}>
                {a.label.slice(0,3)}
              </div>
              <div>
                <div className="text-white text-xs font-bold">{a.label}</div>
                <div className="text-slate-500 text-xs truncate max-w-[80px]">{a.name}</div>
              </div>
              {a.category === "synthetic"
                ? <span className="mr-auto text-xs text-purple-400">⚡</span>
                : a.deriv && <span className="mr-auto text-xs text-emerald-600">●</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center text-slate-600 py-8 text-sm">لا توجد نتائج</div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-[#1e1e30]">
          <span className="text-xs text-slate-600">⚡ = OTC Engine · ● = Deriv Live</span>
        </div>
      </div>
    </div>
  );
}

// ── Indicator Row (standard TA) ───────────────────────────────────────────────
function IndicatorRow({ name, sig, detail }: { name:string; sig:SignalType; detail:string }) {
  const c = SIG[sig];
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e1e30] last:border-0">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${c.text} ${c.bg}`}>{c.emoji} {c.label}</span>
        <span className="text-slate-500 text-xs">{detail}</span>
      </div>
      <span className="text-slate-300 text-xs font-medium">{name}</span>
    </div>
  );
}

// ── OTC Signal Panel ──────────────────────────────────────────────────────────
function OtcPanel({ data, loading, onRefresh, interval }: {
  data: OtcData; loading: boolean; onRefresh: () => void; interval: string
}) {
  const [showInd, setShowInd] = useState(false);
  const sig = SIG[data.signal];
  const sp  = data.spike;
  const isBoom  = data.derivSymbol.toUpperCase().startsWith("BOOM");
  const isCrash = data.derivSymbol.toUpperCase().startsWith("CRASH");

  return (
    <>
      {/* Live price */}
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-3 text-center">
        <div className="text-3xl font-black text-white tracking-tight">
          {data.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}
        </div>
        <div className="text-slate-500 text-xs mt-0.5">
          {INTERVAL_AR[interval]} · {new Date(data.timestamp).toLocaleTimeString("ar-SA")}
        </div>
      </div>

      {/* OTC Signal banner */}
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-3">

        {/* Confidence + Signal */}
        <div className={`rounded-xl p-3 mb-4 text-center border ${sig.bg}`}>
          <div className="text-4xl mb-1">{sig.emoji}</div>
          <div className={`text-2xl font-black ${sig.text}`}>{sig.label}</div>
          <div className="text-slate-400 text-xs mt-1 font-mono">
            ثقة المحرك: <span className={`font-bold ${sig.text}`}>{data.confidence}%</span>
          </div>
        </div>

        {/* Pattern label */}
        <div className="bg-[#0d0d14] border border-[#1e1e30] rounded-xl p-3 mb-3 text-center">
          <div className="text-slate-200 text-sm font-bold">{data.pattern}</div>
          <div className="text-slate-500 text-xs mt-1 leading-relaxed" dir="ltr">{data.reason}</div>
        </div>

        {/* Spike proximity bar (Boom/Crash only) */}
        {sp && (isBoom || isCrash) && (
          <div className="bg-[#0d0d14] border border-[#1e1e30] rounded-xl p-3 mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-bold">
              <span>{isBoom ? "⚡ اقتراب Boom" : "⚡ اقتراب Crash"}</span>
              <span className={sp.proximity >= 75 ? "text-yellow-400" : sp.proximity >= 90 ? "text-red-400 animate-pulse" : "text-slate-400"}>
                {sp.proximity}%
              </span>
            </div>
            <div className="h-3 bg-[#13131f] rounded-full overflow-hidden border border-[#1e1e30]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sp.proximity >= 90 ? "bg-gradient-to-r from-orange-500 to-red-500 animate-pulse" :
                  sp.proximity >= 75 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                  sp.proximity >= 50 ? "bg-gradient-to-r from-indigo-500 to-yellow-500" :
                  "bg-indigo-600"
                }`}
                style={{ width: `${sp.proximity}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-1.5">
              <span>{sp.candlesSince} شمعة منذ آخر spike</span>
              <span>الفاصل: {sp.expectedInterval}</span>
            </div>
          </div>
        )}

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>قوة إشارة المحرك</span><span>{data.confidence}%</span>
          </div>
          <div className="h-2 bg-[#0d0d14] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data.signal === "BUY"  ? "bg-emerald-500" :
                data.signal === "SELL" ? "bg-red-500" : "bg-slate-500"
              }`}
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>

        {/* CALL / PUT Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className={`rounded-xl py-4 font-black text-lg transition-all border-2 ${
            data.signal === "BUY"
              ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/50 scale-105"
              : "bg-emerald-950/30 border-emerald-800/50 text-emerald-700"
          }`}>
            <div>CALL ↑</div>
            <div className="text-xs font-normal mt-0.5 opacity-80">{PAYOUT}% ربح</div>
          </button>

          <button className={`rounded-xl py-4 font-black text-lg transition-all border-2 ${
            data.signal === "SELL"
              ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/50 scale-105"
              : "bg-red-950/30 border-red-800/50 text-red-700"
          }`}>
            <div>PUT ↓</div>
            <div className="text-xs font-normal mt-0.5 opacity-80">{PAYOUT}% ربح</div>
          </button>
        </div>

        {loading && <div className="text-center text-slate-500 text-xs mt-2">⟳ تحديث...</div>}
      </div>

      {/* OTC engine indicators (numeric) */}
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl mb-3 overflow-hidden">
        <button onClick={() => setShowInd(!showInd)}
          className="w-full flex items-center justify-between p-4 text-slate-300 text-sm font-bold">
          <span>⚙️ بيانات المحرك الاصطناعي</span>
          <span className="text-slate-500">{showInd ? "▲" : "▼"}</span>
        </button>
        {showInd && (
          <div className="px-4 pb-4 space-y-2">
            <div className="text-xs text-slate-500 mb-2 text-right" dir="ltr">
              نوع المؤشر: <span className="text-purple-400 font-bold">{data.syntheticType}</span>
              {" "}· {data.candleCount} شمعة
            </div>
            {Object.entries(data.indicators).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-[#1e1e30] last:border-0">
                <span className="text-slate-300 text-xs font-mono">{typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 4 }) : v}</span>
                <span className="text-slate-500 text-xs">{k}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh */}
      <button onClick={onRefresh} disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#13131f] border border-[#1e1e30] text-slate-400 hover:border-purple-500/40 hover:text-white transition-colors mb-4">
        {loading ? "⏳ جاري التحديث..." : "🔄 تحديث إشارة OTC"}
      </button>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [asset,     setAsset]    = useState<Asset>(ASSETS.find(a=>a.id==="BTCUSD")!);
  const [interval,  setInterval] = useState("1m");
  const [loading,   setLoading]  = useState(false);
  const [result,    setResult]   = useState<Result | null>(null);
  const [otcData,   setOtcData]  = useState<OtcData | null>(null);
  const [error,     setError]    = useState<string | null>(null);
  const [showModal, setShowModal]= useState(false);
  const [showDetail,setShowDetail]=useState(false);
  const [showCandle,setShowCandle]=useState(false);
  const timerRef = useRef<ReturnType<typeof globalThis.setInterval>|null>(null);

  const analyze = useCallback(async (a = asset, iv = interval) => {
    setLoading(true);
    setError(null);

    try {
      // ── OTC synthetic path ────────────────────────────────────────────────
      if (a.category === "synthetic" && a.deriv) {
        const res = await fetch(`/api/otc?symbol=${encodeURIComponent(a.deriv)}&interval=${iv}`);
        const d: OtcData = await res.json();
        if (d.error) throw new Error(d.error);
        setOtcData(d);
        setResult(null);
        return;
      }

      // ── Standard path (Deriv → Yahoo fallback) ───────────────────────────
      setOtcData(null);
      let data: Result | null = null;

      if (a.deriv) {
        try {
          const res = await fetch(`/api/deriv?symbol=${encodeURIComponent(a.deriv)}&interval=${iv}`);
          const d: Result = await res.json();
          if (!d.error) data = d;
        } catch { /* fallback */ }
      }

      if (!data) {
        const res = await fetch(`/api/signal?symbol=${encodeURIComponent(a.yahoo)}&interval=${iv}`);
        data = await res.json();
      }

      if (data!.error) throw new Error(data!.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [asset, interval]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (timerRef.current) globalThis.clearInterval(timerRef.current);
    timerRef.current = globalThis.setInterval(() => analyze(), 60_000);
    return () => { if (timerRef.current) globalThis.clearInterval(timerRef.current); };
  }, [analyze]);

  const sig  = result ? SIG[result.signal] : null;
  const cSig = result?.candles ? CANDLE_SIG[result.candles.prediction] : null;
  const v    = result?.values;
  const isOtc = asset.category === "synthetic";

  const indDetails: Record<string,string> = v ? {
    "RSI (14)":          `RSI = ${v.rsi.toFixed(1)}`,
    "MACD (12/26/9)":    `Hist = ${v.macdHist.toFixed(5)}`,
    "Bollinger Bands":   `${v.bbLower.toFixed(4)} ← ${v.close.toFixed(4)} → ${v.bbUpper.toFixed(4)}`,
    "EMA (20/50)":       `EMA20=${v.ema20.toFixed(4)} | EMA50=${v.ema50.toFixed(4)}`,
    "Stochastic (14/3)": `K=${v.stochK.toFixed(1)} D=${v.stochD.toFixed(1)}`,
  } : {};

  const sourceLabel = otcData ? "⚡ OTC Engine" : result?.source === "deriv" ? "🟢 Deriv" : "🔵 Yahoo";

  return (
    <main className="min-h-screen bg-[#0a0a12] px-3 py-4">
      {showModal && <AssetModal onSelect={a => { setAsset(a); setTimeout(() => analyze(a, interval), 100); }} onClose={() => setShowModal(false)} />}

      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/scanner" className="text-slate-500 hover:text-indigo-400 text-xs transition-colors">🔭 ماسح</Link>
          <h1 className="text-xl font-black text-white">📊 Sellmind <span className="text-indigo-400">IA</span></h1>
          <div className={`text-xs ${isOtc ? "text-purple-400 font-bold" : "text-slate-600"}`}>{(result || otcData) ? sourceLabel : ""}</div>
        </div>

        {/* Asset Selector */}
        <button onClick={() => setShowModal(true)}
          className={`w-full bg-[#13131f] border rounded-2xl p-4 mb-3 flex items-center justify-between transition-colors ${
            isOtc ? "border-purple-500/40 hover:border-purple-500/70" : "border-[#1e1e30] hover:border-indigo-500/50"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-black ${
              isOtc ? "bg-purple-900/50 border-purple-500/40 text-purple-300" : "bg-indigo-900/50 border-indigo-500/40 text-indigo-300"
            }`}>
              {asset.label.slice(0,3)}
            </div>
            <div className="text-right">
              <div className="text-white font-bold flex items-center gap-1.5">
                {asset.category === "crypto" ? `${asset.label}/USD` : asset.label}
                {isOtc && <span className="text-xs text-purple-400 font-normal">OTC</span>}
              </div>
              <div className="text-slate-500 text-xs">{asset.name}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs">تغيير ▼</div>
        </button>

        {/* Interval */}
        <div className="grid grid-cols-6 gap-1.5 mb-4">
          {INTERVALS.map(iv => (
            <button key={iv} onClick={() => { setInterval(iv); analyze(asset, iv); }}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                interval === iv
                  ? isOtc ? "bg-purple-600 border-purple-500 text-white" : "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-[#13131f] border-[#1e1e30] text-slate-400 hover:border-indigo-500/40"
              }`}>{iv}</button>
          ))}
        </div>

        {/* Analyze button */}
        {!result && !otcData && (
          <button onClick={() => analyze()} disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-bold disabled:opacity-50 text-white mb-4 transition-colors ${
              isOtc ? "bg-purple-600 hover:bg-purple-500" : "bg-indigo-600 hover:bg-indigo-500"
            }`}>
            {loading ? "⏳ جاري التحليل..." : isOtc ? "⚡ تشغيل محرك OTC" : "🔍 تحليل الآن"}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-3 mb-3 text-red-300 text-sm text-center">⚠️ {error}</div>
        )}

        {/* ── OTC panel ─────────────────────────────────────────────────── */}
        {otcData && !otcData.error && (
          <OtcPanel data={otcData} loading={loading} onRefresh={() => analyze()} interval={interval} />
        )}

        {/* ── Standard TA panel ─────────────────────────────────────────── */}
        {result && sig && (
          <>
            {/* Live Price */}
            <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-3 text-center">
              <div className="text-3xl font-black text-white tracking-tight">
                {result.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}
              </div>
              <div className="text-slate-500 text-xs mt-0.5">
                USD · {INTERVAL_AR[result.interval]} · {new Date(result.timestamp).toLocaleTimeString("ar-SA")}
              </div>
            </div>

            {/* Signal + CALL/PUT Buttons */}
            <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-3">
              <div className={`rounded-xl p-3 mb-4 text-center border ${sig.bg}`}>
                <div className="text-4xl mb-1">{sig.emoji}</div>
                <div className={`text-2xl font-black ${sig.text}`}>{sig.label}</div>
                <div className="text-slate-500 text-xs mt-1">
                  المؤشرات: {result.buyCount} شراء · {result.sellCount} بيع · {result.totalCount - result.buyCount - result.sellCount} محايد
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className={`rounded-xl py-4 font-black text-lg transition-all border-2 ${
                  result.signal === "BUY"
                    ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/50 scale-105"
                    : "bg-emerald-950/30 border-emerald-800/50 text-emerald-700"
                }`}>
                  <div>CALL ↑</div>
                  <div className="text-xs font-normal mt-0.5 opacity-80">{PAYOUT}% ربح</div>
                </button>

                <button className={`rounded-xl py-4 font-black text-lg transition-all border-2 ${
                  result.signal === "SELL"
                    ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/50 scale-105"
                    : "bg-red-950/30 border-red-800/50 text-red-700"
                }`}>
                  <div>PUT ↓</div>
                  <div className="text-xs font-normal mt-0.5 opacity-80">{PAYOUT}% ربح</div>
                </button>
              </div>

              {cSig && result.candles.prediction !== "NEUTRAL" && (
                <div className={`mt-3 rounded-xl p-2.5 border text-center ${cSig.bg}`}>
                  <span className={`text-sm font-bold ${cSig.color}`}>
                    🕯️ الشمعة: {cSig.label}
                    <span className="text-slate-500 font-normal mr-1">({result.candles.confidence}%)</span>
                  </span>
                </div>
              )}

              {loading && <div className="text-center text-slate-500 text-xs mt-2">⟳ تحديث...</div>}
            </div>

            {/* Indicator strength bars */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { v: result.buyCount,    label: "شراء",  c: "text-emerald-400", b: "bg-emerald-950/40 border-emerald-500/30" },
                { v: result.sellCount,   label: "بيع",   c: "text-red-400",     b: "bg-red-950/40 border-red-500/30" },
                { v: result.totalCount - result.buyCount - result.sellCount, label: "محايد", c: "text-slate-300", b: "bg-[#13131f] border-[#1e1e30]" },
              ].map(({ v: val, label, c, b }) => (
                <div key={label} className={`border rounded-xl p-2.5 text-center ${b}`}>
                  <div className={`text-2xl font-black ${c}`}>{val}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Indicators detail */}
            <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl mb-3 overflow-hidden">
              <button onClick={() => setShowDetail(!showDetail)}
                className="w-full flex items-center justify-between p-4 text-slate-300 text-sm font-bold">
                <span>📈 تفاصيل المؤشرات</span>
                <span className="text-slate-500">{showDetail ? "▲" : "▼"}</span>
              </button>
              {showDetail && (
                <div className="px-4 pb-4">
                  {Object.entries(result.indicators).map(([n, s]) => (
                    <IndicatorRow key={n} name={n} sig={s} detail={indDetails[n] ?? ""} />
                  ))}
                  {v && (
                    <div className="mt-3 pt-3 border-t border-[#1e1e30]">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>RSI</span><span>{v.rsi.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-[#0d0d14] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${v.rsi < 30 ? "bg-emerald-500" : v.rsi > 70 ? "bg-red-500" : "bg-slate-500"}`}
                          style={{ width: `${Math.min(v.rsi, 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Candle patterns */}
            <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl mb-4 overflow-hidden">
              <button onClick={() => setShowCandle(!showCandle)}
                className="w-full flex items-center justify-between p-4 text-slate-300 text-sm font-bold">
                <span>🕯️ أنماط الشمعة ({result.candles.patterns.length})</span>
                <span className={`text-sm font-black ${cSig?.color}`}>{cSig?.label}</span>
              </button>
              {showCandle && (
                <div className="px-4 pb-4 space-y-2">
                  {result.candles.patterns.length === 0 && (
                    <p className="text-slate-600 text-xs text-center py-2">لا توجد أنماط واضحة</p>
                  )}
                  {result.candles.patterns.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={`text-xs ${p.direction==="UP"?"text-emerald-400":p.direction==="DOWN"?"text-red-400":"text-slate-400"}`}>
                        {"★".repeat(p.strength)} {p.direction==="UP"?"↑":p.direction==="DOWN"?"↓":"→"}
                      </span>
                      <span className="text-slate-200 text-sm">{p.emoji} {p.nameAr}</span>
                    </div>
                  ))}
                  {result.candles.confidence > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#1e1e30]">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>قوة إشارة الشمعة</span><span>{result.candles.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-[#0d0d14] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${result.candles.prediction==="UP"?"bg-emerald-500":result.candles.prediction==="DOWN"?"bg-red-500":"bg-slate-500"}`}
                          style={{ width: `${result.candles.confidence}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button onClick={() => analyze()} disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#13131f] border border-[#1e1e30] text-slate-400 hover:border-indigo-500/40 hover:text-white transition-colors mb-4">
              {loading ? "⏳ جاري التحديث..." : "🔄 تحديث الإشارة"}
            </button>
          </>
        )}

        <p className="text-center text-xs text-slate-700">⚠️ للأغراض التعليمية فقط — ليست نصيحة مالية</p>
      </div>
    </main>
  );
}
