import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import { Bot, Context } from 'grammy';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupSwagger } from './swagger.config';
import { pingSelf } from './functions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new Bot(TELEGRAM_BOT_TOKEN);
let owner: Context;
const queue: string[] = [];
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

// Helper Function to Send Telegram Message
const sendMessage = (message: string) => {
  owner?.reply(message);
  console.log(message);
};

// Function to process the queue
function startQueueProcessor() {
  setInterval(() => {
    if (queue.length > 0) {
      const report = queue.shift(); // Remove the first item from the queue
      if (report) sendMessage(report);
    }
  }, 1000); // Process one message every second
}

// Routes
app.post('/report/:app', (req: Request, res: Response) => {
  const { app } = req.params;
  const body = req.body;

  if (!app) {
    return res.status(400).json({ error: 'Application name is required' });
  }

  const report = JSON.stringify({ app, body });

  if (report !== lastProcessedMessage) {
    queue.push(report);
    lastProcessedMessage = report;
    duplicateCount = 0;
    duplicateThreshold = 3;
  } else {
    duplicateCount++;

    if (duplicateCount >= duplicateThreshold) {
      queue.push(`dup x${duplicateCount}`);
      duplicateCount = 0;
      duplicateThreshold = Math.min(duplicateThreshold * 3, 1000); // Scale threshold (capped at 1000)
    }
  }

  // Respond with formatted JSON
  res.send({
    success: true,
    report: report,
  });
});

app.get('/', (_, res) => res.json({ message: 'API is Live!' }));

// Error Handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  setInterval(() => sendMessage(`Proof of life [${Date.now()}]`), 4 * 60 * 60 * 1000); // Every 4 hours
  setInterval(() => pingSelf(BASE_URL), 600000); // Ping every 10 minutes
  startQueueProcessor();
});
