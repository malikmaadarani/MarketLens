import { Newspaper, ArrowUpRight } from "lucide-react";
import { getWatchlistNews } from "@/lib/actions/finnhub.actions";

export default async function WatchlistNews({ symbols }: { symbols: string[] }) {
    const { articles, unavailable } = await getWatchlistNews(symbols);
    return (
        <section aria-labelledby="watchlist-news-heading" className="mt-8 overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            <div className="border-b border-gray-700 px-5 py-4">
                <h2 id="watchlist-news-heading" className="flex items-center gap-2 text-lg font-semibold text-gray-100"><Newspaper className="size-5 text-yellow-500" /> Watchlist news</h2>
                <p className="mt-1 text-xs text-gray-400">Company news for your saved stocks · Latest five days · Up to 12 articles</p>
            </div>
            {unavailable && <p role="status" className="px-5 pt-4 text-sm text-amber-400">Some company news is unavailable. Refresh the page to try again.</p>}
            {!articles.length ? (
                <p className="p-8 text-center text-sm text-gray-400">
                    {!symbols.length ? "Add stocks to your watchlist to see their company news here." : unavailable ? "News could not be loaded right now." : "No recent company news was returned for your watchlist."}
                </p>
            ) : (
                <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                    {articles.map(article => (
                        <article key={article.url} className="flex flex-col rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                            <div className="mb-3 flex flex-wrap gap-2">{article.related.split(",").map(symbol => (
                                <span key={symbol} className="rounded bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">{symbol}</span>
                            ))}</div>
                            <h3 className="font-semibold leading-snug text-gray-100"><a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 focus-visible:outline-2 focus-visible:outline-yellow-500">{article.headline}<ArrowUpRight className="ml-1 inline size-4" /><span className="sr-only"> (opens in a new tab)</span></a></h3>
                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">{article.summary}</p>
                            <div className="mt-auto flex flex-wrap justify-between gap-2 pt-4 text-xs text-gray-500">
                                <span>{article.source}</span>
                                <time dateTime={new Date(article.datetime * 1000).toISOString()}>{new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" }).format(new Date(article.datetime * 1000))}</time>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
