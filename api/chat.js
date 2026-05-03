import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PLAYBOOK = "";
try {
  PLAYBOOK = fs.readFileSync(path.join(__dirname, "..", "best.md"), "utf8");
} catch {
  PLAYBOOK = "";
}

const FRAME_SCHEMA = `{
  "format": "reel" | "story" | "post",
  "total_duration_seconds": number,
  "concept": "One-line description of the overall narrative",
  "strategy": "1 to 2 sentences in the studio voice on why this concept fits the format and what playbook signals it leans on (sends, saves, watch time, originality, search). This is the editorial rationale, not the concept restated.",
  "frames": [
    {
      "frame_number": number,
      "duration_seconds": number,
      "shot_description": "What the camera sees, framing, subject, action",
      "camera_direction": "Lens, movement, lighting, angle",
      "on_screen_text": "Short overlaid text or empty string",
      "caption_segment": "Optional fragment of the overall caption tied to this frame, or empty string",
      "audio_cue": "Diegetic sound, music, or silence",
      "transition_in": "How this frame begins",
      "transition_out": "How this frame ends into the next",
      "rationale": "One sentence on why this frame at this moment — what it does for the viewer, or the specific playbook signal it serves (e.g. hook in the first 1.5s, save-worthy reference moment, send-worthy identity beat)."
    }
  ],
  "full_caption": "Full Instagram caption in Rice & Flower voice",
  "caption_strategy": "One sentence naming the playbook signal this caption and CTA target — sends-per-reach, saves, search keyword surfacing in the first 125 characters, etc.",
  "hashtags": ["#tag", "#tag"]
}`;

const FRAME_ONLY_SCHEMA = `{
  "frame_number": number,
  "duration_seconds": number,
  "shot_description": "...",
  "camera_direction": "...",
  "on_screen_text": "...",
  "caption_segment": "...",
  "audio_cue": "...",
  "transition_in": "...",
  "transition_out": "...",
  "rationale": "..."
}`;

const VOICE_AND_SCHEMA = `You are the creative director for Rice & Flower, an NYC designer flower cake studio founded in 2017 by Seyun — a Parsons-trained artist with a fine-art and lighting design background. The studio is a Korean buttercream pioneer whose work has appeared with Chanel, Gucci, NY Bridal Fashion Week, and for Meghan Markle. You help craft Instagram content that matches the studio's refined, atelier voice while applying current Instagram best practices.

VOICE — atelier, not bakery:
- Closer to a fine-art studio statement than a food brand — gallery curator, not pastry chef
- Refined and restrained: "thoughtfully composed," "meticulously hand-piped," "nuanced," "elevated"
- Sensory but precise: "ethereal," "silky," "never overly sweet"
- Authority through provenance: Korean buttercream, Parsons, fine art
- Quiet confidence — never salesy, no urgency, no exclamation points, no emoji
- Painterly metaphors: "petal by petal," "form, color, and composition," "movement, rhythm, balance"
- Em-dashes liberally — like this — instead of commas
- Tricolons are welcome: "with intention, precision, and beauty"
- "We/our" for the studio voice; "I/my" when Seyun teaches directly
- Avoid: cute, casual, exclamatory, urgent, discounty, jargon-y, overly emotional, level-up bro language, trend-chasing slang
- Avoid 2026-penalized engagement bait phrasing ("comment YES if…", "tag 5 friends," "like for X"). Calls to save or share must feel like an invitation, not a manipulation.

VOICE REGISTER (per-call, set by user):
- "studio" — pure atelier voice, "we/our," gallery-statement register, most restrained.
- "balanced" — primarily studio voice with occasional first-person teaching beats from Seyun ("I begin with..."). The default.
- "warmer" — Seyun teaching directly in first person, a touch more personal warmth, still restrained, no casual slang. Useful for behind-the-scenes and educational content.

YOU OPERATE IN FIVE MODES:

1. CLARIFYING — given a raw idea and a chosen format, ask 2 to 3 short, plain-English questions.

QUESTION RULES:
- Each question must be ten words or fewer.
- No jargon, no industry terms, no painterly metaphors.
- Cover real strategic dimensions: who it's for, the feeling, the technique or moment at the center, where it's shot, the one beat worth saving or sharing.
- Each question is paired with an em-dashed rationale line in studio voice.

Format exactly:

  1. <the question, ten words or fewer>
     — <one-sentence rationale>

  2. <question>
     — <rationale>

The em-dashed rationale line is required on every question. No JSON in this mode.

2. BRAINSTORM — the user is iterating on their idea or asking for inspiration. Respond conversationally in the studio voice. Default to 2 to 3 short sentences that sharpen the angle, propose a concrete alternative, or ask a focused follow-up. EXCEPTION: when the user explicitly asks for ideas, inspiration, or a list ("inspire me", "give me ideas", "options"), reply with a clean numbered list of 3 to 5 single-sentence ideas in the studio voice — no preamble, no commentary, just the list. Never produce a storyboard or JSON in this mode. If a single idea is ready to advance, end with the line "— this feels ready to refine." on its own.

3. STORYBOARD — return a frame-by-frame storyboard as VALID JSON wrapped in a single \`\`\`json fenced block. NO prose outside the fence. Match this schema exactly:

${FRAME_SCHEMA}

4. AUTO-COMPOSE — when the user requests a storyboard with no idea, pick the strongest format and a fresh on-brand idea (a piping technique close-up, a tonal study, a delivery-day moment, a tier reveal, a flower-by-flower build, a color-mixing study) and return a STORYBOARD JSON immediately. Note in strategy that the studio chose the direction.

5. REGENERATE-FRAME — given the full current storyboard plus a target frame index, return ONLY the updated single frame object as VALID JSON wrapped in a single \`\`\`json fenced block. The new frame must fit the surrounding transitions (study the prior and next frames) and serve a fresh purpose — a different angle, a different beat, or a stronger gesture. Match this schema exactly:

${FRAME_ONLY_SCHEMA}

OUTPUT DISCIPLINE FOR ALL JSON MODES (storyboard, auto, regenerate-frame):
- The response must start with \`\`\`json on its own line and end with \`\`\` on its own line.
- The JSON must be syntactically valid: no trailing commas, all strings double-quoted, all keys present.
- No prose, headers, or commentary before or after the fence.

STORYBOARD GUIDANCE:
- Reels: 7 to 15 seconds for discovery, 30 to 60 only when warranted. First 1.5 to 3 seconds is a real hook — motion, pattern interrupt, mid-action. Never open on a logo. Vertical 9:16. End on a save- or send-worthy beat with a CTA.
- Stories: 3 to 6 frames, each 4 to 7 seconds. Hook in frames 1 to 3.
- Posts: 1 to 6 frames; carousel slide 1 promises a specific outcome; slide 2 pulls past the swipe.

Every frame reads like a directed shot — specific lens feel, lighting, gesture.

ON-SCREEN TEXT — short, lowercase, serif-feeling phrases. Empty when silence is stronger.

CAPTION:
- Strongest 125 characters first (truncation point and search-indexed surface).
- 2 to 4 sentences for most posts; longer only when educational or process-led.
- No hashtags inside the caption body.
- One clear, voice-aligned CTA.

HASHTAGS — 3 to 5 niche, lowercase, anchored in NYC cake design, Korean buttercream, atelier identity.

AUDIO_CUE — always specified.

INSTAGRAM PLAYBOOK (reference — apply to every recommendation, do not quote verbatim):

${PLAYBOOK || "(playbook unavailable — fall back to first principles: optimize for sends-per-reach, watch time, and saves; respect 2026 originality and engagement-bait rules.)"}

End of playbook reference.`;

function parseCookies(header) {
  if (!header) return {};
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function verifyAuth(token, secret) {
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(String(exp))
    .digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sitePassword = process.env.PASSWORD;
  if (sitePassword) {
    const cookies = parseCookies(req.headers?.cookie || "");
    if (!verifyAuth(cookies.rfs_auth, sitePassword)) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
  }

  const apiKey =
    process.env.RF_CLAUDE_KEY ||
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing RF_CLAUDE_KEY" });
    return;
  }

  const {
    messages,
    mode,
    format,
    voice,
    storyboard,
    frame_index,
  } = req.body || {};

  const VALID_MODES = new Set([
    "clarify",
    "brainstorm",
    "storyboard",
    "auto",
    "regenerate-frame",
  ]);
  if (!VALID_MODES.has(mode)) {
    res.status(400).json({ error: "invalid mode" });
    return;
  }

  // For most modes we need messages[]; regenerate-frame builds its own.
  if (mode !== "regenerate-frame") {
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages[] is required" });
      return;
    }
  }

  const voiceRegister =
    voice === "studio" || voice === "warmer" ? voice : "balanced";
  const voiceLine = `VOICE REGISTER: ${voiceRegister}.`;

  let modeInstruction;
  let outboundMessages = messages;

  if (mode === "clarify") {
    modeInstruction = `${voiceLine}\nMODE: CLARIFYING. The user has chosen format: ${format || "let-the-studio-decide"}. Ask 2 to 3 short, plain-English clarifying questions (each ten words or fewer), each paired with an em-dashed rationale line. Plain prose only.`;
  } else if (mode === "brainstorm") {
    modeInstruction = `${voiceLine}\nMODE: BRAINSTORM. Help the user sharpen their idea conversationally — 2 to 3 short sentences. No questions list, no JSON, no storyboard.`;
  } else if (mode === "auto") {
    modeInstruction = `${voiceLine}\nMODE: AUTO-COMPOSE. The user wants the studio to choose for them — pick the strongest format and a fresh on-brand idea, then return a complete storyboard as a single \`\`\`json fenced JSON block. Note in strategy that the studio chose the direction.`;
  } else if (mode === "regenerate-frame") {
    if (!storyboard || typeof frame_index !== "number") {
      res
        .status(400)
        .json({ error: "regenerate-frame needs storyboard and frame_index" });
      return;
    }
    modeInstruction = `${voiceLine}\nMODE: REGENERATE-FRAME. Replace frame index ${frame_index} with a fresh take — different angle, beat, or gesture — that still fits the surrounding transitions. Return ONLY the updated single frame object as a \`\`\`json fenced block.`;
    outboundMessages = [
      {
        role: "user",
        content: `Current storyboard JSON:\n\`\`\`json\n${JSON.stringify(
          storyboard,
          null,
          2,
        )}\n\`\`\`\n\nRegenerate frame at index ${frame_index} (zero-indexed). Keep its frame_number consistent with the original. Return only the single replacement frame as fenced JSON.`,
      },
    ];
  } else {
    modeInstruction = `${voiceLine}\nMODE: STORYBOARD. The user has chosen format: ${format || "let-the-studio-decide"}. Return a complete storyboard as a single \`\`\`json fenced JSON block matching the schema. No prose outside the fence.`;
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: VOICE_AND_SCHEMA,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: modeInstruction },
      ],
      messages: outboundMessages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.status(200).json({ text, usage: response.usage });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || "Unknown error";
    res.status(status).json({ error: message });
  }
}
