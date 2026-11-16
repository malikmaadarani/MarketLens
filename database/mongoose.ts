import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();


declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
} 

let cached = global.mongooseCache;

if(!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI must be defined in .env');

    if (!/^mongodb(?:\+srv)?:\/\//.test(MONGODB_URI)) {
        throw new Error('Invalid MONGODB_URI in .env: use the complete connection string starting with mongodb:// or mongodb+srv://.');
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {bufferCommands: false});
    }

    try {
        cached.conn = await cached.promise;
    } 
    
    catch (err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to database ${process.env.NODE_ENV}`);

    return cached.conn;
}
