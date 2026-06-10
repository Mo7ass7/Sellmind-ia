#!/usr/bin/env python3
"""
Sellmind IA — أداة إشارات التحليل التقني
تُعطي إشارة شراء/بيع فقط عند تطابق جميع المؤشرات.
للأغراض التعليمية والبحثية فقط — ليست نصيحة مالية.
"""

import sys
import time
from datetime import datetime

from colorama import init, Fore, Style

from signals.fetcher import fetch_data, INTERVAL_PERIOD_MAP
from signals.indicators import calculate
from signals.analyzer import analyze

init(autoreset=True)

BANNER = f"""
{Fore.CYAN}{Style.BRIGHT}
 ╔══════════════════════════════════════════╗
 ║         Sellmind IA — إشارات التداول    ║
 ║   RSI | MACD | BB | EMA | Stochastic    ║
 ╚══════════════════════════════════════════╝
{Style.RESET_ALL}"""

SIGNAL_COLOR = {
    "BUY":     Fore.GREEN  + Style.BRIGHT,
    "SELL":    Fore.RED    + Style.BRIGHT,
    "NEUTRAL": Fore.YELLOW + Style.BRIGHT,
}

SIGNAL_LABEL = {
    "BUY":     "✅  شراء  (BUY)",
    "SELL":    "🔴  بيع   (SELL)",
    "NEUTRAL": "⏳  انتظر (WAIT) — المؤشرات غير متوافقة",
}


def print_result(symbol: str, interval: str, price: float,
                 final: str, signals: dict) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = "─" * 48

    print(f"\n{line}")
    print(f"  {Fore.WHITE}{symbol}  |  {interval}  |  السعر: {price:.5f}")
    print(f"  {Fore.WHITE}الوقت: {now}")
    print(line)

    for name, sig in signals.items():
        color = SIGNAL_COLOR.get(sig, "")
        print(f"  {name:<22} {color}{sig}")

    print(line)
    color = SIGNAL_COLOR.get(final, "")
    print(f"  الإشارة النهائية:  {color}{SIGNAL_LABEL[final]}")
    print(line)
    print(f"  {Fore.MAGENTA}⚠️  للأغراض التعليمية فقط — ليست نصيحة مالية.")
    print()


def get_input(prompt: str, default: str) -> str:
    value = input(f"{Fore.CYAN}{prompt}{Style.RESET_ALL}").strip()
    return value if value else default


def main() -> None:
    print(BANNER)

    valid_intervals = list(INTERVAL_PERIOD_MAP.keys())
    intervals_str   = "  |  ".join(valid_intervals)

    symbol   = get_input("رمز العملة أو الزوج (مثال: BTC-USD، EURUSD=X): ", "BTC-USD")
    interval = get_input(f"الإطار الزمني [{intervals_str}] (افتراضي: 1h): ", "1h")
    watch    = get_input("تجديد تلقائي كل X دقائق؟ (0 = مرة واحدة): ", "0")

    if interval not in valid_intervals:
        print(f"{Fore.RED}إطار زمني غير صالح. الخيارات: {intervals_str}")
        sys.exit(1)

    try:
        refresh_minutes = int(watch)
    except ValueError:
        refresh_minutes = 0

    while True:
        try:
            print(f"\n{Fore.WHITE}جاري تحليل {symbol} على إطار {interval}…")
            df      = fetch_data(symbol, interval)
            df      = calculate(df)
            final, signals = analyze(df)
            price   = df["Close"].iloc[-1]

            print_result(symbol, interval, price, final, signals)

        except Exception as exc:
            print(f"{Fore.RED}خطأ: {exc}")

        if refresh_minutes <= 0:
            break

        print(f"{Fore.WHITE}التحديث القادم خلال {refresh_minutes} دقيقة… (Ctrl+C للإيقاف)")
        try:
            time.sleep(refresh_minutes * 60)
        except KeyboardInterrupt:
            print("\nتم الإيقاف.")
            break


if __name__ == "__main__":
    main()
