import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware for Telegram webhook
app.use(express.json());

// Serve mini app UI
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>The Ark</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #f4f4f9; }
          h1 { color: #333; }
          button { padding: 15px 25px; margin-top: 20px; font-size: 18px; border: none; background: #007bff; color: white; border-radius: 8px; }
          button:hover { background: #0056b3; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>👋 Welcome to Ark Mini App</h1>
        <p>Discover Library • Word of the Day • On Bended Knee • Bleeding Heart • Contact Us</p>
        <button onclick="alert('Entering Ark Mini App...')">🚀 Enter App</button>
      </body>
    </html>
  `);
});

// Telegram bot commands
bot.start((ctx) =>
  ctx.reply("👋 Welcome to The Ark!", {
    reply_markup: {
      keyboard: [[{ text: "🚀 Enter App", web_app: { url: process.env.WEBAPP_URL } }]],
      resize_keyboard: true,
    },
  })
);

// Start bot webhook
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
