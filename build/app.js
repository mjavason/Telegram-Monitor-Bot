"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const grammy_1 = require("grammy");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const functions_1 = require("./functions");
// Load environment variables
dotenv_1.default.config();
// Constants
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new grammy_1.Bot(TELEGRAM_BOT_TOKEN);
const queue = [];
let duplicateCount = 0;
let duplicateThreshold = 3;
let lastProcessedMessage = null;
let owner;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// Telegram Bot Setup
bot.command('start', (ctx) => {
    owner = owner || ctx;
    ctx.reply('Monitor Bot is Live!');
});
bot.start();
// Helper: Send Telegram Message
const sendMessage = (message) => {
    if (owner) {
        owner.reply(message);
        // console.log(`Message sent: ${message}`);
    }
    else {
        console.log(`No owner: ${message}`);
    }
};
// Process the queue
const startQueueProcessor = () => {
    setInterval(() => {
        if (queue.length > 0) {
            const message = queue.shift();
            if (message)
                sendMessage(message);
        }
    }, 1000); // Process one message per second
};
// Route: Handle Incoming Reports
app.post('/report/:app', (req, res) => {
    const { app } = req.params;
    const body = req.body;
    const report = JSON.stringify({ app, body });
    // Handle duplicates
    if (report !== lastProcessedMessage) {
        queue.push(report);
        lastProcessedMessage = report;
        duplicateCount = 0;
        duplicateThreshold = 3;
    }
    else {
        duplicateCount++;
        if (duplicateCount >= duplicateThreshold) {
            queue.push(`x${duplicateCount}`);
            duplicateCount = 0;
            duplicateThreshold = Math.min(duplicateThreshold * 3, 1000); // Scale threshold (capped at 1000)
        }
    }
    res.json({ success: true, report });
});
// Route: Health Check
app.get('/', (res) => res.json({ message: 'API is Live!' }));
// Global Error Handling
app.use((err, _req, res, _next) => {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
    setInterval(() => sendMessage(`Proof of life [${Date.now()}]`), 4 * 60 * 60 * 1000); // Every 4 hours
    setInterval(() => (0, functions_1.pingSelf)(BASE_URL), 600000); // Ping every 10 minutes
    startQueueProcessor();
});
