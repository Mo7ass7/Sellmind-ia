import pandas as pd
from typing import Dict, Tuple

SIGNAL = str  # "BUY" | "SELL" | "NEUTRAL"


def _rsi(row: pd.Series) -> SIGNAL:
    if row["RSI"] < 30:
        return "BUY"
    if row["RSI"] > 70:
        return "SELL"
    return "NEUTRAL"


def _macd(row: pd.Series) -> SIGNAL:
    # Signal confirmed by histogram direction
    if row["MACD"] > row["MACD_signal"] and row["MACD_hist"] > 0:
        return "BUY"
    if row["MACD"] < row["MACD_signal"] and row["MACD_hist"] < 0:
        return "SELL"
    return "NEUTRAL"


def _bollinger(row: pd.Series) -> SIGNAL:
    if row["Close"] < row["BB_lower"]:
        return "BUY"
    if row["Close"] > row["BB_upper"]:
        return "SELL"
    return "NEUTRAL"


def _ema(row: pd.Series) -> SIGNAL:
    if row["Close"] > row["EMA_20"] > row["EMA_50"]:
        return "BUY"
    if row["Close"] < row["EMA_20"] < row["EMA_50"]:
        return "SELL"
    return "NEUTRAL"


def _stochastic(row: pd.Series) -> SIGNAL:
    k, d = row["STOCH_K"], row["STOCH_D"]
    if k < 20 and k > d:
        return "BUY"
    if k > 80 and k < d:
        return "SELL"
    return "NEUTRAL"


INDICATORS = {
    "RSI (14)":           _rsi,
    "MACD (12/26/9)":     _macd,
    "Bollinger Bands":    _bollinger,
    "EMA (20/50)":        _ema,
    "Stochastic (14/3)":  _stochastic,
}


def analyze(df: pd.DataFrame) -> Tuple[SIGNAL, Dict[str, SIGNAL]]:
    row = df.iloc[-1]

    signals: Dict[str, SIGNAL] = {
        name: fn(row) for name, fn in INDICATORS.items()
    }

    values = list(signals.values())
    if all(v == "BUY"  for v in values):
        final = "BUY"
    elif all(v == "SELL" for v in values):
        final = "SELL"
    else:
        final = "NEUTRAL"

    return final, signals
