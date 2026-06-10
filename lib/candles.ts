export type Direction = "UP" | "DOWN" | "NEUTRAL";

export interface CandlePattern {
  name: string;
  nameAr: string;
  direction: Direction;
  strength: 1 | 2 | 3; // 1=ضعيف 2=متوسط 3=قوي
  emoji: string;
}

export interface CandleAnalysis {
  patterns: CandlePattern[];
  prediction: Direction;
  confidence: number; // 0-100
  label: string;
  upCount: number;
  downCount: number;
}

interface C { open: number; high: number; low: number; close: number }

// ── Helpers ──────────────────────────────────────────────────────────────────
const body   = (c: C) => Math.abs(c.close - c.open);
const rng    = (c: C) => c.high - c.low || 1e-9;
const upper  = (c: C) => c.high - Math.max(c.open, c.close);
const lower  = (c: C) => Math.min(c.open, c.close) - c.low;
const bull   = (c: C) => c.close >= c.open;
const bear   = (c: C) => c.close <  c.open;
const bPct   = (c: C) => body(c) / rng(c);   // body as % of range
const isDoji = (c: C) => bPct(c) < 0.1;

function trend(cs: C[], n: number): "up" | "down" | "side" {
  if (cs.length < n) return "side";
  const sl = cs.slice(-n);
  let up = 0, dn = 0;
  for (let i = 1; i < sl.length; i++) {
    if (sl[i].close > sl[i - 1].close) up++;
    else if (sl[i].close < sl[i - 1].close) dn++;
  }
  if (up > dn && up >= n - 1) return "up";
  if (dn > up && dn >= n - 1) return "down";
  return "side";
}

// ── Pattern detectors ────────────────────────────────────────────────────────

function* detect(cs: C[]): Generator<CandlePattern> {
  const n  = cs.length;
  if (n < 1) return;
  const c  = cs[n - 1];
  const p1 = n >= 2 ? cs[n - 2] : null;
  const p2 = n >= 3 ? cs[n - 3] : null;
  const tr = trend(cs.slice(0, -1), 4);

  // ── Single candle ──────────────────────────────────────────────────────────

  // Doji
  if (isDoji(c) && upper(c) > 0 && lower(c) > 0)
    yield { name: "Doji", nameAr: "دوجي", direction: "NEUTRAL", strength: 1, emoji: "➕" };

  // Dragonfly Doji (long lower, no upper) — bullish after downtrend
  if (isDoji(c) && lower(c) > 2 * upper(c) && lower(c) / rng(c) > 0.6)
    yield { name: "Dragonfly Doji", nameAr: "دوجي اليعسوب", direction: "UP", strength: 2, emoji: "🟢" };

  // Gravestone Doji (long upper, no lower) — bearish after uptrend
  if (isDoji(c) && upper(c) > 2 * lower(c) && upper(c) / rng(c) > 0.6)
    yield { name: "Gravestone Doji", nameAr: "دوجي شاهد القبر", direction: "DOWN", strength: 2, emoji: "🔴" };

  // Hammer — small body top, long lower shadow, after downtrend
  if (tr === "down" && bull(c) && lower(c) >= 2 * body(c) && upper(c) <= body(c) * 0.5 && bPct(c) < 0.4)
    yield { name: "Hammer", nameAr: "المطرقة", direction: "UP", strength: 2, emoji: "🔨" };

  // Hanging Man — same shape but after uptrend → bearish
  if (tr === "up" && bear(c) && lower(c) >= 2 * body(c) && upper(c) <= body(c) * 0.5 && bPct(c) < 0.4)
    yield { name: "Hanging Man", nameAr: "الرجل المشنوق", direction: "DOWN", strength: 2, emoji: "🪝" };

  // Inverted Hammer — after downtrend, long upper shadow
  if (tr === "down" && upper(c) >= 2 * body(c) && lower(c) <= body(c) * 0.5 && bPct(c) < 0.4)
    yield { name: "Inverted Hammer", nameAr: "مطرقة مقلوبة", direction: "UP", strength: 1, emoji: "🔻" };

  // Shooting Star — after uptrend, long upper shadow
  if (tr === "up" && bear(c) && upper(c) >= 2 * body(c) && lower(c) <= body(c) * 0.5 && bPct(c) < 0.4)
    yield { name: "Shooting Star", nameAr: "نجمة الرماية", direction: "DOWN", strength: 2, emoji: "💫" };

  // Bullish Marubozu — big bull body, almost no shadows
  if (bull(c) && bPct(c) > 0.85 && upper(c) / rng(c) < 0.05 && lower(c) / rng(c) < 0.05)
    yield { name: "Bullish Marubozu", nameAr: "ماروبوزو صعودي", direction: "UP", strength: 2, emoji: "🟩" };

  // Bearish Marubozu
  if (bear(c) && bPct(c) > 0.85 && upper(c) / rng(c) < 0.05 && lower(c) / rng(c) < 0.05)
    yield { name: "Bearish Marubozu", nameAr: "ماروبوزو هبوطي", direction: "DOWN", strength: 2, emoji: "🟥" };

  // Spinning Top — small body, shadows on both sides
  if (bPct(c) < 0.35 && upper(c) > body(c) * 0.5 && lower(c) > body(c) * 0.5)
    yield { name: "Spinning Top", nameAr: "قمة دوارة", direction: "NEUTRAL", strength: 1, emoji: "🌀" };

  if (!p1) return;

  // ── Two candle ─────────────────────────────────────────────────────────────

  // Bullish Engulfing
  if (bear(p1) && bull(c) && c.open < p1.close && c.close > p1.open && body(c) > body(p1))
    yield { name: "Bullish Engulfing", nameAr: "ابتلاع صعودي", direction: "UP", strength: 3, emoji: "🔥" };

  // Bearish Engulfing
  if (bull(p1) && bear(c) && c.open > p1.close && c.close < p1.open && body(c) > body(p1))
    yield { name: "Bearish Engulfing", nameAr: "ابتلاع هبوطي", direction: "DOWN", strength: 3, emoji: "❄️" };

  // Piercing Line — after downtrend, bullish closes > 50% into bearish p1
  if (tr === "down" && bear(p1) && bull(c) && c.open < p1.low
      && c.close > (p1.open + p1.close) / 2 && c.close < p1.open)
    yield { name: "Piercing Line", nameAr: "خط الثقب", direction: "UP", strength: 2, emoji: "💡" };

  // Dark Cloud Cover — after uptrend, bearish closes < 50% into bullish p1
  if (tr === "up" && bull(p1) && bear(c) && c.open > p1.high
      && c.close < (p1.open + p1.close) / 2 && c.close > p1.open)
    yield { name: "Dark Cloud Cover", nameAr: "الغيمة الداكنة", direction: "DOWN", strength: 2, emoji: "🌩️" };

  // Tweezer Bottom — two candles with similar lows, after downtrend
  if (tr === "down" && Math.abs(c.low - p1.low) / rng(c) < 0.02 && bull(c) && bear(p1))
    yield { name: "Tweezer Bottom", nameAr: "قاع الملقط", direction: "UP", strength: 2, emoji: "📌" };

  // Tweezer Top
  if (tr === "up" && Math.abs(c.high - p1.high) / rng(c) < 0.02 && bear(c) && bull(p1))
    yield { name: "Tweezer Top", nameAr: "قمة الملقط", direction: "DOWN", strength: 2, emoji: "📌" };

  // Bullish Harami — small bull inside large bear
  if (bear(p1) && bull(c) && c.open > p1.close && c.close < p1.open && body(c) < body(p1) * 0.5)
    yield { name: "Bullish Harami", nameAr: "حرامي صعودي", direction: "UP", strength: 1, emoji: "🤰" };

  // Bearish Harami — small bear inside large bull
  if (bull(p1) && bear(c) && c.open < p1.close && c.close > p1.open && body(c) < body(p1) * 0.5)
    yield { name: "Bearish Harami", nameAr: "حرامي هبوطي", direction: "DOWN", strength: 1, emoji: "🤰" };

  if (!p2) return;

  // ── Three candle ───────────────────────────────────────────────────────────

  // Morning Star
  if (bear(p2) && body(p1) < body(p2) * 0.5 && bull(c) && c.close > (p2.open + p2.close) / 2)
    yield { name: "Morning Star", nameAr: "نجمة الصباح", direction: "UP", strength: 3, emoji: "🌅" };

  // Evening Star
  if (bull(p2) && body(p1) < body(p2) * 0.5 && bear(c) && c.close < (p2.open + p2.close) / 2)
    yield { name: "Evening Star", nameAr: "نجمة المساء", direction: "DOWN", strength: 3, emoji: "🌇" };

  // Morning Doji Star
  if (bear(p2) && isDoji(p1) && bull(c) && c.close > p2.open)
    yield { name: "Morning Doji Star", nameAr: "نجمة دوجي الصباح", direction: "UP", strength: 3, emoji: "🌤️" };

  // Evening Doji Star
  if (bull(p2) && isDoji(p1) && bear(c) && c.close < p2.open)
    yield { name: "Evening Doji Star", nameAr: "نجمة دوجي المساء", direction: "DOWN", strength: 3, emoji: "🌥️" };

  // Three White Soldiers
  if (bull(c) && bull(p1) && bull(p2)
      && c.close > p1.close && p1.close > p2.close
      && c.open > p1.open && p1.open > p2.open
      && bPct(c) > 0.6 && bPct(p1) > 0.6 && bPct(p2) > 0.6)
    yield { name: "Three White Soldiers", nameAr: "الجنود البيض الثلاثة", direction: "UP", strength: 3, emoji: "⬆️" };

  // Three Black Crows
  if (bear(c) && bear(p1) && bear(p2)
      && c.close < p1.close && p1.close < p2.close
      && c.open < p1.open && p1.open < p2.open
      && bPct(c) > 0.6 && bPct(p1) > 0.6 && bPct(p2) > 0.6)
    yield { name: "Three Black Crows", nameAr: "الغربان السوداء الثلاثة", direction: "DOWN", strength: 3, emoji: "⬇️" };

  // Three Inside Up
  if (bear(p2) && bull(p1) && p1.open > p2.close && p1.close < p2.open && bull(c) && c.close > p2.open)
    yield { name: "Three Inside Up", nameAr: "ثلاثة داخلية صاعدة", direction: "UP", strength: 2, emoji: "📈" };

  // Three Inside Down
  if (bull(p2) && bear(p1) && p1.open < p2.close && p1.close > p2.open && bear(c) && c.close < p2.open)
    yield { name: "Three Inside Down", nameAr: "ثلاثة داخلية هابطة", direction: "DOWN", strength: 2, emoji: "📉" };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyzeCandlePatterns(
  opens: number[], highs: number[], lows: number[], closes: number[]
): CandleAnalysis {
  const n = Math.min(opens.length, highs.length, lows.length, closes.length);
  if (n < 3) {
    return { patterns: [], prediction: "NEUTRAL", confidence: 0,
             label: "بيانات غير كافية", upCount: 0, downCount: 0 };
  }

  const candles: C[] = Array.from({ length: n }, (_, i) => ({
    open: opens[i], high: highs[i], low: lows[i], close: closes[i],
  }));

  const patterns = [...detect(candles.slice(-10))];

  let upScore = 0, downScore = 0;
  let upCount = 0, downCount = 0;

  for (const p of patterns) {
    if (p.direction === "UP")   { upScore   += p.strength; upCount++;   }
    if (p.direction === "DOWN") { downScore += p.strength; downCount++; }
  }

  const total = upScore + downScore || 1;
  let prediction: Direction = "NEUTRAL";
  let confidence = 0;

  if (upScore > downScore) {
    prediction = "UP";
    confidence = Math.round((upScore / total) * 100);
  } else if (downScore > upScore) {
    prediction = "DOWN";
    confidence = Math.round((downScore / total) * 100);
  } else if (patterns.length > 0) {
    confidence = 50;
  }

  const labels: Record<Direction, string> = {
    UP:      "🟢 إغلاق أخضر (صعود)",
    DOWN:    "🔴 إغلاق أحمر (هبوط)",
    NEUTRAL: "⚪ غير محدد",
  };

  return { patterns, prediction, confidence, label: labels[prediction], upCount, downCount };
}
