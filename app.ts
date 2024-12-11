import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import { Bot, Context } from 'grammy';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupSwagger } from './swagger.config';
import { pingSelf } from './functions';

// Load environment variables
dotenv.config();

// Constants
const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new Bot(TELEGRAM_BOT_TOKEN);
const queue: string[] = [];
let owner: Context | undefined;
let lastProcessedMessage: string | null = null;
let duplicateCount = 0;
let duplicateThreshold = 3;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
setupSwagger(app, BASE_URL);

// Telegram Bot Setup
bot.command('start', (ctx) => {
  owner = owner || ctx;
  ctx.reply('Monitor Bot is Live!');
});
bot.start();

// Helper: Send Telegram Message
const sendMessage = (message: string) => {
  if (owner) {
    owner.reply(message);
    // console.log(`Message sent: ${message}`);
  } else {
    console.log(`No owner: ${message}`);
  }
};

// Process the queue
const startQueueProcessor = () => {
  setInterval(() => {
    if (queue.length > 0) {
      const message = queue.shift();
      if (message) sendMessage(message);
    }
  }, 1000); // Process one message per second
};

// Route: Handle Incoming Reports
app.post('/report/:app', (req: Request, res: Response) => {
  const { app } = req.params;
  const body = req.body;

  if (!app) {
    return res.status(400).json({ error: 'Application name is required' });
  }

  const report = JSON.stringify({ app, body });

  // Handle duplicates
  if (report !== lastProcessedMessage) {
    queue.push(report);
    lastProcessedMessage = report;
    duplicateCount = 0;
    duplicateThreshold = 3;
  } else {
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
app.get('/', (_, res) => res.json({ message: 'API is Live!' }));

// Global Error Handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${BASE_URL}`);
  setInterval(() => sendMessage(`Proof of life [${Date.now()}]`), 4 * 60 * 60 * 1000); // Every 4 hours
  setInterval(() => pingSelf(BASE_URL), 600000); // Ping every 10 minutes
  startQueueProcessor();
});
