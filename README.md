# Rice & Flower — Social Studio

A social-content storyboard tool for [Rice & Flower](https://www.riceandflower.com/), the NYC Korean buttercream cake studio. You give it an idea, it asks two or three clarifying questions in the studio's atelier voice, then composes a frame-by-frame storyboard for Reel, Story, or Post.

## Stack

- Single-file vanilla HTML / CSS / JS (`index.html`)
- One Vercel serverless function (`api/chat.js`) that proxies to the Anthropic API
- Model: `claude-opus-4-7`

## Local development

```bash
npm install
echo "CLAUDE_API_KEY=sk-ant-..." > .env.local
npx vercel dev
```

Then open the local URL Vercel prints.

## Deploy

```bash
npx vercel --prod
```

Set `CLAUDE_API_KEY` in the Vercel project's environment variables before the first deploy.

## File map

- `index.html` — single-page UI: format picker, chat, storyboard render
- `api/chat.js` — Anthropic proxy. Two modes: `clarify` (plain prose questions) and `storyboard` (JSON in a fenced block)
- `build.md` — original spec
