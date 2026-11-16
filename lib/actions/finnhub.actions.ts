"use server";

import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { getDateRange } from "@/lib/utils";

type CompanyProfile = { name?: string; exchange?: string };

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
        POPULAR_STOCK_SYMBOLS.slice(0, 3).map(async symbol => {
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
