export type SavedStock = {
    symbol: string;
    company: string;
    industry: string;
};

export type StockSnapshot = {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    marketCap: number | null;
    currency: string | null;
    quotedAt: number | null;
};

export type WatchlistRow = SavedStock & StockSnapshot;

export type PriceAlert = {
    id: string;
    symbol: string;
    company: string;
    direction: "above" | "below";
    target: number;
    currency: string;
};

export function validatePriceAlert(symbol: string, direction: string, target: number): { symbol: string; direction: "above" | "below"; target: number } {
    if (typeof symbol !== "string" || !/^[A-Za-z0-9.^:=/-]{1,40}$/.test(symbol.trim())) throw new Error("Invalid stock symbol.");
    if (direction !== "above" && direction !== "below") throw new Error("Choose above or below.");
    if (typeof target !== "number" || !Number.isFinite(target) || target <= 0 || target > 1e12) throw new Error("Enter a valid target price greater than zero.");
    return { symbol: symbol.trim().toUpperCase(), direction, target };
}

export function formatStockMoney(value: number | null, currency: string | null, compact = false) {
    if (value === null || !Number.isFinite(value)) return "—";
    const amount = new Intl.NumberFormat("en-US", {
        notation: compact ? "compact" : "standard",
        minimumFractionDigits: compact ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
    return currency ? `${currency} ${amount}` : amount;
}

export function groupWatchlist<T extends SavedStock>(stocks: T[]) {
    const groups = new Map<string, T[]>();
    for (const stock of stocks) {
        const industry = stock.industry.trim() || "Other";
        groups.set(industry, [...(groups.get(industry) ?? []), stock]);
    }
    return [...groups.entries()]
        .sort(([a], [b]) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b))
        .map(([industry, items]) => ({
            industry,
            stocks: items.sort((a, b) => a.symbol.localeCompare(b.symbol)),
        }));
}
