"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/betterAuth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { getStockSnapshot } from "@/lib/actions/finnhub.actions";
import { validatePriceAlert, type PriceAlert, type SavedStock } from "@/lib/watchlist";

type AlertRecord = Omit<PriceAlert, "id"> & { _id: string; userId: string; createdAt: Date };

async function alertContext() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Please sign in to manage alerts.");
    const mongoose = await connectToDatabase();
    if (!mongoose.connection.db) throw new Error("Database unavailable.");
    return { userId: session.user.id, db: mongoose.connection.db };
}

export async function getPriceAlerts(): Promise<PriceAlert[]> {
    const { userId, db } = await alertContext();
    const records = await db.collection<AlertRecord>("priceAlerts").find({ userId }).sort({ createdAt: -1 }).toArray();
    return records.map(({ _id, symbol, company, direction, target, currency }) => ({ id: _id, symbol, company, direction, target, currency }));
}

export async function createPriceAlert(symbolInput: string, directionInput: string, targetInput: number) {
    try {
        const { symbol, direction, target } = validatePriceAlert(symbolInput, directionInput, targetInput);
        const { userId, db } = await alertContext();
        const stock = await db.collection<SavedStock & { _id: string; userId: string }>("watchlist").findOne({ userId, symbol });
        if (!stock) return { success: false as const, error: "Add this stock to your watchlist first." };
        const snapshot = await getStockSnapshot(symbol);
        if (!snapshot.currency) return { success: false as const, error: "Currency data is unavailable. Please try again later." };
        await db.collection<AlertRecord>("priceAlerts").insertOne({
            _id: randomUUID(), userId, symbol, company: stock.company, direction, target,
            currency: snapshot.currency, createdAt: new Date(),
        });
        revalidatePath("/watchlist");
        return { success: true as const };
    } catch {
        return { success: false as const, error: "Could not save the alert. Check the target price and try again." };
    }
}

export async function deletePriceAlert(id: string) {
    try {
        if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid alert.");
        const { userId, db } = await alertContext();
        await db.collection<AlertRecord>("priceAlerts").deleteOne({ _id: id, userId });
        revalidatePath("/watchlist");
        return { success: true as const };
    } catch {
        return { success: false as const, error: "Could not delete the alert. Please try again." };
    }
}
