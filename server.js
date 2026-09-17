// My AI - secure backend
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

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
      ? history.slice(-20).filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.text === "string")
      : [];

    const contents = safeHistory.map(x => ({
      role: x.role === "assistant" ? "model" : "user",
      parts: [{ text: x.text.slice(0, 12000) }]
    }));

    contents.push({ role: "user", parts: [{ text: message.slice(0, 12000) }] });

    const system =
      "You are My AI, a helpful advanced personal assistant. Answer naturally and accurately. Use the conversation context provided to understand follow-up questions.";

    const modelName = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(key)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API request failed."
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("") || "No response received.";

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
