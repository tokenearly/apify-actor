import { Actor, log } from 'apify';

const BASE_URL = 'https://tokenearly.com/api/public';
const USER_AGENT = 'tokenearly-apify-actor/0.1 (+https://tokenearly.com)';

const EXCHANGE_IDS = ['binance', 'okx', 'bybit', 'bitget', 'mexc', 'gate', 'huobi', 'kucoin', 'upbit', 'bithumb'];
// Aliases mapped to the ids the public API expects (useful when the Actor is called with an input that bypasses schema validation).
const EXCHANGE_ALIASES = { htx: 'huobi', 'gate.io': 'gate', gateio: 'gate', okex: 'okx' };

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

const normalizeExchanges = (input) => {
    if (!Array.isArray(input)) return [];
    const out = new Set();
    for (const raw of input) {
        if (typeof raw !== 'string') continue;
        const id = raw.trim().toLowerCase();
        const mapped = EXCHANGE_ALIASES[id] ?? id;
        if (EXCHANGE_IDS.includes(mapped)) out.add(mapped);
        else log.warning(`Unknown exchange id "${raw}" ignored. Valid ids: ${EXCHANGE_IDS.join(', ')}`);
    }
    return [...out];
};

const fetchJson = async (url) => {
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Request failed ${res.status} ${res.statusText} for ${url}`);
    return res.json();
};

const toIso = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
};

const mapListing = (item) => ({
    exchange: item.exchange ?? null,
    exchange_name: item.exchange_name ?? null,
    type: item.type ?? null,
    symbols: Array.isArray(item.symbols) ? item.symbols : [],
    published_at: toIso(item.published_at),
    title_en: item.title?.en ?? null,
    title_zh: item.title?.zh ?? null,
    title_ko: item.title?.ko ?? null,
    source_url: item.source_url || null,
    permalink: item.permalink ?? null,
});

await Actor.main(async () => {
    const input = (await Actor.getInput()) ?? {};

    const days = clampInt(input.days, 1, 30, 7);
    const limit = clampInt(input.limit, 1, 500, 200);
    const type = ['spot', 'futures', 'all'].includes(input.type) ? input.type : 'all';
    const exchanges = normalizeExchanges(input.exchanges);

    const params = new URLSearchParams({ days: String(days), type, limit: String(limit) });
    if (exchanges.length) params.set('exchange', exchanges.join(','));
    const listingsUrl = `${BASE_URL}/listings.json?${params.toString()}`;

    log.info('Fetching listings', { days, type, limit, exchanges: exchanges.length ? exchanges : 'all' });
    const listings = await fetchJson(listingsUrl);
    const items = Array.isArray(listings.items) ? listings.items.map(mapListing) : [];

    if (items.length) await Actor.pushData(items);
    log.info(`Pushed ${items.length} listings to the default dataset`);

    try {
        const exchangesSummary = await fetchJson(`${BASE_URL}/exchanges.json`);
        await Actor.setValue('EXCHANGES', exchangesSummary);
        log.info(`Stored exchanges summary (${exchangesSummary.exchanges_total ?? '?'} exchanges) as key-value record EXCHANGES`);
    } catch (err) {
        log.warning(`Could not fetch exchanges summary: ${err.message}`);
    }

    await Actor.setValue('OUTPUT', {
        source: 'Tokenearly',
        homepage: 'https://tokenearly.com',
        license: listings.meta?.license ?? 'https://creativecommons.org/licenses/by/4.0/',
        attribution: listings.meta?.attribution ?? 'Data by Tokenearly (https://tokenearly.com)',
        generated_at: listings.meta?.generated_at ?? new Date().toISOString(),
        window_days: days,
        type,
        exchanges: exchanges.length ? exchanges : EXCHANGE_IDS,
        count: items.length,
        request_url: listingsUrl,
    });
});
