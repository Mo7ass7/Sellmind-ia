export type SignalType = "BUY" | "SELL" | "NEUTRAL";

export interface IndicatorValues {
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
}

export interface SignalResult {
  signal: SignalType;
  indicators: Record<string, SignalType>;
  values: IndicatorValues;
  buyCount: number;
  sellCount: number;
  totalCount: number;
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function ema(data: number[], span: number): number[] {
  const k = 2 / (span + 1);
  const out: number[] = [];
  let prev = data[0];
  for (let i = 0; i < data.length; i++) {
    const v = i === 0 ? data[i] : data[i] * k + prev * (1 - k);
    out.push(v);
    prev = v;
  }
  return out;
}

function sma(data: number[], period: number): number[] {
  const out: number[] = new Array(period - 1).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    out.push(data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
  }
  return out;
}

function stddev(data: number[], period: number): number[] {
  const out: number[] = new Array(period - 1).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    out.push(Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period));
  }
  return out;
}

function rsi(closes: number[], period = 14): number[] {
  const out = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;

  const delta = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = delta.map((d) => Math.max(d, 0));
  const losses = delta.map((d) => Math.max(-d, 0));

  let ag = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let al = losses.slice(0, period).reduce((a, b) => a + b) / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);

  for (let i = period; i < delta.length; i++) {
    ag = (ag * (period - 1) + gains[i]) / period;
    al = (al * (period - 1) + losses[i]) / period;
    out[i + 1] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const line = ema(closes, fast).map((v, i) => v - ema(closes, slow)[i]);
  const sig = ema(line, signal);
  return { line, sig, hist: line.map((v, i) => v - sig[i]) };
}

function bollinger(closes: number[], period = 20, mult = 2) {
  const m = sma(closes, period);
  const s = stddev(closes, period);
  return {
    upper: m.map((v, i) => (isNaN(v) ? NaN : v + mult * s[i])),
    lower: m.map((v, i) => (isNaN(v) ? NaN : v - mult * s[i])),
  };
}

function stochastic(highs: number[], lows: number[], closes: number[], win = 14, smooth = 3) {
  const k: number[] = closes.map((c, i) => {
    if (i < win - 1) return NaN;
    const hh = Math.max(...highs.slice(i - win + 1, i + 1));
    const ll = Math.min(...lows.slice(i - win + 1, i + 1));
    return hh === ll ? 50 : (100 * (c - ll)) / (hh - ll);
  });
  const validK = k.filter((v) => !isNaN(v));
  const d = sma(validK, smooth);
  const dPadded = new Array(k.length - d.length).fill(NaN).concat(d);
  return { k, d: dPadded };
}

// ─── Main calculation ──────────────────────────────────────────────────────────

export function calculateSignals(
  closes: number[],
  highs: number[],
  lows: number[]
): IndicatorValues {
  const last = closes.length - 1;
  const { line, sig, hist } = macd(closes);
  const { upper, lower } = bollinger(closes);
  const { k, d } = stochastic(highs, lows, closes);

  return {
    rsi: rsi(closes)[last],
    macd: line[last],
    macdSignal: sig[last],
    macdHist: hist[last],
    bbUpper: upper[last],
    bbLower: lower[last],
    ema20: ema(closes, 20)[last],
    ema50: ema(closes, 50)[last],
    stochK: k[last],
    stochD: d[last],
    close: closes[last],
  };
}

// ─── Signal logic ─────────────────────────────────────────────────────────────

const INDICATORS: Record<string, (v: IndicatorValues) => SignalType> = {
  "RSI (14)": (v) => (v.rsi < 30 ? "BUY" : v.rsi > 70 ? "SELL" : "NEUTRAL"),

  "MACD (12/26/9)": (v) =>
    v.macd > v.macdSignal && v.macdHist > 0
      ? "BUY"
      : v.macd < v.macdSignal && v.macdHist < 0
      ? "SELL"
      : "NEUTRAL",

  "Bollinger Bands": (v) =>
    v.close < v.bbLower ? "BUY" : v.close > v.bbUpper ? "SELL" : "NEUTRAL",

  "EMA (20/50)": (v) =>
    v.close > v.ema20 && v.ema20 > v.ema50
      ? "BUY"
      : v.close < v.ema20 && v.ema20 < v.ema50
      ? "SELL"
      : "NEUTRAL",

  "Stochastic (14/3)": (v) =>
    v.stochK < 20 && v.stochK > v.stochD
      ? "BUY"
      : v.stochK > 80 && v.stochK < v.stochD
      ? "SELL"
      : "NEUTRAL",
};

export function getSignals(values: IndicatorValues): SignalResult {
  const indicators: Record<string, SignalType> = {};
  for (const [name, fn] of Object.entries(INDICATORS)) {
    indicators[name] = fn(values);
  }

  const vals = Object.values(indicators);
  const buyCount = vals.filter((v) => v === "BUY").length;
  const sellCount = vals.filter((v) => v === "SELL").length;

  let signal: SignalType = "NEUTRAL";
  if (buyCount === vals.length) signal = "BUY";
  else if (sellCount === vals.length) signal = "SELL";

  return { signal, indicators, values, buyCount, sellCount, totalCount: vals.length };
}
