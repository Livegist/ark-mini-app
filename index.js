import express from "express";
import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node.js";

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Setup DB
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { users: [] });
await db.read();

// Helper functions
async function saveUser(userId, info) {
  const existing = db.data.users.find((u) => u.id === userId);
  if (existing) {
    Object.assign(existing, info);
  } else {
    db.data.users.push({ id: userId, ...info });
  }
  await db.write();
}

function getUser(userId) {
  return db.data.users.find((u) => u.id === userId);
}

// Commands
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  await saveUser(userId, {
    name: ctx.from.first_name,
    joined: Date.now(),
  });

  ctx.reply(
    "Welcome! 🎉 Choose an option:",
    Markup.inlineKeyboard([
      [Markup.button.callback("ℹ️ My Info", "MY_INFO")],
      [Markup.button.callback("📝 Update Name", "UPDATE_NAME")],
    ])
  );
});

bot.action("MY_INFO", (ctx) => {
  const user = getUser(ctx.from.id);
  if (user) {
    ctx.reply(
      `👤 Name: ${user.name}\n📅 Joined: ${new Date(
        user.joined
      ).toLocaleString()}`
    );
  } else {
    ctx.reply("No data found for you.");
  }
});

bot.action("UPDATE_NAME", (ctx) => {
  ctx.reply("Please send me your new name ✍️");
  bot.on("text", async (msgCtx) => {
    const newName = msgCtx.message.text;
    await saveUser(msgCtx.from.id, { name: newName });
    msgCtx.reply(`✅ Name updated to: ${newName}`);
  });
});

// Express setup for Render
app.use(express.json());
app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
