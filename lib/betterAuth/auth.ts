import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

async function createAuth() {
    const mongoose = await connectToDatabase();

    if (!mongoose) {
        throw new Error("Failed to connect to MongoDB.");
    }

    const db = mongoose.connection.db;

    if (!db) {
        throw new Error("MongoDB connection is not established.");
    }

    if (!db) {
        throw new Error("MongoDB connection is not established.");
    }

    return betterAuth({
        database: mongodbAdapter(db),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],
    });
}

type AuthInstance = Awaited<ReturnType<typeof createAuth>>;

let authInstance: AuthInstance | null = null;

export const getAuth = async () => {
    if (authInstance) return authInstance;

    authInstance = await createAuth();
    return authInstance;
};

export const auth = await getAuth();