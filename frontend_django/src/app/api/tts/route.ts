import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json()
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not set on server" }), { status: 500 })
    }

    const vid = (voiceId as string) || "21m00Tcm4TlvDq8ikWAM" // default voice

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!resp.ok) {
      const msg = await resp.text()
      return new Response(JSON.stringify({ error: `TTS failed: ${resp.status} ${msg}` }), { status: 500 })
    }

    // Stream audio back to client
    return new Response(resp.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 })
  }
}
