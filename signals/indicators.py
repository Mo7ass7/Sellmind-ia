import pandas as pd
import numpy as np


def _ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def _rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain  = delta.clip(lower=0)
    loss  = (-delta).clip(lower=0)
    avg_gain = gain.ewm(com=window - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=window - 1, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _macd(close: pd.Series, fast=12, slow=26, signal=9):
    macd_line = _ema(close, fast) - _ema(close, slow)
    signal_line = _ema(macd_line, signal)
    hist = macd_line - signal_line
    return macd_line, signal_line, hist


def _bollinger(close: pd.Series, window=20, num_std=2):
    mid   = close.rolling(window).mean()
    std   = close.rolling(window).std()
    upper = mid + num_std * std
    lower = mid - num_std * std
    return upper, lower


def _stochastic(high: pd.Series, low: pd.Series, close: pd.Series,
                window=14, smooth=3):
    lowest  = low.rolling(window).min()
    highest = high.rolling(window).max()
    k = 100 * (close - lowest) / (highest - lowest).replace(0, np.nan)
    d = k.rolling(smooth).mean()
    return k, d


def calculate(df: pd.DataFrame) -> pd.DataFrame:
    close, high, low = df["Close"], df["High"], df["Low"]

    df["RSI"] = _rsi(close)

    df["MACD"], df["MACD_signal"], df["MACD_hist"] = _macd(close)

    df["BB_upper"], df["BB_lower"] = _bollinger(close)

    df["EMA_20"] = _ema(close, 20)
    df["EMA_50"] = _ema(close, 50)

    df["STOCH_K"], df["STOCH_D"] = _stochastic(high, low, close)

    return df.dropna()
