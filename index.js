import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(express.json());

// 🏠 Home Page
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
        <p>Select a section:</p>
        <button onclick="location.href='/library'">📚 Library</button>
        <button onclick="location.href='/word'">📝 Word of the Day</button>
        <button onclick="location.href='/knee'">🙏 On Bended Knee</button>
        <button onclick="location.href='/heart'">💔 Bleeding Heart</button>
        <button onclick="location.href='/contact'">📩 Contact Us</button>
      </body>
    </html>
  `);
});

// 📚 Library page
app.get("/library", (req, res) => {
  res.send(`
    <html><body style="font-family: Arial; text-align: center; padding: 50px;">
      <h1>📚 Library</h1>
      <p>Here you will find articles, books, and resources.</p>
      <button onclick="location.href='/'">⬅ Back</button>
    </body></html>
  `);
});

// 📝 Word of the Day
app.get("/word", (req, res) => {
  res.send(`
    <html><body style="font-family: Arial; text-align: center; padding: 50px;">
      <h1>📝 Word of the Day</h1>
      <p>Today's word: <b>Faith</b> - Complete trust in something greater.</p>
      <button onclick="location.href='/'">⬅ Back</button>
    </body></html>
  `);
});

// 🙏 On Bended Knee
app.get("/knee", (req, res) => {
  res.send(`
    <html><body style="font-family: Arial; text-align: center; padding: 50px;">
      <h1>🙏 On Bended Knee</h1>
      <p>A section for prayers and devotion.</p>
      <button onclick="location.href='/'">⬅ Back</button>
    </body></html>
  `);
});

// 💔 Bleeding Heart
app.get("/heart", (req, res) => {
  res.send(`
    <html><body style="font-family: Arial; text-align: center; padding: 50px;">
      <h1>💔 Bleeding Heart</h1>
      <p>Stories and reflections of life’s struggles.</p>
      <button onclick="location.href='/'">⬅ Back</button>
    </body></html>
  `);
});

// 📩 Contact Us
app.get("/contact", (req, res) => {
  res.send(`
    <html><body style="font-family: Arial; text-align: center; padding: 50px;">
      <h1>📩 Contact Us</h1>
      <p>Email: support@arkminiapp.com</p>
      <button onclick="location.href='/'">⬅ Back</button>
    </body></html>
  `);
});

// 🎯 Telegram bot entry
bot.start((ctx) =>
  ctx.reply("👋 Welcome to The Ark!", {
    reply_markup: {
      keyboard: [[{ text: "🚀 Enter App", web_app: { url: process.env.WEBAPP_URL } }]],
      resize_keyboard: true,
    },
  })
);

app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
