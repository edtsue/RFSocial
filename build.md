# Rice & Flower — Social Media Optimizer

A premium social content tool for Rice & Flower (NYC designer flower cake studio). User inputs an idea, chats with Claude to refine it, and gets a frame-by-frame storyboard for Instagram Reels, Stories, or Posts.

---

## 1. Brand Context

**Studio**: [Rice & Flower](https://www.riceandflower.com/) — NYC-based Korean buttercream flower cake studio, founded 2017 by Seyun (Parsons-trained, fine art + lighting design background).

**Clientele**: Chanel, Gucci, NY Bridal Fashion Week, Meghan Markle. Featured in NBC, The Knot, Style Me Pretty, NY Magazine.

**Tone of voice** (use these in all generated content + UI copy):
- **Atelier, not bakery** — closer to a fine-art studio statement than a food brand
- **Refined & restrained** — "thoughtfully composed," "meticulously hand-piped," "nuanced," "elevated"
- **Sensory but precise** — "ethereal," "silky," "never overly sweet"
- **Authority through provenance** — Korean buttercream pioneer, Parsons, fine art
- **Quiet confidence, never salesy** — no urgency, no exclamation points, no emoji
- **Painterly metaphors** — "petal by petal," "form, color, and composition," "movement, rhythm, balance"
- **Em-dashes liberally** — like this — instead of commas
- **Tricolons** — "with intention, precision, and beauty"
- **Voice**: "we/our" for studio, "I/my" for Seyun teaching directly

**Avoid**: cute, casual, exclamatory, urgent, discounty, jargon-y, overly emotional, level-up bro language, trend-chasing.

---

## 2. Tech Stack

- **Framework**: Plain HTML + vanilla JS in a single file (matches Ed's GitHub Pages / Vercel deploy stack — easy to ship, no build step). Upgrade to React later if needed.
- **Styling**: Vanilla CSS with CSS custom properties. No Tailwind.
- **API**: Claude API via `fetch()` to `https://api.anthropic.com/v1/messages`
  - Model: `claude-opus-4-7` (or `claude-sonnet-4-6` for cheaper iteration)
  - API key as env var: `CLAUDE_API_KEY` — do NOT hardcode. Read via `process.env` if Node-served, or prompt user to paste in a settings drawer for static deploy.
  - **Important**: Browser-side `fetch` to Anthropic API will hit CORS. Two options:
    1. **Static deploy** (GitHub Pages): user pastes their own key into a settings field, stored in `localStorage`. Add `anthropic-dangerous-direct-browser-access: true` header.
    2. **Vercel deploy** (recommended): use a Vercel serverless function `/api/chat` that holds `CLAUDE_API_KEY` server-side and proxies the request. Cleaner, safer.
  - Suggest going with the Vercel route since Ed already deploys there.
- **Deploy**: Vercel (serverless function for API proxy)

---

## 3. Core User Flow

1. **Format selection** — user picks Reel / Story / Post (or "let Claude decide")
2. **Idea input** — user types a content idea ("a peony tier cake reveal" / "behind the scenes of color mixing")
3. **Clarifying questions** — Claude asks 2–3 focused questions (e.g., "What's the occasion?" "Who's the audience — clients or fellow artists?" "What feeling should the viewer leave with?")
4. **User answers** in chat
5. **Generate storyboard** — Claude returns a frame-by-frame storyboard
6. **Display storyboard** — render as numbered cards, each card shows all production fields
7. **Actions** — copy to clipboard, regenerate, edit individual frames

---

## 4. Storyboard Frame Schema

Each frame must include all of these fields. Have Claude return JSON.

```json
{
  "format": "reel" | "story" | "post",
  "total_duration_seconds": 15,
  "concept": "One-line description of the overall narrative",
  "frames": [
    {
      "frame_number": 1,
      "duration_seconds": 2,
      "shot_description": "Close-up macro shot of a single buttercream petal being piped, hand entering frame from right",
      "camera_direction": "Static tripod, 90mm macro lens equivalent, soft side light",
      "on_screen_text": "petal by petal",
      "caption_segment": "(Optional) part of the overall caption tied to this frame",
      "audio_cue": "Ambient studio sound — soft piping squeeze, no music",
      "transition_in": "Cut",
      "transition_out": "Match cut to next petal"
    }
  ],
  "full_caption": "Full Instagram caption in Rice & Flower voice",
  "hashtags": ["#buttercreamflowers", "#cakeart", "#nycakedesigner"]
}
```

---

## 5. UI / Design Requirements

### Hard requirements
- **Base font size: 18pt** (set on `body`, scale others from this)
- **Match riceandflower.com aesthetic**:
  - Cream/paper background (`#faf7f2`)
  - Warm dark ink text (`#2a2620`)
  - Minimal, gallery-style layout
  - Generous whitespace
  - Serif display type (Cormorant Garamond or similar) for headers
  - Clean sans (Inter or similar) for body/UI
  - Hairline dividers, not heavy borders
  - No drop shadows, no gradients, no rounded-corner card stacks
  - Italicized taglines as accents
  - Em-dashes in copy

### Layout
- **Single-page tool**, no nav
- **Top**: Logo wordmark "RICE & FLOWER" + tagline "*Social Studio*"
- **Left column (40%)**: Format picker + chat interface
- **Right column (60%)**: Storyboard output (empty state shows a quiet prompt: "Your storyboard will appear here, frame by frame")
- **Mobile**: stack vertically

### Format picker
- Three options as elegant text buttons (not chunky cards):
  - `Reel — vertical, frame by frame`
  - `Story — sequential vertical frames`
  - `Post — single image or carousel`
  - `Let Claude decide`
- Selected state: underline + slight color shift, no fill

### Chat interface
- Messages alternate: user (right-aligned, lighter) / Claude (left-aligned, ink)
- No avatars, no bubbles — just typography and indentation
- Input field at bottom: hairline underline only, placeholder italic
- Send button: text "Send" or arrow glyph, no fill

### Storyboard display
- Numbered frames, vertical scroll
- Each frame card:
  - Frame number (large serif numeral, like a museum label)
  - Duration top-right
  - Fields below in a 2-col label/value layout: Shot, Camera, On-screen text, Caption, Audio, Transition in, Transition out
- Bottom of storyboard: full caption + hashtags in a separate panel
- Action row: `Copy storyboard` · `Regenerate` · `Export as text`

---

## 6. Claude API Prompt Structure

### System prompt
```
You are the creative director for Rice & Flower, an NYC designer flower cake studio. You help craft Instagram content that matches the studio's refined, atelier-style voice.

Voice rules:
- Atelier tone, never bakery — gallery curator, not food brand
- Painterly, sensory, restrained
- Em-dashes liberally; tricolons welcome
- No exclamation points, no emoji, no urgency
- "We/our" for studio voice; "I/my" when Seyun teaches
- Avoid: cute, salesy, level-up bro, trendy slang

You work in two modes:
1. Clarifying mode — ask 2–3 focused questions about an idea before storyboarding
2. Storyboard mode — return a JSON storyboard with the schema below

[insert frame schema]

Always return storyboards as valid JSON wrapped in ```json fences.
```

### Conversation flow
1. User sends idea → request clarifying questions (return as plain text, 2–3 questions)
2. User answers → request full storyboard (return JSON)
3. User asks for changes → return updated JSON

Track conversation state with a simple state machine: `idle → clarifying → ready → generated → revising`.

---

## 7. Build Order (suggested)

1. Static HTML shell with brand styles, format picker, and empty chat + storyboard panes
2. Vanilla JS state management (no framework needed — keep it simple)
3. Vercel serverless function `/api/chat` that proxies to Anthropic API
4. Wire up clarifying-question round trip
5. Wire up storyboard generation + JSON parsing + render
6. Add copy/export/regenerate actions
7. Polish: empty states, loading states (use italic serif "*piping…*" instead of spinners), error handling

---

## 8. Deferred / Phase 2

- Save storyboards to Supabase (Ed already uses it on OVERWATCH)
- Best-practice research context — Ed will paste this in later as a separate system prompt section
- Image references — let user upload a cake photo for visual context
- Export to PDF or Notion
- Multiple storyboard variants per idea (A/B options)
- Voice/tone strength slider
- Hashtag bank tuned to Rice & Flower's audience

---

## 9. Open Questions for Ed

- Server function on Vercel or static-only with user-pasted key? (Recommend Vercel)
- Storyboard JSON return — strict schema enforcement, or let Claude be looser?
- Single storyboard output, or generate 2–3 variants by default?
- Where does "best-practice research context" plug in — system prompt, or reference doc Claude pulls from?

---

## 10. Notes for Claude Code

- Read this whole spec before writing any code
- Build minimum viable version first — don't pre-optimize
- Match the riceandflower.com aesthetic as closely as possible without copying it directly
- 18pt base font is a hard requirement
- Use real fetch() to Anthropic API via Vercel serverless function — no mocking
- Keep the file count small. Single HTML/JS/CSS file + one serverless function is the goal for v1.
