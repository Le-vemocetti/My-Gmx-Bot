# GMX Trading Bot

A real-time, automated crypto trading bot using GMX price data and Chainlink-ready webhook. 

## Features

- SMA + Stochastic RSI strategy
- Fibonacci levels for trend validation
- Leverage trading simulation
- Express server for Chainlink Automation trigger
- Risk management with stop-loss and reversal logic

## Setup

```bash
git clone <repo>
cd gmx-trading-bot
npm install
cp .env.example .env
# Fill in your API keys and contract addresses
npm start
```

The bot runs on `localhost:5000` and evaluates trade signals every 60 seconds.

---

**Note:** Use responsibly and with testnets before live deployment.
