# Telegram-Monitor-Bot

Deploy once, use everywhere. A Telegram bot to monitor all your apps and send reports straight to your DM.

## Prerequisites

- **Telegram Bot**: Create a Telegram bot and obtain its token. Add it to the `.env` file as `TELEGRAM_BOT_TOKEN`.
- **Node.js and npm/yarn**: Ensure Node.js and npm (or yarn) are installed. Download them from the [official Node.js website](https://nodejs.org).

## Features

- Sends API reports directly to your Telegram DM.
- Seamlessly integrates with any application.
- Periodically provides "proof of life" updates.

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/mjavason/telegram-monitor-bot.git
   ```

2. Navigate to the project directory:

   ```bash
   cd telegram-monitor-bot
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and configure it with the following variables:

   ```env
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   PORT=5000
   BASE_URL=http://localhost:5000
   ```

## Running the Project

### Development Mode

Run the project with hot-reloading for development:

```bash
npm run dev
```

### Build for Production

Generate a production-ready build:

```bash
npm run build
```

### Start in Production Mode

Run the app using the production build:

```bash
npm run start
```

### Testing

Run the test suite to ensure functionality:

```bash
npm run test
```

## Usage

1. Start the application using one of the commands above.
2. Open your Telegram bot and send the `/start` command to set yourself as the bot owner.
3. Use the provided API endpoints to send reports.

### API Endpoints

#### POST `/report/:app`

Send a report to the bot.

- **Parameters**: `app` (required) - The name of the application.
- **Body**: JSON payload containing the report details.
- **Example**:

   ```bash
   curl -X POST http://localhost:5000/report/my-app \
     -H "Content-Type: application/json" \
     -d '{"status": "All systems operational"}'
   ```

#### GET `/`

Check if the API is live.

- **Response**:

   ```json
   {
     "message": "API is Live!"
   }
   ```

## Additional Notes

- **Periodic Updates**: The bot sends "proof of life" updates to Telegram every 4 hours.
- **Self-Ping**: The application pings itself every 10 minutes to prevent idling.
- **Configuration**: Review the `env.sample` file for guidance on setting up your `.env` file correctly.

Enjoy seamless monitoring with **Telegram-Monitor-Bot**!