import { NextRequest } from "next/server";
import OpenAI from "openai";

type SuggestRequest = { prompt?: string };
type SuggestResponse = {
  name: string;
  purpose: string;
  systemPrompt: string;
  toolkitSlugs: string[];
};

export async function POST(req: NextRequest) {
  try {
    const { prompt }: SuggestRequest = await req.json();
    const userPrompt = String(prompt || "").trim();
    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // Ask model to strictly return JSON for our schema.
    const sys = [
      "You are an assistant that analyzes a user's intent to configure an automation agent.",
      "Return STRICT JSON with keys: name, systemPrompt, toolkitSlugs (array of lowercase slugs).",
      "Do not include markdown or extra text. Do not wrap in code fences.",
      "Make name short and brand-safe. System prompt should be actionable and clear.",
      "Toolkits should be relevant composable integrations, expressed as lowercase slugs (e.g., gmail, slack, github, googledrive).",
    ].join(" ");

    const user = `User prompt: ${userPrompt}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    });

    const text = completion.choices?.[0]?.message?.content || "";

    // Try strict JSON parse; if model added any extra text, attempt to extract JSON block
    const tryParse = (input: string): any => {
      try {
        return JSON.parse(input);
      } catch {}
      const match = input.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
      }
      return null;
    };

    const parsed = tryParse(text);
    if (!parsed || typeof parsed !== "object") {
      // Fallback: minimal suggestion
      const fallback: SuggestResponse = {
        name: "My Agent",
        purpose: userPrompt,
        systemPrompt: "You are a helpful agent.",
        toolkitSlugs: [],
      };
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const name = String(parsed.name || "My Agent").slice(0, 80);
    const systemPrompt = String(parsed.systemPrompt || "You are a helpful agent.");
    const toolkitSlugs: string[] = Array.isArray(parsed.toolkitSlugs)
      ? parsed.toolkitSlugs.map((s: any) => String(s || "").toLowerCase()).filter(Boolean)
      : [];

    const payload: SuggestResponse = {
      name,
      purpose: userPrompt,
      systemPrompt,
      toolkitSlugs,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


