"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { CommandDialog, CommandInput, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import WatchlistStockButton from "@/components/WatchlistStockButton";
import { searchStocks } from "@/lib/actions/finnhub.actions";

type SearchProps = {
    initialStocks: StockWithWatchlistStatus[];
    renderAs?: "button" | "text";
    label?: string;
    hideTrigger?: boolean;
};

type SearchResult = { query: string; stocks: StockWithWatchlistStatus[]; failed: boolean };

export default function SearchCommand({ initialStocks, renderAs = "button", label = "Add stock", hideTrigger = false }: SearchProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [attempt, setAttempt] = useState(0);
    const query = searchTerm.trim();
    const loading = !!query && result?.query !== query;
    const failed = !!query && result?.query === query && result.failed;
    const stocks = query ? result?.query === query ? result.stocks : [] : initialStocks.slice(0, 5);

    useEffect(() => {
        const onShortcut = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.repeat) {
                event.preventDefault();
                setOpen(value => !value);
            }
        };
        const onSearch = () => setOpen(true);
        window.addEventListener("keydown", onShortcut);
        document.addEventListener("open-stock-search", onSearch);
        return () => {
            window.removeEventListener("keydown", onShortcut);
            document.removeEventListener("open-stock-search", onSearch);
        };
    }, []);

    useEffect(() => {
        if (!open || !query) return;
        let active = true;
        const timer = setTimeout(async () => {
            try {
                const stocks = await searchStocks(query);
                if (active) setResult({ query, stocks, failed: false });
            } catch {
                if (active) setResult({ query, stocks: [], failed: true });
            }
        }, 300);
        return () => { active = false; clearTimeout(timer); };
    }, [open, query, attempt]);

    const closeSearch = () => { setOpen(false); setSearchTerm(""); setResult(null); };

    return (
        <>
            {!hideTrigger && (renderAs === "text" ? (
                <button type="button" onClick={() => setOpen(true)} className="search-text">{label}</button>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn"><Search className="size-4" />{label}</Button>
            ))}
            <CommandDialog open={open} onOpenChange={value => value ? setOpen(true) : closeSearch()}
                title="Find your next stock" description="Explore companies and build your MarketLens watchlist." className="search-dialog">
                <div className="border-b border-gray-700 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-yellow-500">MarketLens / Discover</p>
                    <p className="mt-1 text-sm text-gray-400">Find a company. Keep it on your radar.</p>
                </div>
                <CommandInput value={searchTerm} onValueChange={value => {
                    if (value.trim() !== query) setResult(null);
                    setSearchTerm(value);
                }}
                    maxLength={100} placeholder="Company name or ticker, e.g. Apple or AAPL" className="search-input" />
                <CommandList className="search-list" aria-busy={loading}>
                    {loading ? (
                        <p role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-gray-400">
                            <Loader2 className="size-4 animate-spin" />Searching companies...
                        </p>
                    ) : failed ? (
                        <div role="alert" className="space-y-3 p-6 text-center">
                            <p>Stock search is unavailable right now.</p>
                            <Button variant="outline" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Try again</Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-400">
                                <span>{query ? `Matches for “${query}”` : "Popular stocks to explore"}</span>
                                <span>{stocks.length} {stocks.length === 1 ? "company" : "companies"}</span>
                            </div>
                            {stocks.length === 0 ? (
                                <p role="status" className="px-5 py-8 text-center text-sm text-gray-400">
                                    {query ? "No matches. Try a shorter company name or its ticker." : "Preview unavailable. Search for a company above."}
                                </p>
                            ) : (
                                <ul className="space-y-2 px-3 pb-3">
                                    {stocks.map(stock => (
                                        <li key={stock.symbol} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 p-3">
                                            <Link href={`/stocks/${encodeURIComponent(stock.symbol)}`} onClick={closeSearch}
                                                className="group flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-yellow-500">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 font-bold text-yellow-500">{stock.symbol[0]}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-gray-100">{stock.name}</p>
                                                    <p className="truncate text-xs text-gray-400">{[stock.symbol, stock.exchange, stock.type].filter(Boolean).join(" · ")}</p>
                                                </div>
                                                <ArrowUpRight className="size-4 shrink-0 text-gray-500 group-hover:text-yellow-500" />
                                            </Link>
                                            <WatchlistStockButton symbol={stock.symbol} company={stock.name} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </CommandList>
                <p className="border-t border-gray-700 px-4 py-3 text-xs text-gray-500">Save with + Watchlist, or select a company to view its details.</p>
            </CommandDialog>
        </>
    );
}
