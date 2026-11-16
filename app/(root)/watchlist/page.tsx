import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { groupWatchlist } from "@/lib/watchlist";
import WatchlistStockButton from "@/components/WatchlistStockButton";
import WatchlistSearchButton from "@/components/WatchlistSearchButton";

export default async function WatchlistPage() {
    const stocks = await getWatchlist();
    const groups = groupWatchlist(stocks);

    return (
        <section className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-100">Watchlist</h1>
                    <p className="mt-2 text-sm text-gray-400">Your saved stocks, automatically grouped by industry.</p>
                </div>
                <WatchlistSearchButton />
            </div>
            {stocks.length === 0 ? (
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-10 text-center">
                    <h2 className="text-lg font-medium text-gray-100">Your watchlist is empty</h2>
                    <p className="mt-2">Search for a company and select + Watchlist to save it.</p>
                </div>
            ) : groups.map(({ industry, stocks: items }) => (
                <section key={industry} className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
                        <h2 className="font-semibold text-gray-100">{industry}</h2>
                        <span className="text-sm">{items.length} {items.length === 1 ? "stock" : "stocks"}</span>
                    </div>
                    <ul className="divide-y divide-gray-700">
                        {items.map(stock => (
                            <li key={stock.symbol} className="flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0">
                                    <p className="font-semibold text-yellow-500">{stock.symbol}</p>
                                    <p className="truncate text-sm text-gray-300">{stock.company}</p>
                                </div>
                                <WatchlistStockButton symbol={stock.symbol} company={stock.company} remove />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </section>
    );
}
