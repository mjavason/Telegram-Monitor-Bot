import 'express-async-errors';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { Bot, Context } from 'grammy';
import { setupSwagger } from './swagger.config';
import { pingSelf } from './functions';

//#region App Setup
const app = express();

dotenv.config({
  path: './.env',
});
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'xxxx';
const bot = new Bot(TELEGRAM_BOT_TOKEN);
let owner: Context;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(cors());
app.use(morgan('dev'));
setupSwagger(app, BASE_URL);

//#endregion App Setup

//#region Code here
function telegramWelcomeCommand(bot: Bot) {
  bot.command('start', (ctx) => {
    console.log(ctx.from);

    const message = `Monitor Bot is Live!`;
    ctx.reply(message);

    if (!owner) owner = ctx;
  });
}

async function startBot() {
  console.log('Telegram game bot started!');
  telegramWelcomeCommand(bot);
  bot.start();
  setInterval(() => sendMessage(`Proof of life [${Date.now()}]`), 1000 * 60 * 60 * 2); //Proof of life every 2 hours
}

async function sendMessage(message: string) {
  console.log(message);
  if (owner) owner.reply(message);
}

/**
 * @swagger
 * /report/{appName}:
 *   post:
 *     summary: Submit application data
 *     description: Accepts application name as a parameter and arbitrary JSON data in the body. Returns the input as a JSON string.
 *     parameters:
 *       - in: path
 *         name: appName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Arbitrary JSON payload
 *     responses:
 *       200:
 *         description: Returns the received parameters and body as a JSON string.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request, invalid input.
 */
app.post('/report/:appName', (req: Request, res: Response) => {
  const { appName } = req.params;
  const body = req.body;

  if (!appName) {
    return res.status(400).json({ error: 'Application name is required' });
  }

  const response = {
    appName,
    body,
  };

  sendMessage(JSON.stringify(response));
  return res.send({ success: true, report: JSON.stringify(response) });
});
//#endregion

//#region Server Setup

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Call a demo external API (httpbin.org)
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/api', async (req: Request, res: Response) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({
      error: 'Failed to call external API',
    });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health check
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/', (req: Request, res: Response) => {
  return res.send({
    message: 'API is Live!',
  });
});

/**
 * @swagger
 * /obviously/this/route/cant/exist:
 *   get:
 *     summary: API 404 Response
 *     description: Returns a non-crashing result when you try to run a route that doesn't exist
 *     tags: [Default]
 *     responses:
 *       '404':
 *         description: Route not found
 */
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'API route does not exist',
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');
  console.log(`${'\x1b[31m'}`); // start color red
  console.log(`${err.message}`);
  console.log(`${'\x1b][0m]'}`); //stop color

  return res.status(500).send({
    success: false,
    status: 500,
    message: err.message,
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  startBot();
});

// (for render services) Keep the API awake by pinging it periodically
setInterval(() => pingSelf(BASE_URL), 600000);

//#endregion
