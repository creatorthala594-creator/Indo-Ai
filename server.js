import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const SYSTEM_PROMPT = `You are INDO AI, a helpful, friendly, capable assistant.
Reply in the language the user uses, especially natural Hindi/Hinglish when appropriate.
Help with general knowledge, explanations, study questions, mathematics, coding, creative writing,
jokes, brainstorming and everyday tasks. Be clear and useful. If uncertain, say so; never invent facts.
For current information, use web search when available and distinguish verified facts from estimates.
Explain educational problems step by step when useful. Keep answers concise unless asked for detail.`;

function requireClient(req, res, next) {
  if (!client) return res.status(503).json({ error: "Server setup incomplete. Add OPENAI_API_KEY to the .env file and restart INDO AI." });
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(client), name: "INDO AI" });
});

app.post("/api/chat", requireClient, async (req, res) => {
  try {
    const { messages, image } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please send a message." });
    }
    const recent = messages.slice(-16).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 12000)
    }));
    if (image && typeof image === "string" && image.startsWith("data:image/")) {
      const lastUser = [...recent].reverse().find(m => m.role === "user");
      if (lastUser) {
        lastUser.content = [
          { type: "input_text", text: lastUser.content || "Please describe this image." },
          { type: "input_image", image_url: image, detail: "auto" }
        ];
      }
    }
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6.2-astra",
      instructions: SYSTEM_PROMPT,
      input: recent,
      tools: [{ type: "web_search" }]
    });
    res.json({ reply: response.output_text || "I couldn't create a text reply. Please try again." });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err?.message || "Chat request failed." });
  }
});

app.post("/api/image", requireClient, async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Write an image prompt first." });
    if (prompt.length > 2000) return res.status(400).json({ error: "Prompt is too long (maximum 2,000 characters)." });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6.2-astra",
      input: `Create an image based on this user request: ${prompt}`,
      tools: [{
        type: "image_generation",
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
        action: "generate",
        size: "1024x1024",
        quality: "medium"
      }],
      tool_choice: { type: "image_generation" }
    });
    const generated = response.output?.find(item => item.type === "image_generation_call" && item.result);
    if (!generated?.result) throw new Error("The image service returned no image. Try another prompt.");
    res.json({ image: `data:image/png;base64,${generated.result}` });
  } catch (err) {
    console.error("Image error:", err);
    res.status(500).json({ error: err?.message || "Image generation failed." });
  }
});

app.listen(PORT, () => {
  console.log(`INDO AI is running at http://localhost:${PORT}`);
});
