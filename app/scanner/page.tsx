"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { CATEGORY_LABEL } from "@/lib/assets";

type SignalType = "BUY" | "SELL" | "NEUTRAL";
type Category = "all" | "forex" | "crypto" | "commodity" | "index";

interface AssetResult {
  id: string;
  label: string;
  category: string;
  price?: number;
  currency?: string;
  signal: SignalType;
  buyCount: number;
  sellCount: number;
  totalCount: number;
  indicators?: Record<string, SignalType>;
  error?: boolean;
}

interface ScanResult {
  assets: AssetResult[];
  summary: { buy: number; sell: number; neutral: number };
  interval: string;
  timestamp: string;
}

const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "1d"];
const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all",       label: "الكل" },
  { key: "forex",     label: "فوركس" },
  { key: "crypto",    label: "رقمية" },
  { key: "commodity", label: "سلع" },
  { key: "index",     label: "مؤشرات" },
];

const FILTER_OPTIONS = [
  { key: "all",  label: "الكل" },
  { key: "BUY",  label: "شراء فقط" },
  { key: "SELL", label: "بيع فقط" },
];

const SIG = {
  BUY:     { emoji: "✅", label: "شراء",  text: "text-emerald-400", bg: "bg-emerald-950/50 border-emerald-500/40" },
  SELL:    { emoji: "🔴", label: "بيع",   text: "text-red-400",     bg: "bg-red-950/50 border-red-500/40" },
  NEUTRAL: { emoji: "⏳", label: "انتظر", text: "text-yellow-400",  bg: "bg-[#1a1a2e] border-[#1e1e30]" },
};

function StrengthBar({ buy, sell, total }: { buy: number; sell: number; total: number }) {
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: total }).map((_, i) => {
        const isBuy  = i < buy;
        const isSell = i >= total - sell;
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              isBuy ? "bg-emerald-500" : isSell ? "bg-red-500" : "bg-[#1e1e30]"
            }`}
          />
        );
      })}
    </div>
  );
}

function AssetCard({ asset }: { asset: AssetResult }) {
  const s = SIG[asset.signal];
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-xl p-3 cursor-pointer transition-all ${s.bg}`}
      onClick={() => !asset.error && setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${s.text} ${s.bg}`}>
            {s.emoji} {s.label}
          </span>
          {asset.price && (
            <span className="text-slate-400 text-xs">
              {asset.price.toLocaleString("en-US", { maximumFractionDigits: 5 })}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-slate-200 font-bold text-sm">{asset.label}</div>
          <div className="text-slate-500 text-xs">{CATEGORY_LABEL[asset.category as keyof typeof CATEGORY_LABEL]}</div>
        </div>
      </div>

      <StrengthBar buy={asset.buyCount} sell={asset.sellCount} total={asset.totalCount} />

      {open && asset.indicators && (
        <div className="mt-3 pt-3 border-t border-[#1e1e30] space-y-1">
          {Object.entries(asset.indicators).map(([name, sig]) => {
            const c = SIG[sig];
            return (
              <div key={name} className="flex justify-between text-xs">
                <span className={c.text}>{c.emoji} {c.label}</span>
                <span className="text-slate-400">{name}</span>
              </div>
            );
          })}
        </div>
      )}

      {asset.error && (
        <div className="text-slate-600 text-xs mt-1">تعذّر جلب البيانات</div>
      )}
    </div>
  );
}

export default function ScannerPage() {
  const [interval,  setTimeframe]  = useState("1h");
  const [category,  setCategory]  = useState<Category>("all");
  const [filter,    setFilter]    = useState("all");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<ScanResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/scan?interval=${interval}&category=${category}`);
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [interval, category]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(scan, 60_000);
    return () => clearInterval(id);
  }, [autoRefresh, scan]);

  const filtered = result?.assets.filter((a) =>
    filter === "all" ? true : a.signal === filter
  ) ?? [];

  return (
    <main className="min-h-screen bg-[#0d0d14] px-4 py-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← تحليل زوج واحد
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">🔭 ماسح الأسواق</h1>
            <p className="text-slate-500 text-xs">جميع أصول Quotex دفعة واحدة</p>
          </div>
          <div className="w-20" />
        </div>

        {/* Controls */}
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl p-4 mb-4 space-y-3">
          {/* Interval */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">الإطار الزمني</label>
            <div className="grid grid-cols-6 gap-1">
              {INTERVALS.map((iv) => (
                <button key={iv} onClick={() => setTimeframe(iv)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    interval === iv
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-[#0d0d14] border-[#1e1e30] text-slate-400 hover:border-indigo-500/40"
                  }`}>
                  {iv}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">الفئة</label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    category === c.key
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-[#0d0d14] border-[#1e1e30] text-slate-400 hover:border-indigo-500/40"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={scan} disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm transition-colors">
              {loading ? "⏳ جاري المسح..." : "🔍 مسح الآن"}
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors ${
                autoRefresh
                  ? "bg-emerald-700 border-emerald-500 text-white"
                  : "bg-[#0d0d14] border-[#1e1e30] text-slate-400"
              }`}>
              {autoRefresh ? "🔄 تلقائي" : "يدوي"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-3 mb-4 text-red-300 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {result && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { v: result.summary.buy,     label: "شراء",  color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-500/30" },
                { v: result.summary.sell,    label: "بيع",   color: "text-red-400",     bg: "bg-red-950/40 border-red-500/30" },
                { v: result.summary.neutral, label: "انتظر", color: "text-yellow-400",  bg: "bg-yellow-950/40 border-yellow-500/30" },
              ].map(({ v, label, color, bg }) => (
                <div key={label} className={`border rounded-xl p-3 text-center ${bg}`}>
                  <div className={`text-2xl font-black ${color}`}>{v}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-1 mb-3">
              {FILTER_OPTIONS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    filter === f.key
                      ? "bg-slate-700 border-slate-500 text-white"
                      : "bg-[#0d0d14] border-[#1e1e30] text-slate-400 hover:text-white"
                  }`}>
                  {f.label} {f.key === "all" ? `(${result.assets.length})` : ""}
                </button>
              ))}
              <span className="mr-auto text-slate-600 text-xs self-center">
                {new Date(result.timestamp).toLocaleTimeString("ar-SA")}
              </span>
            </div>

            {/* Assets grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((a) => <AssetCard key={a.id} asset={a} />)}
            </div>

            {filtered.length === 0 && (
              <div className="text-center text-slate-500 py-10 text-sm">
                لا توجد أصول تطابق الفلتر الحالي
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-slate-700 mt-6">
          ⚠️ للأغراض التعليمية فقط — ليست نصيحة مالية
        </p>
      </div>
    </main>
  );
}
