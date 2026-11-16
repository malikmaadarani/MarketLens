export type SavedStock = {
    symbol: string;
    company: string;
    industry: string;
};

export function groupWatchlist(stocks: SavedStock[]) {
    const groups = new Map<string, SavedStock[]>();
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
