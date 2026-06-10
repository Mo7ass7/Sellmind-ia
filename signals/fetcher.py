import yfinance as yf
import pandas as pd

INTERVAL_PERIOD_MAP = {
    "1m":  "7d",
    "5m":  "60d",
    "15m": "60d",
    "30m": "60d",
    "1h":  "730d",
    "4h":  "730d",
    "1d":  "5y",
}

def fetch_data(symbol: str, interval: str = "1h") -> pd.DataFrame:
    period = INTERVAL_PERIOD_MAP.get(interval, "60d")

    # yfinance uses "60m" not "1h", "90m" not "4h"
    yf_interval = {"1h": "60m", "4h": "1h"}.get(interval, interval)

    ticker = yf.Ticker(symbol)
    df = ticker.history(interval=yf_interval, period=period)

    if df.empty:
        raise ValueError(f"لم يتم العثور على بيانات للرمز: {symbol}")

    df.index = pd.to_datetime(df.index)
    return df[["Open", "High", "Low", "Close", "Volume"]]
