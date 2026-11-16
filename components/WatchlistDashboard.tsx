"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WatchlistStockButton from "@/components/WatchlistStockButton";
import WatchlistSearchButton from "@/components/WatchlistSearchButton";
import { createPriceAlert, deletePriceAlert } from "@/lib/actions/alert.actions";
import { formatStockMoney, groupWatchlist, type PriceAlert, type WatchlistRow } from "@/lib/watchlist";

export default function WatchlistDashboard({ stocks, alerts }: { stocks: WatchlistRow[]; alerts: PriceAlert[] }) {
    const router = useRouter();
    const [refreshing, startRefresh] = useTransition();
    const [selected, setSelected] = useState<WatchlistRow | null>(null);
    const [direction, setDirection] = useState("above");
    const [target, setTarget] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [formError, setFormError] = useState("");
    const [panelError, setPanelError] = useState("");
    const [notice, setNotice] = useState("");
    const groups = groupWatchlist(stocks);

    const openAlert = (stock: WatchlistRow) => {
        setSelected(stock);
        setDirection("above");
        setTarget(stock.price !== null ? stock.price.toFixed(2) : "");
        setFormError("");
    };

    const saveAlert = async () => {
        if (!selected || saving) return;
        const price = Number(target);
        if (!target.trim() || !Number.isFinite(price) || price <= 0) {
            setFormError("Enter a target price greater than zero.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            const result = await createPriceAlert(selected.symbol, direction, price);
            if (!result.success) { setFormError(result.error); return; }
            setSelected(null);
            setNotice("Alert saved.");
            startRefresh(() => router.refresh());
        } catch {
            setFormError("Could not save the alert. Please try again.");
        } finally { setSaving(false); }
    };

    const removeAlert = async (id: string) => {
        setDeleting(id);
        setPanelError("");
        try {
            const result = await deletePriceAlert(id);
            if (!result.success) { setPanelError(result.error); return; }
            setNotice("Alert deleted.");
            startRefresh(() => router.refresh());
        } catch {
            setPanelError("Could not delete the alert. Please try again.");
        } finally { setDeleting(null); }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-100">Watchlist</h1>
                    <p className="mt-2 text-sm text-gray-400">{stocks.length} saved stocks · Organized by industry</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
                        <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                    <WatchlistSearchButton />
                </div>
            </div>
            <p className="text-xs text-gray-500">Market data may be delayed. Quotes are cached for up to a minute. Currency codes are shown beside values; unavailable data appears as —.</p>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-5">
                    {stocks.length === 0 && (
                        <div className="rounded-xl border border-gray-700 bg-gray-800 p-10 text-center">
                            <h2 className="text-lg font-medium text-gray-100">Your watchlist is empty</h2>
                            <p className="mt-2 text-sm">Use Add stock to find your first company.</p>
                        </div>
                    )}
                    {groups.map(group => (
                        <section key={group.industry} className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
                            <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
                                <h2 className="font-semibold text-gray-100">{group.industry}</h2>
                                <span className="text-xs text-gray-400">{group.stocks.length} stocks</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <caption className="sr-only">{group.industry} stocks and market data</caption>
                                    <thead className="bg-gray-900/40 text-xs text-gray-400">
                                        <tr>{["Company", "Symbol", "Price", "Daily change", "Market cap", "Actions"].map(title => (
                                            <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>
                                        ))}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {group.stocks.map(stock => (
                                            <tr key={stock.symbol} className="hover:bg-gray-700/20">
                                                <td className="px-4 py-4"><Link className="font-medium text-gray-100 hover:text-yellow-500" href={`/stocks/${encodeURIComponent(stock.symbol)}`}>{stock.company}</Link></td>
                                                <td className="px-4 py-4"><Link className="text-yellow-500 hover:underline" href={`/stocks/${encodeURIComponent(stock.symbol)}`}>{stock.symbol}</Link></td>
                                                <td className="whitespace-nowrap px-4 py-4 tabular-nums">
                                                    <span className="text-gray-100">{formatStockMoney(stock.price, stock.currency)}</span>
                                                    {stock.quotedAt && <span className="mt-1 block text-[10px] text-gray-500">{new Date(stock.quotedAt * 1000).toISOString().replace("T", " ").slice(0, 16)} UTC</span>}
                                                </td>
                                                <td className={`whitespace-nowrap px-4 py-4 tabular-nums ${stock.changePercent === null ? "text-gray-400" : stock.changePercent > 0 ? "text-emerald-400" : stock.changePercent < 0 ? "text-red-400" : "text-gray-300"}`}>
                                                    <span>{stock.changePercent === null ? "—" : `${stock.changePercent > 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`}</span>
                                                    <span className="mt-1 block text-xs">{stock.change !== null && stock.change > 0 ? "+" : ""}{formatStockMoney(stock.change, stock.currency)}</span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatStockMoney(stock.marketCap, stock.currency, true)}</td>
                                                <td className="px-4 py-4"><div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openAlert(stock)}><Plus className="size-3" /> Add alert</Button>
                                                    <WatchlistStockButton symbol={stock.symbol} company={stock.company} remove />
                                                </div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
                <aside aria-labelledby="alerts-heading" className="rounded-xl border border-gray-700 bg-gray-800 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
                    <div className="flex items-center justify-between border-b border-gray-700 p-5">
                        <h2 id="alerts-heading" className="flex items-center gap-2 font-semibold text-gray-100"><Bell className="size-4 text-yellow-500" /> Alerts</h2>
                        <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500">{alerts.length}</span>
                    </div>
                    <div className="space-y-4 p-4">
                        <p className="text-xs text-gray-400">Saved price targets. Automatic monitoring and notifications are not enabled.</p>
                        <p role="status" className="text-xs text-emerald-400">{notice}</p>
                        {panelError && <p role="alert" className="text-sm text-red-400">{panelError}</p>}
                        {!alerts.length && <p className="py-6 text-center text-sm text-gray-400">No alerts yet. Choose Add alert beside a stock.</p>}
                        {alerts.map(alert => (
                            <article key={alert.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div><Link className="font-semibold text-yellow-500" href={`/stocks/${encodeURIComponent(alert.symbol)}`}>{alert.symbol}</Link><p className="mt-1 text-xs text-gray-400">{alert.company}</p></div>
                                    <Button size="icon-sm" variant="ghost" disabled={deleting !== null || refreshing} onClick={() => removeAlert(alert.id)} aria-label={`Delete ${alert.symbol} alert`}><Trash2 className="size-4" /></Button>
                                </div>
                                <p className="mt-3 text-sm text-gray-100">{alert.direction === "above" ? "At or above" : "At or below"} {formatStockMoney(alert.target, alert.currency)}</p>
                            </article>
                        ))}
                    </div>
                </aside>
            </div>
            <Dialog open={selected !== null} onOpenChange={open => { if (!open && !saving) setSelected(null); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add price alert</DialogTitle><DialogDescription>{selected?.company} ({selected?.symbol}) — save a target price to your Alerts panel.</DialogDescription></DialogHeader>
                    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void saveAlert(); }}>
                        <p className="text-sm text-gray-400">Latest price: {formatStockMoney(selected?.price ?? null, selected?.currency ?? null)}</p>
                        <div className="space-y-2"><label htmlFor="alert-direction" className="text-sm">Condition</label>
                            <select id="alert-direction" className="w-full rounded-md border border-gray-600 bg-gray-900 p-2 text-gray-100" value={direction} onChange={event => setDirection(event.target.value)} disabled={saving}>
                                <option value="above">Price reaches or rises above</option><option value="below">Price reaches or falls below</option>
                            </select>
                        </div>
                        <div className="space-y-2"><label htmlFor="alert-target" className="text-sm">Target price {selected?.currency ? `(${selected.currency})` : ""}</label>
                            <Input id="alert-target" type="number" inputMode="decimal" min="0.000001" max="1000000000000" step="any" required value={target} onChange={event => setTarget(event.target.value)} disabled={saving} />
                        </div>
                        {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
                        <Button type="submit" className="yellow-btn w-full" disabled={saving}>{saving ? "Saving..." : "Save alert"}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
