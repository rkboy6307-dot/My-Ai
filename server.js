// My AI - secure backend
// Node.js + Express + Gemini API

require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

// index.html is in the project root.
app.use(express.static(__dirname));

// Simple health check for Render.
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "My AI" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-20)
          .filter(
            x =>
              x &&
              (x.role === "user" || x.role === "assistant") &&
              typeof x.text === "string"
          )
      : [];

    const contents = safeHistory.map(x => ({
      role: x.role === "assistant" ? "model" : "user",
      parts: [{ text: x.text.slice(0, 12000) }]
    }));

    contents.push({
      role: "user",
      parts: [{ text: message.slice(0, 12000) }]
    });

    const system = `
You are My AI, a helpful advanced personal assistant.

The user may speak Hindi, Hinglish, or English. Reply in the language the user uses.
Be natural, accurate and practical.
Be concise unless the user asks for detail.
Use headings, bullets and examples when useful.
Use conversation context for follow-up questions.
Do not invent facts. If information may be current or uncertain, say so.
`;

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) +
      ":generateContent";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data));
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "No response received.";

    return res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
});

// Always serve the root index.html for the website home page.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`My AI running on port ${PORT}`);
});
