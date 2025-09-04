import express from "express";
import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ----------------------------
// MongoDB setup
// ----------------------------
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectDB();

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  joined: Date,
});
const User = mongoose.model("User", userSchema);

// ----------------------------
// Library Schema
// ----------------------------
const librarySchema = new mongoose.Schema({
  title: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});
const LibraryItem = mongoose.model("LibraryItem", librarySchema);

// Example seeding function (optional)
async function seedLibrary() {
  await LibraryItem.create([
    { title: "📖 Article 1", url: "https://example.com/article1" },
    { title: "📖 Article 2", url: "https://example.com/article2" },
    { title: "📖 Article 3", url: "https://example.com/article3" },
  ]);
  console.log("✅ Library seeded");
}
// seedLibrary(); // Uncomment to run once

async function saveUser(userId, info) {
  let user = await User.findOne({ id: userId });
  if (user) {
    Object.assign(user, info);
  } else {
    user = new User({ id: userId, ...info });
  }
  await user.save();
}

async function getUser(userId) {
  return await User.findOne({ id: userId });
}

const express = require('express');
const path = require('path');
// ----------------------------
// Bot setup
// ----------------------------
const bot = new Telegraf(process.env.BOT_TOKEN);
const awaitingNameUpdate = new Set();
const awaitingLibraryLink = new Map(); // stores userId → { step, data }

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  await saveUser(userId, {
    name: ctx.from.first_name,
    joined: new Date(),
  });

bot.command("addlink", (ctx) => {
  ctx.reply("📚 Let's add a new library item!\n\nPlease send me the *Title* of the link:", { parse_mode: "Markdown" });
  awaitingLibraryLink.set(ctx.from.id, { step: "title", data: {} });
});

  ctx.reply(
    "Welcome! 🎉 Choose an option:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ℹ️ My Info", "MY_INFO")],
      [Markup.button.callback("📝 Update Name", "UPDATE_NAME")],
      [
        Markup.button.webApp(
          "🚀 Open Ark Mini App",
          process.env.WEBAPP_URL // 🔗 loads index.html
        ),
      ],
    ])
  );
});

bot.action("MY_INFO", async (ctx) => {
  const user = await getUser(ctx.from.id);
  if (user) {
    ctx.reply(`👤 Name: ${user.name}\n📅 Joined: ${user.joined.toLocaleString()}`);
  } else {
    ctx.reply("No data found for you.");
  }
});

bot.action("UPDATE_NAME", async (ctx) => {
  awaitingNameUpdate.add(ctx.from.id);
  ctx.reply("Please send me your new name ✍️");
});

bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  // ✅ Handle name updates
  if (awaitingNameUpdate.has(userId)) {
    const newName = text;
    await saveUser(userId, { name: newName });
    ctx.reply(`✅ Name updated to: ${newName}`);
    awaitingNameUpdate.delete(userId);
    return;
  }

  // ✅ Handle adding library links
  if (awaitingLibraryLink.has(userId)) {
    let state = awaitingLibraryLink.get(userId);

    if (state.step === "title") {
      state.data.title = text;
      state.step = "url";
      ctx.reply("Now send me the *URL* for this link:", { parse_mode: "Markdown" });
    } else if (state.step === "url") {
      state.data.url = text;
      // Save to DB
      try {
        await LibraryItem.create(state.data);
        ctx.reply(`✅ Added to library:\n\n*${state.data.title}*\n${state.data.url}`, { parse_mode: "Markdown" });
      } catch (err) {
        ctx.reply("❌ Failed to save link. Try again.");
        console.error(err);
      }
      awaitingLibraryLink.delete(userId);
    }
    return;
  }
});

// ----------------------------
// Express setup
// ----------------------------
const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);
const __dirname = path.resolve();

const app = express();

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Telegram webhook
app.use(express.json());
app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));

// Start server
const PORT = process.env.PORT || 3000;
// Library page (renders dynamic list)
app.get("/library", async (req, res) => {
  try {
    const items = await LibraryItem.find().sort({ createdAt: -1 });
    
    // Build HTML dynamically
    let list = items.map(
      item => `<li><a href="${item.url}" target="_blank">${item.title}</a></li>`
    ).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Ark Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; }
          .container { padding: 20px; }
          h1 { text-align: center; }
          ul { list-style: none; padding: 0; }
          li { margin: 15px 0; }
          a {
            display: block;
            padding: 15px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            text-align: center;
            font-size: 18px;
          }
          a:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📚 Ark Library</h1>
          <ul>
            ${list}
            <li><a href="/">⬅️ Back to Home</a></li>
          </ul>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error loading library.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
