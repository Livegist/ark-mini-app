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

// ----------------------------
// Bot setup
// ----------------------------
const bot = new Telegraf(process.env.BOT_TOKEN);
const awaitingNameUpdate = new Set();

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  await saveUser(userId, {
    name: ctx.from.first_name,
    joined: new Date(),
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
  if (awaitingNameUpdate.has(ctx.from.id)) {
    const newName = ctx.message.text;
    await saveUser(ctx.from.id, { name: newName });
    ctx.reply(`✅ Name updated to: ${newName}`);
    awaitingNameUpdate.delete(ctx.from.id);
  }
});

// ----------------------------
// Express setup
// ----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
