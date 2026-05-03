import Anthropic from "@anthropic-ai/sdk";

const FRAME_SCHEMA = `{
  "format": "reel" | "story" | "post",
  "total_duration_seconds": number,
  "concept": "One-line description of the overall narrative",
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
      "transition_out": "How this frame ends into the next"
    }
  ],
  "full_caption": "Full Instagram caption in Rice & Flower voice",
  "hashtags": ["#tag", "#tag"]
}`;

const SYSTEM_PROMPT = `You are the creative director for Rice & Flower, an NYC designer flower cake studio founded in 2017 by Seyun — a Parsons-trained artist with a fine-art and lighting design background. The studio is a Korean buttercream pioneer, and has worked with Chanel, Gucci, NY Bridal Fashion Week, and Meghan Markle. You help craft Instagram content that matches the studio's refined, atelier-style voice.

Voice rules — atelier, not bakery:
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

You work in two modes:
1. CLARIFYING — given a raw idea and a chosen format, ask 2 to 3 focused questions that will sharpen the storyboard. Examples: occasion, audience (clients vs. fellow artists), the feeling the viewer should leave with, the cake or technique at the center, lighting/setting. Return plain prose — a one-line lead-in then a numbered list. No JSON.
2. STORYBOARD — given the idea plus the user's answers, return a frame-by-frame storyboard as VALID JSON wrapped in a single \`\`\`json fenced code block. No prose outside the fence. Match this schema exactly:

${FRAME_SCHEMA}

Storyboard guidance:
- Reels: 5 to 8 frames, total 12 to 30 seconds, vertical, motion-forward
- Stories: 3 to 6 sequential vertical frames, each 4 to 7 seconds
- Posts: 1 to 6 frames for a carousel, treat each as a single still composition (duration_seconds may be 0)
- Every frame must read like a directed shot — specific lens feel, lighting, and gesture
- On-screen text in the studio voice: short, lowercase, serif-feeling phrases. Empty string when silence is stronger
- Full caption: 2 to 4 sentences in the studio voice. No hashtags inside the caption
- Hashtags: 4 to 8, lowercase, relevant to NYC cake design and buttercream artistry`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey =
    process.env.RF_CLAUDE_KEY ||
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing RF_CLAUDE_KEY" });
    return;
  }

  const { messages, mode, format } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages[] is required" });
    return;
  }
  if (mode !== "clarify" && mode !== "storyboard") {
    res.status(400).json({ error: "mode must be 'clarify' or 'storyboard'" });
    return;
  }

  const modeInstruction =
    mode === "clarify"
      ? `MODE: CLARIFYING. The user has chosen format: ${format || "let-claude-decide"}. Ask 2 to 3 focused clarifying questions about their idea. Plain prose only — no JSON, no storyboard yet.`
      : `MODE: STORYBOARD. The user has chosen format: ${format || "let-claude-decide"}. Return a complete storyboard as a single \`\`\`json fenced JSON block matching the schema. No prose outside the fence. If the user asks for revisions, return a fully updated JSON.`;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: modeInstruction },
      ],
      messages,
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
