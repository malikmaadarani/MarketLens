"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/betterAuth/auth";
import { connectToDatabase } from "@/database/mongoose";
import type { SavedStock } from "@/lib/watchlist";

type WatchlistRecord = SavedStock & { _id: string; userId: string; addedAt: Date };

async function getContext() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Please sign in to use your watchlist.");
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database is unavailable.");
    return { userId: session.user.id, collection: db.collection<WatchlistRecord>("watchlist") };
}

function normalizeSymbol(value: string) {
    if (typeof value !== "string" || !/^[A-Za-z0-9.^:=/-]{1,40}$/.test(value.trim())) {
        throw new Error("Invalid stock symbol.");
    }
    return value.trim().toUpperCase();
}

export async function getWatchlist(): Promise<SavedStock[]> {
    const { userId, collection } = await getContext();
    const records = await collection.find({ userId }).sort({ symbol: 1 }).toArray();
    return records.map(({ symbol, company, industry }) => ({ symbol, company, industry: industry || "Other" }));
}

export async function addToWatchlist(symbolInput: string, companyInput: string) {
    try {
        const { userId, collection } = await getContext();
        const symbol = normalizeSymbol(symbolInput);
        if (typeof companyInput !== "string" || !companyInput.trim() || companyInput.length > 200) {
            throw new Error("Invalid company name.");
        }
        let company = companyInput.trim();
        let industry = "Other";
        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        if (token) {
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}`,
                    { headers: { "X-Finnhub-Token": token }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) },
                );
                if (response.ok) {
                    const profile = await response.json();
                    if (typeof profile.name === "string" && profile.name.trim()) company = profile.name.trim();
                    if (typeof profile.finnhubIndustry === "string" && profile.finnhubIndustry.trim()) {
                        industry = profile.finnhubIndustry.trim();
                    }
                }
            } catch {
                industry = "Other";
            }
        }
        const _id = `${userId}:${symbol}`;
        await collection.updateOne(
            { _id, userId },
            { $set: { company, industry }, $setOnInsert: { symbol, userId, addedAt: new Date() } },
            { upsert: true },
        );
        revalidatePath("/watchlist");
        revalidatePath("/stocks/[symbol]", "page");
        return { success: true as const };
    } catch {
        return { success: false as const, error: "Could not save this stock. Please sign in and try again." };
    }
}

export async function removeFromWatchlist(symbolInput: string) {
    try {
        const { userId, collection } = await getContext();
        const symbol = normalizeSymbol(symbolInput);
        await collection.deleteOne({ _id: `${userId}:${symbol}`, userId });
        revalidatePath("/watchlist");
        revalidatePath("/stocks/[symbol]", "page");
        return { success: true as const };
    } catch {
        return { success: false as const, error: "Could not remove this stock. Please try again." };
    }
}
