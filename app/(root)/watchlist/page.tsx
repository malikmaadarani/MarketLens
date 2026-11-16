import WatchlistDashboard from "@/components/WatchlistDashboard";
import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { getPriceAlerts } from "@/lib/actions/alert.actions";
import { getStockSnapshot } from "@/lib/actions/finnhub.actions";
import type { WatchlistRow } from "@/lib/watchlist";
import { Suspense } from "react";
import WatchlistNews from "@/components/WatchlistNews";

export default async function WatchlistPage() {
    const [stocks, alerts] = await Promise.all([getWatchlist(), getPriceAlerts()]);
    const rows: WatchlistRow[] = [];
    for (let index = 0; index < stocks.length; index += 4) {
        const batch = await Promise.all(stocks.slice(index, index + 4).map(async stock => ({
            ...stock,
            ...await getStockSnapshot(stock.symbol),
        })));
        rows.push(...batch);
    }
    return (
        <>
            <WatchlistDashboard stocks={rows} alerts={alerts} />
            <Suspense fallback={<p role="status" className="mt-8 rounded-xl border border-gray-700 p-6 text-gray-400">Loading watchlist news...</p>}>
                <WatchlistNews symbols={stocks.map(stock => stock.symbol)} />
            </Suspense>
        </>
    );
}
