import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// AI essay feedback via the Anthropic API (direct fetch — no SDK needed).
// Requires ANTHROPIC_API_KEY in env. Degrades cleanly to a 503 with a
// friendly message if the key is absent.

const SYSTEM = `You are a Chinese HSK writing coach. Given an HSK student's essay (any HSK level, usually in Chinese with possible Pinyin and translation in Uzbek/Russian/English), respond with STRICT JSON only:

{
  "score": <integer 0-100>,
  "level_estimate": <"HSK1"|"HSK2"|"HSK3"|"HSK4"|"HSK5"|"HSK6">,
  "strengths": [<short string>, <short string>, ...],
  "weaknesses": [<short string>, <short string>, ...],
  "grammar_issues": [
    { "wrong": "...", "correct": "...", "explain": "..." }
  ],
  "suggested_revision": "<a corrected/improved Chinese version of the same essay>"
}

Reply in Uzbek for natural-language fields. Keep arrays under 5 items each. No prose outside the JSON.`;

type AnthropicResp = {
  content: { type: string; text?: string }[];
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI tez orada", message: "Server'da ANTHROPIC_API_KEY o'rnatilmagan. Admin bu funksiyani yoqishi kerak." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { prompt?: string; draft?: string };
  const draft = (body.draft ?? "").trim();
  if (!draft) return NextResponse.json({ error: "draft required" }, { status: 400 });
  if (draft.length > 4000) return NextResponse.json({ error: "draft too long (max 4000 chars)" }, { status: 400 });

  const userMsg =
    (body.prompt ? `Topshiriq:\n${body.prompt.trim()}\n\n` : "") +
    `Talaba inshosi:\n${draft}`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return NextResponse.json({ error: "AI xatosi", detail: text.slice(0, 300) }, { status: 502 });
  }
  const j = (await r.json()) as AnthropicResp;
  const raw = j.content?.find((c) => c.type === "text")?.text ?? "";

  // Extract the first JSON object from the response.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: "Javob tushunarsiz", raw: raw.slice(0, 200) }, { status: 502 });
  let parsed: unknown;
  try { parsed = JSON.parse(match[0]); }
  catch { return NextResponse.json({ error: "JSON xatosi", raw: raw.slice(0, 200) }, { status: 502 }); }

  // Persist to writing_reviews (best-effort — don't block the response).
  const p = parsed as { score?: number };
  await supabase.from("writing_reviews").insert({
    user_id: user.id,
    prompt: body.prompt ?? null,
    draft,
    score: typeof p.score === "number" ? p.score : null,
    feedback: parsed,
  });

  return NextResponse.json(parsed);
}

// GET → user's past reviews (newest first, up to 20).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("writing_reviews")
    .select("id, prompt, draft, score, feedback, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return NextResponse.json(data ?? []);
}
