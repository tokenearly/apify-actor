# Tokenearly Exchange Listings

Get the newest crypto token listings from 10+ exchanges as a clean, structured dataset. No API key, no login, no scraping setup: run the Actor and every new spot or futures listing announced by **Binance, OKX, Bybit, Bitget, MEXC, Gate.io, HTX, KuCoin, Upbit and Bithumb** in your chosen time window lands in the default dataset, ready to export as JSON, CSV, Excel or XML, or to feed into a Zapier, Make, n8n or Google Sheets integration.

The data comes from [Tokenearly](https://tokenearly.com), a real-time crypto alert platform that monitors exchange listing announcements, exchange news and X (Twitter) activity. The public listing feed is available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); please keep the attribution "Data by Tokenearly (https://tokenearly.com)" when you republish the data.

## What you get

Each dataset item is one listing announcement:

| Field | Type | Description |
| --- | --- | --- |
| `exchange` | string | Exchange id: `binance`, `okx`, `bybit`, `bitget`, `mexc`, `gate`, `huobi` (HTX), `kucoin`, `upbit`, `bithumb` |
| `exchange_name` | string | Display name, e.g. `Gate.io` |
| `type` | string | `spot` or `futures` |
| `symbols` | string[] | Token symbols mentioned in the announcement, e.g. `["IOST", "STRK"]` (may be empty when the exchange did not name the token in the title) |
| `published_at` | string | Publication time of the announcement, ISO 8601 UTC |
| `title_en` | string | Announcement title in English |
| `title_zh` | string | Announcement title in Chinese |
| `title_ko` | string | Announcement title in Korean |
| `source_url` | string or null | Link to the exchange's original announcement when available |
| `permalink` | string | Permanent Tokenearly page for this announcement |

Only the title, category, timestamp and links are included. Announcement bodies are not reproduced.

### Sample output

```json
[
  {
    "exchange": "okx",
    "exchange_name": "OKX",
    "type": "futures",
    "symbols": ["IOST", "STRK"],
    "published_at": "2026-09-17T04:45:10.000Z",
    "title_en": "OKX to list IOSTUSD, STRKUSD X-Perps",
    "title_zh": "OKX将上线IOSTUSD、STRKUSD X永续合约",
    "title_ko": "OKX가 IOSTUSD, STRKUSD X-무기한 계약을 상장합니다.",
    "source_url": null,
    "permalink": "https://tokenearly.com/announcement/6aab70bc0c8c480b5a90c777.html"
  },
  {
    "exchange": "gate",
    "exchange_name": "Gate.io",
    "type": "spot",
    "symbols": ["ARGUS"],
    "published_at": "2026-09-17T03:51:09.000Z",
    "title_en": "Gate will list Argus (ARGUS) spot trading and flash exchange trading.",
    "title_zh": "Gate 将上线 Argus (ARGUS) 现货交易与闪兑交易",
    "title_ko": "Gate, Argus(ARGUS) 현물 거래 및 플래시 교환 거래 상장",
    "source_url": null,
    "permalink": "https://tokenearly.com/announcement/6aab63ae0c8c480b5a90c73a.html"
  }
]
```

The run also stores two records in the default key-value store:

- `EXCHANGES`: a summary of the 10 monitored exchanges, including 30-day listing counts split into spot and futures and a link to each exchange's announcement archive.
- `OUTPUT`: run metadata (time window, filters, item count, license and attribution).

## Input

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `days` | integer, 1 to 30 | `7` | Look-back window in days |
| `exchanges` | string[] | all 10 | Restrict to specific exchange ids: `binance`, `okx`, `bybit`, `bitget`, `mexc`, `gate`, `huobi` (HTX), `kucoin`, `upbit`, `bithumb` |
| `type` | `all`, `spot` or `futures` | `all` | Market type filter |
| `limit` | integer, 1 to 500 | `200` | Maximum number of listings, newest first |

Example input that returns only spot listings on Binance and Upbit from the last 3 days:

```json
{
  "days": 3,
  "exchanges": ["binance", "upbit"],
  "type": "spot",
  "limit": 100
}
```

## Use cases

- Build a listing calendar or "new coins this week" page without maintaining ten exchange scrapers.
- Trigger alerts from a scheduled run: schedule the Actor every few minutes and forward new items to Telegram, Discord, Slack or a webhook with an Apify integration.
- Backtest listing-driven strategies with a consistent, multilingual, timestamped record of announcements.
- Feed token discovery pipelines, research notebooks or dashboards with a single JSON or CSV export.

## How the data is collected

Tokenearly watches the official announcement channels of 10+ exchanges. Binance and Gate.io arrive over the exchanges' own WebSocket streams, with no polling interval to wait out; the other exchanges are polled at high frequency. Every announcement is classified as a spot or futures listing, the token symbols are extracted from the title, and the title is translated into English, Chinese and Korean. This Actor reads Tokenearly's public listing feed and maps it into the flat dataset format above.

If you need push notifications instead of a dataset, the same feed powers the Tokenearly Telegram channel and the alerting product, which can also filter announcements by keyword and deliver them to Telegram, Bark, PushDeer, WeCom, DingTalk, Feishu and generic webhooks.

## Other ways to use the same data

- Website: [tokenearly.com](https://tokenearly.com) and the live [listings page](https://tokenearly.com/listings)
- Python: [`pip install tokenearly`](https://pypi.org/project/tokenearly/)
- Node.js: [`npm install tokenearly`](https://www.npmjs.com/package/tokenearly)
- n8n: [Send new token listing alerts from 10 crypto exchanges to Telegram, Discord and Google Sheets](https://n8n.io/workflows/19448-send-new-token-listing-alerts-from-10-crypto-exchanges-to-telegram-discord-and-google-sheets/)
- Telegram channel: [t.me/tokenearly_channel](https://t.me/tokenearly_channel)
- Source code: [github.com/tokenearly](https://github.com/tokenearly)

## Limits and fair use

The Actor makes two HTTP requests per run to Tokenearly's public API and needs very little memory (128 MB is enough). The public feed covers the last 30 days; older announcements are available in the per-exchange archives linked from the `EXCHANGES` record.

## FAQ

**Does it need an API key?** No. The public listing feed is open and this Actor sends no credentials.

**Which languages are the titles in?** Every item carries the title in English, Chinese and Korean.

**How often should I run it?** For alerting, a schedule of a few minutes is plenty; for a daily digest, one run per day with `days: 1`.

**Can I use the data commercially?** Yes, under CC BY 4.0 with attribution to Tokenearly.
