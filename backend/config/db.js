import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        mongoose.set("strictQuery", true); // Optional, prevents deprecation warnings

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable
        });

        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        throw error // Let the caller handle process.exit
    }
};
