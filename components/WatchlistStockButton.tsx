"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { Button } from "@/components/ui/button";

export default function WatchlistStockButton({ symbol, company, remove = false }: {
    symbol: string;
    company: string;
    remove?: boolean;
}) {
    const [pending, setPending] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleClick = async () => {
        setPending(true);
        setError("");
        try {
            const result = remove ? await removeFromWatchlist(symbol) : await addToWatchlist(symbol, company);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setSaved(true);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={handleClick}
                disabled={pending || (!remove && saved)}
                aria-label={`${remove ? "Remove" : "Add"} ${symbol} ${remove ? "from" : "to"} watchlist`}>
                {pending ? "Saving..." : remove ? "Remove" : saved ? "Saved" : "+ Watchlist"}
            </Button>
            {error && <p role="alert" className="mt-2 max-w-48 text-xs text-red-400">{error}</p>}
        </div>
    );
}
