"use client";

import { Button } from "@/components/ui/button";

export default function WatchlistSearchButton() {
    return (
        <Button className="yellow-btn" onClick={() => document.dispatchEvent(new Event("open-stock-search"))}>
            Add stock
        </Button>
    );
}
