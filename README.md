# My AI

A simple personal AI assistant website using a root `index.html` and a secure Node.js/Express backend.

## Files

- `index.html` — website/chat interface
- `server.js` — backend and Gemini API connection
- `package.json` — Node/Express configuration
- `README.md` — setup instructions

## Render setup

Use:

- Build Command: `npm install`
- Start Command: `npm start`

The project root must contain all four files.

## Environment variables

In Render → Environment, add:

`GEMINI_API_KEY=YOUR_GEMINI_API_KEY`

Optional:

`GEMINI_MODEL=gemini-2.5-flash`

Never put the real API key inside `index.html`, `server.js`, GitHub code, or README.

## Local run

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Set `GEMINI_API_KEY` in the environment (or use a local `.env` file).
5. Run `npm start`.
6. Open `http://localhost:3000`.

## Health check

After deployment, open:

`/health`

A working server returns JSON containing:

`{"ok":true,"service":"My AI"}`

## Important

This version intentionally serves `index.html` from the project ROOT. Do not put it inside `public` unless you also change `server.js`.
