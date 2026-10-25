# Techno_A Trading — VS Code project

An educational browser-only paper-trading simulator. It starts new accounts with **$1,000,000 in virtual cash** and includes sign in/sign out, a portfolio, buy/sell orders, trader ranks, a trade journal, and demo codes.

## Included
- **Asset classes:** stocks, crypto, forex, commodities, and indices, including a practice USD/KES forex pair.
- **Candlestick chart:** synthetic OHLC candles, price labels, selectable timeframe labels, and simple educational candle-pattern hints (such as doji, hammer-like, bullish engulfing-like, bearish engulfing-like, and shooting-star-like).
- **Trading:** buy and sell fractional units in this simplified practice environment.
- **Regional currency display:** KES (Kenyan shillings) by default, with a USD option. The conversion uses a fixed illustrative rate of KSh 129.50 per USD; it is not a live exchange rate. Account balances and ranks are calculated internally in USD.
- **Accounts:** local browser demo registration/sign-in and sign-out.
- **Codes:** `randoms` adds a random virtual bonus from $10,000 to $100,000; `MasterTrader` adds $1,000,000,000 in virtual cash. Each code can be redeemed once per account.
- **Ranks:** F, D, C, B, B+, A, A+, S, Elite, Master, and Who Is This Guy? (the last begins at $1 quadrillion).

## Run in VS Code
1. Download and extract `techno_a_trading_vscode.zip`.
2. Open VS Code, choose **File → Open Folder**, and select the extracted `techno_a_trading` folder.
3. Open Extensions and install **Live Server** if you do not already have it.
4. Right-click `index.html` and choose **Open with Live Server**.

You can also open `index.html` directly in a browser, though Live Server is recommended.

## Important limitations
- This is **not a live trading platform**. All market prices, candles, and chart patterns are generated synthetically and move every 20 seconds. The timeframe selector changes the chart label; it does not retrieve true historical 1-minute/5-minute/hourly/daily candles.
- It is designed to look and behave like a beginner practice terminal, but cannot be “super identical” to a real market without real-time and historical market data, an exchange/broker integration, and more complete market mechanics (fees, spreads, order books, market hours, slippage, and order types).
- The KES/USD display rate is illustrative and fixed, not live. For accurate local-currency conversion, connect a trusted FX-rate API.
- Account names, demo passwords, balances, and session data live in localStorage on this computer/browser. This is **not secure authentication**. Do not use a real password or sensitive information.
- It does not connect to a broker and cannot place real trades, accept deposits, or withdraw money.

This project is for learning only, not financial advice.
