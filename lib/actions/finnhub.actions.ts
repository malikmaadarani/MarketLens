"use server";

import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { getDateRange } from "@/lib/utils";
import type { StockSnapshot } from "@/lib/watchlist";

type CompanyProfile = { name?: string; exchange?: string };

export async function getStockSnapshot(symbol: string): Promise<StockSnapshot> {
    if (typeof symbol !== "string" || !/^[A-Za-z0-9.^:=/-]{1,40}$/.test(symbol)) throw new Error("Invalid stock symbol.");
    const [quoteResult, profileResult] = await Promise.allSettled([
        requestFinnhub<{ c?: number; d?: number; dp?: number; t?: number }>("quote", { symbol }, 60),
        requestFinnhub<{ marketCapitalization?: number; currency?: string }>("stock/profile2", { symbol }, 3600),
    ]);
    const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null;
    const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
    const numberOrNull = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
    const price = numberOrNull(quote?.c);
    const hasQuote = price !== null && price > 0 && !!quote?.t;
    const cap = numberOrNull(profile?.marketCapitalization);
    return {
        price: hasQuote ? price : null,
        change: hasQuote ? numberOrNull(quote?.d) : null,
        changePercent: hasQuote ? numberOrNull(quote?.dp) : null,
        marketCap: cap !== null && cap > 0 ? cap * 1_000_000 : null,
        currency: typeof profile?.currency === "string" && /^[A-Z]{3}$/.test(profile.currency) ? profile.currency : null,
        quotedAt: hasQuote ? numberOrNull(quote?.t) : null,
    };
}

async function requestFinnhub<T>(path: string, params: Record<string, string>, ttl: number): Promise<T> {
    const token = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) throw new Error("Stock data is not configured.");
    const url = new URL(`https://finnhub.io/api/v1/${path}`);
    url.search = new URLSearchParams(params).toString();
    const response = await fetch(url, {
        headers: { "X-Finnhub-Token": token },
        next: { revalidate: ttl },
        signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("The stock data service is unavailable.");
    return response.json() as Promise<T>;
}

async function loadPreview(): Promise<StockWithWatchlistStatus[]> {
    const profiles = await Promise.allSettled(
        POPULAR_STOCK_SYMBOLS.slice(0, 5).map(async symbol => {
            const profile = await requestFinnhub<CompanyProfile>("stock/profile2", { symbol }, 3600);
            if (!profile.name?.trim()) return null;
            return { symbol, name: profile.name.trim(), exchange: profile.exchange || "Exchange unavailable", type: "Stock", isInWatchlist: false };
        }),
    );
    return profiles.flatMap(result => result.status === "fulfilled" && result.value ? [result.value] : []);
}

export async function searchStocks(query = ""): Promise<StockWithWatchlistStatus[]> {
    if (typeof query !== "string" || query.length > 100) throw new Error("Enter a company name or ticker under 100 characters.");
    const term = query.trim();
    if (!term) return loadPreview();
    const data = await requestFinnhub<FinnhubSearchResponse>("search", { q: term }, 300);
    if (!Array.isArray(data.result)) throw new Error("Stock search returned an unexpected response.");
    const unique = new Map<string, StockWithWatchlistStatus>();
    for (const match of data.result) {
        const symbol = match.symbol?.trim().toUpperCase();
        if (!symbol || unique.has(symbol)) continue;
        unique.set(symbol, { symbol, name: match.description?.trim() || symbol, exchange: "", type: match.type || "Stock", isInWatchlist: false });
    }
    const ticker = term.toUpperCase();
    const rank = (stock: StockWithWatchlistStatus) => stock.symbol === ticker ? 0 : stock.symbol.startsWith(ticker) ? 1 : 2;
    return [...unique.values()].sort((a, b) => rank(a) - rank(b) || a.symbol.localeCompare(b.symbol)).slice(0, 15);
}

function prepareNews(articles: RawNewsArticle[], symbol?: string): MarketNewsArticle[] {
    return articles.flatMap(article => {
        if (!article.headline?.trim() || !article.summary?.trim() || !article.url || !article.datetime) return [];
        return [{
            id: article.id,
            headline: article.headline.trim(),
            summary: article.summary.trim().slice(0, 200),
            source: article.source || "Market news",
            url: article.url,
            datetime: article.datetime,
            category: symbol ? "company" : article.category || "general",
            related: symbol || article.related || "",
            image: article.image || "",
        }];
    }).sort((a, b) => b.datetime - a.datetime);
}

export async function getWatchlistNews(symbols: string[]): Promise<{ articles: MarketNewsArticle[]; unavailable: boolean }> {
    const tickers = [...new Set(symbols.filter(symbol => typeof symbol === "string")
        .map(symbol => symbol.trim().toUpperCase())
        .filter(symbol => /^[A-Z0-9.^:=/-]{1,40}$/.test(symbol)))];
    const range = getDateRange(5);
    const articlesByUrl = new Map<string, MarketNewsArticle>();
    let unavailable = false;
    for (let index = 0; index < tickers.length; index += 4) {
        const results = await Promise.allSettled(tickers.slice(index, index + 4).map(async symbol => {
            const data = await requestFinnhub<RawNewsArticle[]>("company-news", { symbol, ...range }, 300);
            if (!Array.isArray(data)) throw new Error("Invalid news response.");
            return prepareNews(data, symbol);
        }));
        for (const result of results) {
            if (result.status === "rejected") { unavailable = true; continue; }
            for (const article of result.value) {
                try {
                    const url = new URL(article.url);
                    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
                } catch { continue; }
                const previous = articlesByUrl.get(article.url);
                if (previous) {
                    previous.related = [...new Set([...previous.related.split(","), article.related])].join(",");
                } else articlesByUrl.set(article.url, { ...article });
            }
        }
    }
    return { articles: [...articlesByUrl.values()].sort((a, b) => b.datetime - a.datetime).slice(0, 12), unavailable };
}

export async function getNews(symbols: string[] = []): Promise<MarketNewsArticle[]> {
    const tickers = [...new Set(symbols.filter(symbol => typeof symbol === "string")
        .map(symbol => symbol.trim().toUpperCase()).filter(Boolean))].slice(0, 6);
    const range = getDateRange(5);
    const feeds = await Promise.allSettled(tickers.map(async symbol => {
        const articles = await requestFinnhub<RawNewsArticle[]>("company-news", { symbol, ...range }, 300);
        return prepareNews(articles, symbol);
    }));
    const queues = feeds.flatMap(feed => feed.status === "fulfilled" ? [feed.value] : []);
    const selected = new Map<string, MarketNewsArticle>();
    const maxDepth = Math.max(0, ...queues.map(queue => queue.length));
    for (let index = 0; index < maxDepth && selected.size < 6; index++) {
        for (const queue of queues) {
            const article = queue[index];
            if (article && !selected.has(article.url)) selected.set(article.url, article);
            if (selected.size === 6) break;
        }
    }
    if (!selected.size) {
        const articles = await requestFinnhub<RawNewsArticle[]>("news", { category: "general" }, 300);
        for (const article of prepareNews(articles)) {
            if (!selected.has(article.url)) selected.set(article.url, article);
            if (selected.size === 6) break;
        }
    }
    return [...selected.values()].sort((a, b) => b.datetime - a.datetime);
}
