// Specialized analyzer for Deriv synthetic/OTC instruments.
// These are computer-generated price series — the analysis exploits
// their algorithmic structure directly.

export type SyntheticType =
  | "boom"        // Boom 300/500/1000  — random walk with periodic UP spike
  | "crash"       // Crash 300/500/1000 — random walk with periodic DOWN spike
  | "volatility"  // V10/V25/V50/V75/V100 standard
  | "volatility1s"// 1s variants
  | "jump"        // Jump 10/25/50/75/100
  | "step"        // Step Index — fixed-step ±0.1
  | "rangebreak"; // Range Break 100/200

export interface SpikeState {
  lastSpikeIdx: number;      // array index of the last detected spike
  candlesSince: number;      // how many candles have passed since last spike
  expectedInterval: number;  // e.g. 1000 for Boom/Crash 1000
  proximity: number;         // 0–100; 100 = exactly at expected spike point
  direction: "UP" | "DOWN";  // UP for Boom, DOWN for Crash
}

export interface SyntheticResult {
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;        // 0–100
  syntheticType: SyntheticType;
  spike?: SpikeState;
  reason: string;
  pattern: string;           // human-readable description of the detected pattern
  indicators: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function sma(data: number[], period: number): number {
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function rsiShort(closes: number[], period = 7): number {
  if (closes.length <= period) return 50;
  const delta = closes.slice(1).map((c, i) => c - closes[i]);
  let ag = 0, al = 0;
  for (let i = delta.length - period; i < delta.length; i++) {
    ag += Math.max(delta[i], 0);
    al += Math.max(-delta[i], 0);
  }
  ag /= period;
  al /= period;
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function atr(highs: number[], lows: number[], closes: number[], period = 14): number {
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }
  return sma(trs, period);
}

// ─── Synthetic type detection ─────────────────────────────────────────────────

export function detectSyntheticType(derivSymbol: string): SyntheticType {
  const s = derivSymbol.toUpperCase();
  if (s.startsWith("BOOM"))    return "boom";
  if (s.startsWith("CRASH"))   return "crash";
  if (s.startsWith("1HZ"))     return "volatility1s";
  if (s.startsWith("R_"))      return "volatility";
  if (s.startsWith("JD"))      return "jump";
  if (s === "STPRIDX")         return "step";
  if (s.startsWith("RNGBR"))   return "rangebreak";
  return "volatility";
}

function extractSpikeInterval(derivSymbol: string): number {
  const m = derivSymbol.match(/(\d+)/);
  if (!m) return 500;
  const n = parseInt(m[1], 10);
  if ([300, 500, 1000].includes(n)) return n;
  return 500;
}

// ─── Spike detection for Crash/Boom ──────────────────────────────────────────
// A spike = single candle whose range is >> average ATR.

function detectLastSpike(
  highs: number[],
  lows: number[],
  closes: number[],
  direction: "UP" | "DOWN"
): number {
  const avgATR = atr(highs, lows, closes, 20);
  const threshold = avgATR * 6; // spike must be 6× the normal ATR

  // Scan from the most recent candle backwards
  for (let i = closes.length - 2; i >= 0; i--) {
    const range = highs[i] - lows[i];
    if (range < threshold) continue;

    // Directional check
    const body = closes[i] - (closes[i - 1] ?? closes[i]);
    if (direction === "UP"   && body > 0) return i;
    if (direction === "DOWN" && body < 0) return i;
  }
  return -1; // no spike found in the data window
}

// ─── Boom / Crash analyzer ────────────────────────────────────────────────────

function analyzeCrashBoom(
  opens: number[], highs: number[], lows: number[], closes: number[],
  derivSymbol: string,
  type: "boom" | "crash"
): SyntheticResult {
  const interval  = extractSpikeInterval(derivSymbol);
  const direction: "UP" | "DOWN" = type === "boom" ? "UP" : "DOWN";
  const lastSpike = detectLastSpike(highs, lows, closes, direction);
  const n         = closes.length;

  const candlesSince = lastSpike >= 0 ? n - 1 - lastSpike : n;
  const proximity    = Math.min(100, Math.round((candlesSince / interval) * 100));

  const spikeState: SpikeState = {
    lastSpikeIdx: lastSpike,
    candlesSince,
    expectedInterval: interval,
    proximity,
    direction,
  };

  // Also compute fast RSI for secondary confirmation
  const rsiVal  = rsiShort(closes, 7);
  const ema5    = ema(closes, 5);
  const ema10   = ema(closes, 10);
  const momentumUp   = ema5[n - 1] > ema10[n - 1];
  const momentumDown = ema5[n - 1] < ema10[n - 1];

  let signal:     "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let confidence  = 40;
  let reason      = "";
  let pattern     = "";

  if (type === "boom") {
    if (proximity >= 90) {
      signal = "BUY"; confidence = 92;
      reason  = `Boom spike highly imminent — ${candlesSince}/${interval} candles elapsed (${proximity}% of interval)`;
      pattern = "⚡ Pre-spike accumulation zone";
    } else if (proximity >= 75) {
      signal = "BUY"; confidence = 78;
      reason  = `Approaching Boom spike window — ${candlesSince}/${interval} (${proximity}%)`;
      pattern = "📈 Spike proximity signal";
    } else if (proximity >= 55 && rsiVal < 40) {
      signal = "BUY"; confidence = 62;
      reason  = `Mid-range proximity + RSI oversold (${rsiVal.toFixed(1)})`;
      pattern = "🔄 Early entry — dual confirmation";
    } else if (proximity < 20) {
      // Right after a spike, price will drift down — short window for a fade
      signal = "SELL"; confidence = 55;
      reason  = `Post-spike drift — ${candlesSince} candles since last Boom (${proximity}%)`;
      pattern = "📉 Post-spike downtrend phase";
    } else {
      signal = "NEUTRAL"; confidence = 45;
      reason  = `Boom ${interval}: ${candlesSince} candles since last spike`;
      pattern = "⏳ Waiting for proximity signal";
    }
  } else {
    // crash
    if (proximity >= 90) {
      signal = "SELL"; confidence = 92;
      reason  = `Crash spike highly imminent — ${candlesSince}/${interval} candles elapsed (${proximity}%)`;
      pattern = "⚡ Pre-crash accumulation zone";
    } else if (proximity >= 75) {
      signal = "SELL"; confidence = 78;
      reason  = `Approaching Crash spike window — ${candlesSince}/${interval} (${proximity}%)`;
      pattern = "📉 Crash proximity signal";
    } else if (proximity >= 55 && rsiVal > 60) {
      signal = "SELL"; confidence = 62;
      reason  = `Mid-range proximity + RSI overbought (${rsiVal.toFixed(1)})`;
      pattern = "🔄 Early entry — dual confirmation";
    } else if (proximity < 20) {
      signal = "BUY"; confidence = 55;
      reason  = `Post-crash recovery — ${candlesSince} candles since last Crash (${proximity}%)`;
      pattern = "📈 Post-crash uptrend phase";
    } else {
      signal = "NEUTRAL"; confidence = 45;
      reason  = `Crash ${interval}: ${candlesSince} candles since last spike`;
      pattern = "⏳ Waiting for proximity signal";
    }
  }

  return {
    signal, confidence, syntheticType: type, spike: spikeState, reason, pattern,
    indicators: {
      rsi7: +rsiVal.toFixed(2),
      ema5: +ema5[n - 1].toFixed(5),
      ema10: +ema10[n - 1].toFixed(5),
      candlesSince,
      proximity,
      interval,
    },
  };
}

// ─── Volatility index analyzer ────────────────────────────────────────────────
// Computer-generated random walk → use fast parameters.

function analyzeVolatility(
  opens: number[], highs: number[], lows: number[], closes: number[],
  type: "volatility" | "volatility1s"
): SyntheticResult {
  const n       = closes.length;
  const period  = type === "volatility1s" ? 5 : 7;
  const rsiVal  = rsiShort(closes, period);
  const ema5v   = ema(closes, 5);
  const ema10v  = ema(closes, 10);
  const ema20v  = ema(closes, 20);

  const momentum = ema5v[n - 1] - ema10v[n - 1];
  const trend    = ema10v[n - 1] > ema20v[n - 1] ? "UP" : "DOWN";

  let signal:    "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let confidence = 50;
  let reason     = "";
  let pattern    = "";

  if (rsiVal < 25 && trend === "UP") {
    signal = "BUY"; confidence = 76;
    reason  = `RSI(${period}) oversold (${rsiVal.toFixed(1)}) with uptrend EMA structure`;
    pattern = "🔄 Mean-reversion BUY";
  } else if (rsiVal > 75 && trend === "DOWN") {
    signal = "SELL"; confidence = 76;
    reason  = `RSI(${period}) overbought (${rsiVal.toFixed(1)}) with downtrend EMA structure`;
    pattern = "🔄 Mean-reversion SELL";
  } else if (rsiVal < 35 && momentum > 0) {
    signal = "BUY"; confidence = 63;
    reason  = `Oversold bounce — RSI ${rsiVal.toFixed(1)}, EMA5 crossing EMA10 upward`;
    pattern = "📈 Momentum shift BUY";
  } else if (rsiVal > 65 && momentum < 0) {
    signal = "SELL"; confidence = 63;
    reason  = `Overbought fade — RSI ${rsiVal.toFixed(1)}, EMA5 crossing EMA10 downward`;
    pattern = "📉 Momentum shift SELL";
  } else {
    signal = "NEUTRAL"; confidence = 45;
    reason  = `RSI(${period}): ${rsiVal.toFixed(1)} — no extreme signal`;
    pattern = "⏳ Ranging — no clear signal";
  }

  return {
    signal, confidence, syntheticType: type, reason, pattern,
    indicators: {
      [`rsi${period}`]: +rsiVal.toFixed(2),
      ema5: +ema5v[n - 1].toFixed(5),
      ema10: +ema10v[n - 1].toFixed(5),
      ema20: +ema20v[n - 1].toFixed(5),
    },
  };
}

// ─── Jump index analyzer ──────────────────────────────────────────────────────
// Like volatility but with occasional large jumps — ride the jump momentum.

function analyzeJump(
  opens: number[], highs: number[], lows: number[], closes: number[]
): SyntheticResult {
  const n      = closes.length;
  const avgATR = atr(highs, lows, closes, 14);
  const last5  = closes.slice(-5);
  const last   = closes[n - 1];
  const prev5  = closes[n - 6];

  const move5    = (last - prev5) / (prev5 || 1);
  const rsiVal   = rsiShort(closes, 7);
  const jumpUp   = last - closes[n - 2] > avgATR * 4;
  const jumpDown = closes[n - 2] - last > avgATR * 4;

  let signal:    "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let confidence = 50;
  let reason     = "";
  let pattern    = "";

  if (jumpUp) {
    signal = "BUY"; confidence = 80;
    reason  = `Large UP jump detected (${(move5 * 100).toFixed(2)}% over 5 candles) — ride momentum`;
    pattern = "⚡ Jump momentum BUY";
  } else if (jumpDown) {
    signal = "SELL"; confidence = 80;
    reason  = `Large DOWN jump detected — ${(move5 * 100).toFixed(2)}% — ride momentum`;
    pattern = "⚡ Jump momentum SELL";
  } else if (rsiVal < 30) {
    signal = "BUY"; confidence = 62;
    reason  = `RSI(7) oversold (${rsiVal.toFixed(1)}) — pre-jump BUY setup`;
    pattern = "🔄 Pre-jump oversold BUY";
  } else if (rsiVal > 70) {
    signal = "SELL"; confidence = 62;
    reason  = `RSI(7) overbought (${rsiVal.toFixed(1)}) — pre-jump SELL setup`;
    pattern = "🔄 Pre-jump overbought SELL";
  } else {
    signal = "NEUTRAL"; confidence = 48;
    reason  = "No jump detected — RSI neutral";
    pattern = "⏳ Awaiting jump signal";
  }

  return {
    signal, confidence, syntheticType: "jump", reason, pattern,
    indicators: {
      rsi7: +rsiVal.toFixed(2),
      move5pct: +(move5 * 100).toFixed(3),
      avgATR: +avgATR.toFixed(5),
    },
  };
}

// ─── Step index analyzer ──────────────────────────────────────────────────────
// Each tick moves exactly ±0.1 — pure direction counting.

function analyzeStep(
  opens: number[], highs: number[], lows: number[], closes: number[]
): SyntheticResult {
  const n       = closes.length;
  const window  = 20;
  const recent  = closes.slice(-window - 1);

  let upSteps   = 0;
  let downSteps = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) upSteps++;
    else if (recent[i] < recent[i - 1]) downSteps++;
  }

  const ratio = upSteps / (upSteps + downSteps || 1);
  const rsiVal = rsiShort(closes, 10);

  let signal:    "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
  let confidence = 50;
  let reason     = "";
  let pattern    = "";

  if (upSteps >= 14 && rsiVal < 60) {
    signal = "BUY"; confidence = 72;
    reason  = `Step up-bias: ${upSteps}/${window} up-steps (${(ratio * 100).toFixed(0)}%) + RSI ${rsiVal.toFixed(1)}`;
    pattern = "📈 Step direction dominance BUY";
  } else if (downSteps >= 14 && rsiVal > 40) {
    signal = "SELL"; confidence = 72;
    reason  = `Step down-bias: ${downSteps}/${window} down-steps (${((1 - ratio) * 100).toFixed(0)}%) + RSI ${rsiVal.toFixed(1)}`;
    pattern = "📉 Step direction dominance SELL";
  } else if (ratio > 0.62) {
    signal = "BUY"; confidence = 58;
    reason  = `Mild up-bias in last ${window} steps (${(ratio * 100).toFixed(0)}%)`;
    pattern = "📈 Weak step BUY";
  } else if (ratio < 0.38) {
    signal = "SELL"; confidence = 58;
    reason  = `Mild down-bias in last ${window} steps (${((1 - ratio) * 100).toFixed(0)}%)`;
    pattern = "📉 Weak step SELL";
  } else {
    signal = "NEUTRAL"; confidence = 44;
    reason  = `Step balanced: ${upSteps} up / ${downSteps} down`;
    pattern = "⏳ Step equilibrium";
  }

  return {
    signal, confidence, syntheticType: "step", reason, pattern,
    indicators: { upSteps, downSteps, upRatioPct: +(ratio * 100).toFixed(1), rsi10: +rsiVal.toFixed(2) },
  };
}

// ─── Range Break analyzer ────────────────────────────────────────────────────
// Moves in a range until it breaks out — treat like volatility.

function analyzeRangeBreak(
  opens: number[], highs: number[], lows: number[], closes: number[]
): SyntheticResult {
  const result = analyzeVolatility(opens, highs, lows, closes, "volatility");
  return { ...result, syntheticType: "rangebreak" };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function analyzeSynthetic(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[],
  derivSymbol: string
): SyntheticResult {
  const type = detectSyntheticType(derivSymbol);

  switch (type) {
    case "boom":         return analyzeCrashBoom(opens, highs, lows, closes, derivSymbol, "boom");
    case "crash":        return analyzeCrashBoom(opens, highs, lows, closes, derivSymbol, "crash");
    case "volatility":   return analyzeVolatility(opens, highs, lows, closes, "volatility");
    case "volatility1s": return analyzeVolatility(opens, highs, lows, closes, "volatility1s");
    case "jump":         return analyzeJump(opens, highs, lows, closes);
    case "step":         return analyzeStep(opens, highs, lows, closes);
    case "rangebreak":   return analyzeRangeBreak(opens, highs, lows, closes);
    default:             return analyzeVolatility(opens, highs, lows, closes, "volatility");
  }
}
