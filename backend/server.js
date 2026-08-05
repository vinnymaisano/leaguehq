import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import {connectDB} from './config/db.js';
import { startTransactionPoller } from "./services/transaction_poller.js";
import league_router from './routers/league_router.js';
import auth_router from './routers/auth_router.js';
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
console.log("file_name:", __filename)
const __dirname = path.dirname(__filename);
console.log("dirname:", __dirname)

const app = express()
const PORT = process.env.PORT || 5000
const HOST = "0.0.0.0"

if (process.env.NODE_ENV === "development") {
    console.log("using CORS")
    app.use(cors({
        origin: "http://localhost:5173",
        credentials: true
    }))
} else {
    console.log("not using CORS")
    // frontend is served by nginx
    // app.use(express.static("/var/www/leaguehq"))
}

// middleware
app.use(cookieParser())
app.use(express.json())

// API routes
app.use("/api", league_router)
app.use("/auth", auth_router)

// nginx will serve the frontend
// if (process.env.NODE_ENV === "production") {
//     app.get(/.*/, (req, res) => {
//         res.sendFile("/var/www/leaguehq");
//     })
// }

// start the server only after DB is connected
connectDB().then(() => {
    console.log("MongoDB connected");

    // start poller
    const stopPoller = startTransactionPoller()

    // start server
    const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
        });
    // const server = app.listen(PORT, () => {
    //     console.log(`Listening on http://localhost:${PORT}`);
    // });

    // graceful shutdown
    async function shutdown() {
        console.log("Shutting down...");
        stopPoller(); // Stop background poller
        server.close(async () => {
            console.log("HTTP server closed");
            await mongoose.connection.close(false)
            console.log("MongoDB connection closed");
            process.exit(0);
        });

        // force shutdown if hanging for 10 seconds
        setTimeout(() => process.exit(1), 10000);
    }
    // on interrupt or termination, call shutdown
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

}).catch(err => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
});